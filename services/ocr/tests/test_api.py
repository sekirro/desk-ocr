from io import BytesIO

import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image

from services.ocr import main

pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=main.app),
        base_url="http://testserver",
    ) as api_client:
        yield api_client


def make_png() -> bytes:
    output = BytesIO()
    Image.new("RGB", (32, 16), "white").save(output, format="PNG")
    return output.getvalue()


async def test_health_identifies_the_service(client):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "desk-ocr",
        "version": "0.1.1",
    }


async def test_rejects_non_image_uploads(client):
    response = await client.post(
        "/ocr",
        files={"file": ("notes.txt", b"not an image", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "请上传图片文件"


async def test_rejects_invalid_image_content(client):
    response = await client.post(
        "/ocr",
        files={"file": ("broken.png", b"not an image", "image/png")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "无法解析图片文件"


async def test_rejects_uploads_over_the_configured_limit(client, monkeypatch):
    monkeypatch.setattr(main, "MAX_IMAGE_BYTES", 4)

    response = await client.post(
        "/ocr",
        files={"file": ("large.png", b"12345", "image/png")},
    )

    assert response.status_code == 413


async def test_returns_normalized_ocr_payload(client, monkeypatch):
    monkeypatch.setattr(
        main,
        "run_paddle_ocr",
        lambda _path: [
            {
                "rec_texts": ["Desk OCR"],
                "rec_scores": [0.99],
                "rec_polys": [[[1, 2], [30, 2], [30, 12], [1, 12]]],
            }
        ],
    )

    response = await client.post(
        "/ocr",
        files={"file": ("sample.png", make_png(), "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["image"] == {"width": 32, "height": 16}
    assert payload["lines"][0]["text"] == "Desk OCR"
    assert payload["words"][0]["text"] == "Desk OCR"


async def test_cors_only_allows_the_desktop_renderer_origins(client):
    allowed = await client.get(
        "/health",
        headers={"Origin": "http://localhost:5173"},
    )
    denied = await client.get(
        "/health",
        headers={"Origin": "https://example.com"},
    )

    assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "access-control-allow-origin" not in denied.headers
