"""Is it a website? Checked before anything runs or replays: a real domain name that resolves to public addresses and
answers over HTTP. Anything else gets a plain message and no job.

The check connects from our server, so it refuses loopback, private and link-local addresses, and never follows
redirects (a public site could redirect to an internal one). It only learns whether something answered."""

import asyncio
import ipaddress
import re
import socket
from urllib.parse import urlsplit

import httpx
from fastapi import HTTPException

# example.com, www.acme-pharma.co.uk, xn--...: labels of letters, digits and inner hyphens, then a TLD
HOSTNAME = re.compile(r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$")
BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"


def _bad(message: str) -> HTTPException:
    return HTTPException(422, message)


def parse(raw: str) -> tuple[str, str]:
    """(hostname, path) of what someone typed, or 422. Accepts 'acme.com', 'https://www.acme.com/us/'."""
    raw = raw.strip()
    if not raw or len(raw) > 2000 or any(c.isspace() for c in raw):
        raise _bad("That doesn't look like a website address. Try something like acmepharma.com.")
    parts = urlsplit(raw if re.match(r"^[a-z][a-z0-9+.-]*://", raw, re.I) else "https://" + raw)
    try:
        port = parts.port
    except ValueError:
        port = -1
    if parts.scheme.lower() not in ("http", "https") or parts.username or parts.password or port not in (None, 80, 443):
        raise _bad("That doesn't look like a website address. Try something like acmepharma.com.")
    host = (parts.hostname or "").rstrip(".")
    try:
        host = host.encode("idna").decode("ascii").lower()
    except UnicodeError:
        host = ""
    if not HOSTNAME.match(host) or len(host) > 253:
        raise _bad("That doesn't look like a website address. Try something like acmepharma.com.")
    return host, parts.path.rstrip("/")


async def _resolve(host: str) -> list[str]:
    try:
        infos = await asyncio.wait_for(
            asyncio.get_running_loop().getaddrinfo(host, 443, type=socket.SOCK_STREAM), timeout=5)
    except (socket.gaierror, TimeoutError, UnicodeError):
        return []
    return sorted({info[4][0] for info in infos})


async def _answers(url: str) -> bool:
    """Did anything answer at this URL? Any HTTP status counts: bot walls (403) and redirects are still websites."""
    try:
        async with httpx.AsyncClient(timeout=8, follow_redirects=False, headers={"User-Agent": BROWSER_UA}) as c:
            async with c.stream("GET", url):
                return True
    except httpx.HTTPError:
        return False


async def check(raw: str) -> str:
    """The website as a URL to crawl (https unless only http answers), or 422 with a message for the person."""
    host, path = parse(raw)
    addresses = await _resolve(host)
    if not addresses:
        raise _bad(f"We couldn't find a website at {host}. Check the spelling.")
    if not all(ipaddress.ip_address(a.split("%")[0]).is_global for a in addresses):
        raise _bad(f"{host} isn't a public website.")
    for scheme in ("https", "http"):
        if await _answers(f"{scheme}://{host}{path or '/'}"):
            return f"{scheme}://{host}{path}"
    raise _bad(f"{host} didn't respond. Check the address, or try again in a minute.")
