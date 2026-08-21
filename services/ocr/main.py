from __future__ import annotations

import os
import tempfile
import uuid
from contextlib import suppress
from typing import Annotated, Any

# PaddleOCR 3.x downloads inference models on first use. Prefer the BOS mirror
# and skip hoster probing because the probing step can fail even when download
# URLs are reachable from a local network.
os.environ.setdefault("PADDLE_PDX_MODEL_SOURCE", "bos")
os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

SERVICE_NAME = "desk-ocr"
SERVICE_VERSION = "0.1.1"
MAX_IMAGE_BYTES = int(os.getenv("DESK_OCR_MAX_IMAGE_BYTES", str(20 * 1024 * 1024)))
MAX_IMAGE_PIXELS = int(os.getenv("DESK_OCR_MAX_IMAGE_PIXELS", "40000000"))
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

app = FastAPI(title="Desk OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "file://",
        "null",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["content-type"],
)

_ocr_engine: Any | None = None


def polygon_to_bbox(points: list[list[float]]) -> dict[str, float]:
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]

    return {
        "x": min(xs),
        "y": min(ys),
        "width": max(xs) - min(xs),
        "height": max(ys) - min(ys),
    }


def box_to_polygon(box: Any) -> list[list[float]]:
    if box is None:
        return []

    if hasattr(box, "tolist"):
        box = box.tolist()

    if len(box) == 4 and all(isinstance(value, (int, float)) for value in box):
        x1, y1, x2, y2 = [float(value) for value in box]
        return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]

    points: list[list[float]] = []
    for point in box:
        if hasattr(point, "tolist"):
            point = point.tolist()
        if len(point) >= 2:
            points.append([float(point[0]), float(point[1])])
    return points


def value_at(container: Any, *names: str) -> Any:
    for name in names:
        if isinstance(container, dict) and name in container:
            return container[name]
        try:
            return container[name]
        except Exception:
            pass
        if hasattr(container, name):
            return getattr(container, name)
    return None


def as_plain(value: Any) -> Any:
    if hasattr(value, "tolist"):
        return value.tolist()
    return value


def make_word(
    line_id: str,
    text: str,
    confidence: float,
    polygon: list[list[float]],
) -> dict[str, Any]:
    return {
        "id": f"word_{uuid.uuid4().hex}",
        "lineId": line_id,
        "text": text,
        "confidence": confidence,
        "polygon": polygon,
        "bbox": polygon_to_bbox(polygon),
    }


def normalize_word_infos(
    word_info: Any,
    line_id: str,
    fallback_confidence: float,
) -> list[dict[str, Any]]:
    word_info = as_plain(word_info)
    if not word_info:
        return []

    words: list[dict[str, Any]] = []

    if isinstance(word_info, dict):
        texts = value_at(word_info, "words", "word_texts", "texts", "rec_texts") or []
        boxes = value_at(word_info, "word_boxes", "word_polys", "boxes", "polys") or []
        scores = value_at(word_info, "word_scores", "scores", "rec_scores") or []

        for index, text in enumerate(texts):
            polygon = box_to_polygon(boxes[index] if index < len(boxes) else None)
            if not text or not polygon:
                continue
            confidence = float(scores[index]) if index < len(scores) else fallback_confidence
            words.append(make_word(line_id, str(text), confidence, polygon))
        return words

    if isinstance(word_info, list):
        for entry in word_info:
            entry = as_plain(entry)
            if isinstance(entry, dict):
                text = value_at(entry, "text", "word", "rec_text")
                box = value_at(entry, "box", "bbox", "polygon", "poly")
                score = value_at(entry, "confidence", "score", "rec_score")
                polygon = box_to_polygon(box)
                if text and polygon:
                    words.append(
                        make_word(
                            line_id,
                            str(text),
                            float(score) if score is not None else fallback_confidence,
                            polygon,
                        )
                    )
                continue

            if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                first, second = entry[0], entry[1]
                text = first if isinstance(first, str) else None
                box = second
                if text is None and isinstance(second, str):
                    text = second
                    box = first
                polygon = box_to_polygon(box)
                if text and polygon:
                    words.append(make_word(line_id, str(text), fallback_confidence, polygon))

    return words


def add_line(
    lines: list[dict[str, Any]],
    words: list[dict[str, Any]],
    text: str,
    confidence: float,
    polygon: list[list[float]],
    word_info: Any = None,
) -> None:
    if not text or not polygon:
        return

    line_id = f"line_{uuid.uuid4().hex}"
    line_words = normalize_word_infos(word_info, line_id, confidence)

    if not line_words:
        line_words = [make_word(line_id, text, confidence, polygon)]

    words.extend(line_words)
    lines.append(
        {
            "id": line_id,
            "text": text,
            "confidence": confidence,
            "polygon": polygon,
            "bbox": polygon_to_bbox(polygon),
            "wordIds": [word["id"] for word in line_words],
        }
    )


