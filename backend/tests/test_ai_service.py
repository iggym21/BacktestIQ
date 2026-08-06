import json
import pytest
from unittest.mock import MagicMock
import services.ai_service as ai_service


def _mock_response(text: str):
    message = MagicMock()
    message.content = [MagicMock(text=text)]
    return message


def test_generate_strategy_parses_clean_json(monkeypatch):
    payload = {"mode": "visual", "rules": {"entry": [], "exit": [], "logic": "AND"}}
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _mock_response(json.dumps(payload))
    monkeypatch.setattr(ai_service, "_client", fake_client)

    result = ai_service.generate_strategy("buy when SMA crosses")
    assert result == payload


def test_generate_strategy_extracts_json_from_surrounding_prose(monkeypatch):
    """Claude sometimes wraps the JSON in explanation text or markdown code
    fences despite the system prompt saying "Output ONLY valid JSON" — the
    regex fallback exists specifically to recover from that."""
    payload = {"mode": "visual", "rules": {"entry": [], "exit": [], "logic": "OR"}}
    wrapped = f"Here's the strategy:\n```json\n{json.dumps(payload)}\n```\nLet me know if you'd like changes."
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _mock_response(wrapped)
    monkeypatch.setattr(ai_service, "_client", fake_client)

    result = ai_service.generate_strategy("some description")
    assert result == payload


def test_generate_strategy_raises_when_response_has_no_json(monkeypatch):
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _mock_response("I'm not sure how to do that.")
    monkeypatch.setattr(ai_service, "_client", fake_client)

    with pytest.raises(ValueError):
        ai_service.generate_strategy("gibberish request")


def test_generate_strategy_raises_cleanly_on_multiple_json_blocks(monkeypatch):
    """The regex fallback is greedy (first '{' to last '}'), so a response with
    two separate JSON-ish blocks (e.g. an inline example plus the real answer)
    produces a malformed merged blob. That must still surface as the same
    clean ValueError, not a raw json.JSONDecodeError leaking the parser's
    internal message."""
    text = 'For example {"a": 1} but the real answer is {"mode": "visual"}'
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _mock_response(text)
    monkeypatch.setattr(ai_service, "_client", fake_client)

    with pytest.raises(ValueError, match="Could not parse strategy"):
        ai_service.generate_strategy("some description")


def test_generate_strategy_sends_the_description_to_the_model(monkeypatch):
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _mock_response('{"mode": "visual"}')
    monkeypatch.setattr(ai_service, "_client", fake_client)

    ai_service.generate_strategy("buy AAPL on golden cross")

    _, kwargs = fake_client.messages.create.call_args
    assert kwargs["messages"] == [{"role": "user", "content": "buy AAPL on golden cross"}]
    assert "system" in kwargs
