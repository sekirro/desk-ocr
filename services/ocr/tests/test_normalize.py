from services.ocr.main import normalize_ocr_result


def test_normalizes_legacy_paddle_result():
    result = [
        [
            [
                [[10, 20], [90, 20], [90, 40], [10, 40]],
                ("设置", 0.98),
            ]
        ]
    ]

    payload = normalize_ocr_result(result, (100, 60))

    assert payload["image"] == {"width": 100, "height": 60}
    assert payload["lines"][0]["text"] == "设置"
    assert payload["words"][0]["text"] == "设置"
    assert payload["words"][0]["bbox"] == {
        "x": 10.0,
        "y": 20.0,
        "width": 80.0,
        "height": 20.0,
    }


def test_normalizes_predict_result_with_word_infos():
    result = [
        {
            "rec_texts": ["hello world"],
            "rec_scores": [0.91],
            "rec_polys": [[[0, 0], [100, 0], [100, 20], [0, 20]]],
            "rec_word_infos": [
                {
                    "words": ["hello", "world"],
                    "word_boxes": [
                        [[0, 0], [45, 0], [45, 20], [0, 20]],
                        [[55, 0], [100, 0], [100, 20], [55, 20]],
                    ],
                    "word_scores": [0.93, 0.9],
                }
            ],
        }
    ]

    payload = normalize_ocr_result(result, (100, 20))

    assert [word["text"] for word in payload["words"]] == ["hello", "world"]
    assert payload["lines"][0]["wordIds"] == [
        payload["words"][0]["id"],
        payload["words"][1]["id"],
    ]
