from config import Settings


def test_cors_origins_list_splits_comma_separated_values():
    s = Settings(cors_origins="http://localhost:5173,https://example.com")
    assert s.cors_origins_list == ["http://localhost:5173", "https://example.com"]


def test_cors_origins_list_strips_whitespace():
    s = Settings(cors_origins="http://localhost:5173, https://example.com ")
    assert s.cors_origins_list == ["http://localhost:5173", "https://example.com"]


def test_cors_origins_list_single_origin():
    s = Settings(cors_origins="http://localhost:5173")
    assert s.cors_origins_list == ["http://localhost:5173"]


def test_cors_origins_list_ignores_empty_entries():
    s = Settings(cors_origins="http://localhost:5173,,https://example.com")
    assert s.cors_origins_list == ["http://localhost:5173", "https://example.com"]
