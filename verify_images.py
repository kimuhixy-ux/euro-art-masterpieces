#!/usr/bin/env python3
"""paintings.json内の全imageFileがWikimedia Commonsで実在するか検証する。

各作品について https://commons.wikimedia.org/wiki/Special:FilePath/{imageFile}?width=1200
にHEADリクエストを送り、200以外(リダイレクト先エラー含む)を「リンク切れ」として報告する。
"""
import json
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

DATA_PATH = Path(__file__).parent / "data" / "paintings.json"
BASE_URL = "https://commons.wikimedia.org/wiki/Special:FilePath/"
USER_AGENT = "euro-art-masterpieces-verify/1.0 (personal educational PWA project)"
REQUEST_INTERVAL = 1.0  # 秒。Wikimediaのレート制限(429)を避けるための最低間隔
MAX_RETRIES = 4


def build_url(image_file: str, width: int = 1200) -> str:
    encoded = urllib.parse.quote(image_file)
    return f"{BASE_URL}{encoded}?width={width}"


def check_url(url: str) -> tuple[bool, str]:
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
    last_status = ""
    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.status == 200, str(resp.status)
        except urllib.error.HTTPError as e:
            last_status = str(e.code)
            if e.code == 429:
                time.sleep(3 * (attempt + 1))
                continue
            return False, last_status
        except urllib.error.URLError as e:
            last_status = str(e.reason)
            time.sleep(2 * (attempt + 1))
            continue
    return False, last_status


def main() -> int:
    paintings = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    print(f"検証対象: {len(paintings)}件\n")

    broken = []
    for i, p in enumerate(paintings, 1):
        image_file = p["imageFile"]
        url = build_url(image_file)
        ok, status = check_url(url)
        mark = "OK" if ok else "NG"
        print(f"[{i:3}/{len(paintings)}] {mark} ({status}) {p['id']} :: {image_file}")
        if not ok:
            broken.append({"id": p["id"], "imageFile": image_file, "url": url, "status": status})
        time.sleep(REQUEST_INTERVAL)

    print("\n=== 結果 ===")
    print(f"OK: {len(paintings) - len(broken)}件 / NG: {len(broken)}件")

    if broken:
        print("\n--- リンク切れ一覧 ---")
        for b in broken:
            print(f"- {b['id']}: {b['imageFile']} (status={b['status']})")
            print(f"  {b['url']}")
        return 1

    print("\n全ての画像URLが確認できました。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
