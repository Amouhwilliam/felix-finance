"""OpenAI-compatible provider (OpenAI, Groq, Together, etc.)."""
import logging
from typing import Optional

from ai.base import AIProvider, AIInsightResult, StockContext
from ai.bedrock import _build_user_prompt, _parse_response, SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProvider):
    """
    Calls any OpenAI-compatible API.
    Works with OpenAI, Groq, Together AI, local Ollama, etc.
    """

    def __init__(self, model: str = "gpt-4o-mini", api_key: Optional[str] = None, base_url: Optional[str] = None):
        from openai import OpenAI
        self._model = model
        kwargs = {}
        if api_key:
            kwargs["api_key"] = api_key
        if base_url:
            kwargs["base_url"] = base_url
        self._client = OpenAI(**kwargs)

    @property
    def provider_name(self) -> str:
        return f"openai:{self._model}"

    def generate_insight(self, ctx: StockContext) -> AIInsightResult:
        prompt = _build_user_prompt(ctx)
        try:
            completion = self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=512,
                temperature=0.3,
            )
            raw = completion.choices[0].message.content or ""
            result = _parse_response(raw)
            if result:
                return result
        except Exception as e:
            logger.error("OpenAI generate_insight failed for %s: %s", ctx.ticker, e)

        return AIInsightResult(
            sentiment="neutral",
            insight_text=f"Analyse IA temporairement indisponible pour {ctx.ticker}.",
            insight_text_en=f"AI analysis temporarily unavailable for {ctx.ticker}.",
            buy_pct=33, hold_pct=34, sell_pct=33,
        )
