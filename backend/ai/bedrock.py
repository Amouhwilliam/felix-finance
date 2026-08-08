"""AWS Bedrock AI provider — supports any Bedrock model (DeepSeek V3, Claude, etc.)."""
import json
import logging
from typing import Optional

from ai.base import AIProvider, AIInsightResult, StockContext

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "Tu es un analyste financier spécialisé dans les marchés boursiers africains (BRVM, UEMOA). "
    "Tes analyses sont factuelles, neutres et basées sur les données de prix disponibles. "
    "Tu réponds toujours en JSON valide, jamais en Markdown."
)

def _build_user_prompt(ctx: StockContext) -> str:
    lines = [
        f"Action : {ctx.name} ({ctx.ticker}) — {ctx.exchange}",
        f"Secteur : {ctx.sector}",
        f"Prix actuel : {ctx.current_price:,.0f} FCFA",
        f"Variation du jour : {ctx.change_pct_today:+.2f} %",
    ]
    if ctx.change_pct_1m is not None:
        lines.append(f"Variation 1 mois : {ctx.change_pct_1m:+.1f} %")
    if ctx.change_pct_1y is not None:
        lines.append(f"Variation 1 an : {ctx.change_pct_1y:+.1f} %")
    if ctx.price_52w_high and ctx.price_52w_low:
        lines.append(f"Plus haut 52 sem. : {ctx.price_52w_high:,.0f} FCFA")
        lines.append(f"Plus bas 52 sem.  : {ctx.price_52w_low:,.0f} FCFA")

    lines.append(
        "\nSur la base des données ci-dessus, génère une analyse courte (2-3 phrases) "
        "et une recommandation consensus (achat/conservation/vente en %). "
        "Réponds UNIQUEMENT avec ce JSON (aucun autre texte) :\n"
        '{"sentiment": "bullish"|"neutral"|"bearish", '
        '"insight_text": "...(en français)...", '
        '"insight_text_en": "...(in English)...", '
        '"buy_pct": <int>, "hold_pct": <int>, "sell_pct": <int>}'
    )
    return "\n".join(lines)


def _parse_response(raw: str) -> Optional[AIInsightResult]:
    """Extract JSON from model response, handling markdown fences."""
    text = raw.strip()
    # Strip ```json fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    try:
        data = json.loads(text)
        sentiment = data.get("sentiment", "neutral")
        if sentiment not in ("bullish", "neutral", "bearish"):
            sentiment = "neutral"
        buy = int(data.get("buy_pct", 33))
        hold = int(data.get("hold_pct", 34))
        sell = int(data.get("sell_pct", 33))
        # Normalise so they sum to 100
        total = buy + hold + sell
        if total != 100 and total > 0:
            buy = round(buy * 100 / total)
            hold = round(hold * 100 / total)
            sell = 100 - buy - hold
        return AIInsightResult(
            sentiment=sentiment,
            insight_text=data.get("insight_text", ""),
            insight_text_en=data.get("insight_text_en") or None,
            buy_pct=buy,
            hold_pct=hold,
            sell_pct=sell,
        )
    except Exception as e:
        logger.warning("Failed to parse AI response: %s | raw=%s", e, raw[:200])
        return None


class BedrockProvider(AIProvider):
    """
    Calls any AWS Bedrock model using the converse API.
    Works with DeepSeek V3, Claude 3.x, Llama, Mistral, etc.
    Model is selected via the model_id constructor argument.
    """

    def __init__(self, model_id: str, region: str = "us-east-1"):
        import boto3
        self._client = boto3.client("bedrock-runtime", region_name=region)
        self._model_id = model_id
        self._region = region

    @property
    def provider_name(self) -> str:
        return f"bedrock:{self._model_id}"

    def generate_insight(self, ctx: StockContext) -> AIInsightResult:
        prompt = _build_user_prompt(ctx)
        try:
            response = self._client.converse(
                modelId=self._model_id,
                system=[{"text": SYSTEM_PROMPT}],
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"maxTokens": 512, "temperature": 0.3},
            )
            raw = response["output"]["message"]["content"][0]["text"]
            result = _parse_response(raw)
            if result:
                return result
        except Exception as e:
            logger.error("Bedrock generate_insight failed for %s: %s", ctx.ticker, e)

        # Fallback neutral response
        return AIInsightResult(
            sentiment="neutral",
            insight_text=(
                f"{ctx.name} ({ctx.ticker}) est actuellement à {ctx.current_price:,.0f} FCFA "
                f"avec une variation de {ctx.change_pct_today:+.2f} % aujourd'hui. "
                "Analyse IA temporairement indisponible."
            ),
            insight_text_en=(
                f"{ctx.name} ({ctx.ticker}) is currently at {ctx.current_price:,.0f} FCFA "
                f"with a {ctx.change_pct_today:+.2f}% change today. "
                "AI analysis temporarily unavailable."
            ),
            buy_pct=33,
            hold_pct=34,
            sell_pct=33,
        )
