"""Apify: competitors' current US search ads from Google's Ads Transparency Center.

Verified Sep 2026: the Meta Ad Library hides Rx drug ad copy from logged-out scrapers (only metadata comes back),
so we use Google's transparency data instead. The actor `s-r/google-ads-transparency` (community-maintained,
$0.0015 per ad) returns each text ad as a rendered PNG; Claude reads the images. Every run has a hard spend cap."""

import httpx

from app.config import settings

API = "https://api.apify.com/v2"
GOOGLE_ADS_ACTOR = "s-r~google-ads-transparency"


class ApifyError(RuntimeError):
    pass


async def run_sync(actor: str, actor_input: dict, max_charge_usd: float = 0.05, timeout_s: int = 240) -> list[dict]:
    """Run an actor and return its dataset items in one call (capped spend)."""
    async with httpx.AsyncClient(timeout=timeout_s + 30) as c:
        r = await c.post(f"{API}/acts/{actor}/run-sync-get-dataset-items",
                         params={"timeout": timeout_s, "maxTotalChargeUsd": max_charge_usd, "format": "json", "clean": "true"},
                         headers={"Authorization": f"Bearer {settings.apify_token}"}, json=actor_input)
    if r.status_code not in (200, 201):
        raise ApifyError(f"Apify {actor}: HTTP {r.status_code} {r.text[:200]}")
    return r.json()


async def google_search_ads(domain: str, limit: int = 5) -> list[dict]:
    """The advertiser's US ads that point at this domain: [{advertiser, first_shown, last_shown, image_url, url}]."""
    items = await run_sync(GOOGLE_ADS_ACTOR, {"domain": domain, "region": "US", "ads_count": limit,
                                              "detail": False, "political": False},
                           max_charge_usd=round(0.0015 * limit + 0.01, 3))
    ads = []
    for it in items:
        if it.get("image_url"):
            ads.append({"advertiser": it.get("advertiser_name", ""), "first_shown": it.get("first_shown", ""),
                        "last_shown": it.get("last_shown", ""), "format": it.get("format", ""),
                        "image_url": it["image_url"], "url": it.get("deeplink", ""),
                        "id": it.get("creative_id", "")})
    return ads[:limit]
