import anthropic
import json
import re
from config import settings

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

SYSTEM_PROMPT = """You are a quantitative trading strategy assistant. Convert natural language strategy descriptions into a structured JSON config for a backtesting platform.

Output ONLY valid JSON in this exact format:
{
  "mode": "visual",
  "rules": {
    "entry": [
      {
        "indicator": "SMA",
        "params": {"period": 50},
        "operator": "crosses_above",
        "target": {"indicator": "SMA", "params": {"period": 200}}
      }
    ],
    "exit": [
      {
        "indicator": "RSI",
        "params": {"period": 14},
        "operator": ">",
        "target": {"value": 70}
      }
    ],
    "logic": "AND"
  },
  "position_sizing": {"type": "percent", "value": 100}
}

Valid indicators: SMA, EMA, RSI, MACD, MACD_SIGNAL, BB_UPPER, BB_LOWER, CLOSE, VOLUME
Valid operators: >, <, >=, <=, crosses_above, crosses_below
For target: use {"value": N} for numeric threshold, or {"indicator": "...", "params": {...}} for indicator comparison."""


def generate_strategy(description: str) -> dict:
    message = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": description}],
    )
    text = message.content[0].text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError("Could not parse strategy from AI response")
