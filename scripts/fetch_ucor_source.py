#!/usr/bin/env python3
"""Obtener la fuente GPL oficial de μcor sin incluir firmware propietario."""
import argparse
import hashlib
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

LICENCE_PAGE = "https://ucor.net/licenses.html"
EXPECTED_SHA256 = "bef905c648db1f669b77f7e839af5cef4d8e1cc691c2866daa619611a281402b"
MAX_SIZE = 160 * 1024 * 1024


class ArchiveLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href", "")
            if ".tar.xz" in href.lower():
                self.hrefs.append(href)


def source_url(html: str) -> str:
    links = ArchiveLinks()
    links.feed(html)
    candidates = []
    for href in links.hrefs:
        url = urljoin(LICENCE_PAGE, href)
        parsed = urlparse(url)
        if (parsed.scheme == "https" and parsed.hostname in ("ucor.net", "www.ucor.net")
                and "gearmulator" in parsed.path.lower()
                and parsed.path.endswith(".tar.xz")):
            candidates.append(url)
    if len(set(candidates)) != 1:
        raise RuntimeError("No se encontró un enlace único a Gearmulator .tar.xz en la página de licencias.")
    return candidates[0]


def download(dest: Path) -> str:
    request = Request(LICENCE_PAGE, headers={"User-Agent": "OsTIrus-Web-CI/0.1"})
    with urlopen(request, timeout=30) as response:
        url = source_url(response.read(2_000_000).decode("utf-8", errors="replace"))
    print("Fuente GPL:", url)
    dest.parent.mkdir(parents=True, exist_ok=True)
    partial = dest.with_suffix(dest.suffix + ".partial")
    sha = hashlib.sha256()
    size = 0
    try:
        with urlopen(Request(url, headers={"User-Agent": "OsTIrus-Web-CI/0.1"}), timeout=120) as response:
            with partial.open("wb") as out:
                while chunk := response.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_SIZE:
                        raise RuntimeError("El archivo excede el tamaño máximo permitido.")
                    sha.update(chunk)
                    out.write(chunk)
        actual = sha.hexdigest()
        if actual != EXPECTED_SHA256:
            raise RuntimeError(f"SHA-256 inesperado: {actual}; no se usará el archivo.")
        partial.replace(dest)
        print(f"Archivo verificado: {size} bytes, SHA-256 {actual}")
    finally:
        if partial.exists():
            partial.unlink()
    return url


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--destination", required=True, type=Path)
    args = parser.parse_args()
    download(args.destination)


if __name__ == "__main__":
    main()