def normalize_legacy_result(
    result: Any,
    image_size: tuple[int, int],
) -> dict[str, Any]:
    lines: list[dict[str, Any]] = []
    words: list[dict[str, Any]] = []

    pages = result if isinstance(result, list) else [result]
    if len(pages) == 1 and isinstance(pages[0], list):
        first_page = pages[0]
        if first_page and isinstance(first_page[0], (list, tuple)):
            pages = [first_page]

    for page in pages:
        if not page:
            continue
        for raw_line in page:
            raw_line = as_plain(raw_line)
            if not isinstance(raw_line, (list, tuple)) or len(raw_line) < 2:
                continue

            polygon = box_to_polygon(raw_line[0])
            payload = raw_line[1]
            text = ""
            confidence = 0.0
            word_info = raw_line[2] if len(raw_line) > 2 else None

            if isinstance(payload, (list, tuple)) and payload:
                text = str(payload[0])
                if len(payload) > 1:
                    confidence = float(payload[1])
            else:
                text = str(payload)

            add_line(lines, words, text, confidence, polygon, word_info)

    return {
        "image": {"width": image_size[0], "height": image_size[1]},
        "lines": lines,
        "words": words,
    }


def normalize_predict_result(
    result: Any,
    image_size: tuple[int, int],
) -> dict[str, Any]:
    lines: list[dict[str, Any]] = []
    words: list[dict[str, Any]] = []

    pages = result if isinstance(result, list) else [result]

    for page in pages:
        page = as_plain(page)
        texts = value_at(page, "rec_texts", "texts") or []
        scores = value_at(page, "rec_scores", "scores") or []
        polygons = value_at(page, "rec_polys", "dt_polys", "polys", "boxes", "rec_boxes") or []
        word_infos = value_at(page, "rec_word_infos", "word_infos", "words") or []

        if not texts or not polygons:
            continue

        for index, text in enumerate(texts):
            polygon = box_to_polygon(polygons[index] if index < len(polygons) else None)
            confidence = float(scores[index]) if index < len(scores) else 0.0
            word_info = word_infos[index] if index < len(word_infos) else None
            add_line(lines, words, str(text), confidence, polygon, word_info)

    return {
        "image": {"width": image_size[0], "height": image_size[1]},
        "lines": lines,
        "words": words,
    }


def normalize_ocr_result(result: Any, image_size: tuple[int, int]) -> dict[str, Any]:
    predicted = normalize_predict_result(result, image_size)
    if predicted["lines"]:
        return predicted
    return normalize_legacy_result(result, image_size)


def get_ocr_engine() -> Any:
    global _ocr_engine

    if _ocr_engine is not None:
        return _ocr_engine

    from paddleocr import PaddleOCR

    common_kwargs = {
        "lang": "ch",
        "return_word_box": True,
        # PaddleOCR enables oneDNN by default on CPU. PaddlePaddle 3.3.x can
        # fail on Windows while converting PIR attributes in that backend.
        # The standard CPU kernels are slower but stable for screenshot OCR.
        "enable_mkldnn": False,
        "use_doc_orientation_classify": False,
        "use_doc_unwarping": False,
        "use_textline_orientation": False,
        "text_detection_model_name": os.getenv(
            "DESK_OCR_TEXT_DETECTION_MODEL", "PP-OCRv5_mobile_det"
        ),
        "text_recognition_model_name": os.getenv(
            "DESK_OCR_TEXT_RECOGNITION_MODEL", "PP-OCRv5_mobile_rec"
        ),
    }

    candidates = [
        common_kwargs,
        {
            "lang": "ch",
            "return_word_box": True,
            "enable_mkldnn": False,
            "use_doc_orientation_classify": False,
            "use_doc_unwarping": False,
            "use_textline_orientation": False,
        },
        {"lang": "ch", "return_word_box": True, "enable_mkldnn": False},
        {"lang": "ch"},
    ]

    last_error: Exception | None = None
    for kwargs in candidates:
        try:
            _ocr_engine = PaddleOCR(**kwargs)
            return _ocr_engine
        except TypeError as exc:
            last_error = exc

    raise RuntimeError(f"PaddleOCR 初始化失败: {last_error}")


def run_paddle_ocr(image_path: str) -> Any:
    engine = get_ocr_engine()

    if hasattr(engine, "predict"):
        try:
            return engine.predict(input=image_path)
        except TypeError:
            return engine.predict(image_path)

    if hasattr(engine, "ocr"):
        try:
            return engine.ocr(image_path, cls=True)
        except TypeError:
            return engine.ocr(image_path)

    raise RuntimeError("当前 PaddleOCR 对象没有可用的 predict 或 ocr 方法")


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
    }


@app.post("/ocr")
async def ocr(file: Annotated[UploadFile, File(...)]) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="请上传图片文件")

    image_bytes = await file.read(MAX_IMAGE_BYTES + 1)
    await file.close()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="图片为空")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        max_megabytes = MAX_IMAGE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"图片超过 {max_megabytes} MB 上传限制",
        )

    suffix = os.path.splitext(file.filename or "")[1].lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}:
        suffix = ".img"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(image_bytes)
        temp_path = temp_file.name

    try:
        try:
            with Image.open(temp_path) as image:
                image.verify()
            with Image.open(temp_path) as image:
                image_size = image.size
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
            raise HTTPException(status_code=400, detail="无法解析图片文件") from exc

        if image_size[0] * image_size[1] > MAX_IMAGE_PIXELS:
            raise HTTPException(status_code=413, detail="图片像素尺寸过大")

        try:
            result = run_paddle_ocr(temp_path)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"OCR 失败: {exc}") from exc

        return normalize_ocr_result(result, image_size)
    finally:
        with suppress(FileNotFoundError):
            os.unlink(temp_path)
