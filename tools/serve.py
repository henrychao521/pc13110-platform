#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PC13110 靜態檔案伺服器 — 含 AR 模型的正確 MIME 類型。

iOS 的 AR Quick Look 要求 .usdz 以「model/vnd.usdz+zip」提供;
若用 `python3 -m http.server` 會回 application/octet-stream,
iPhone 點 AR 按鈕可能變成下載檔案而非進入 AR。

用法:
  python3 tools/serve.py [port]     # 預設 8080
啟動後用 iPhone Safari 連「區域網路」那個網址即可測試 AR。
零相依,僅用 Python 標準庫;從 repo 根目錄提供檔案(與執行位置無關)。
"""
import http.server
import functools
import socket
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.usdz': 'model/vnd.usdz+zip',
        '.glb': 'model/gltf-binary',
        '.gltf': 'model/gltf+json',
    }


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return None


if __name__ == '__main__':
    handler = functools.partial(Handler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), handler)
    print('=' * 54)
    print(' PC13110 靜態伺服器(含 USDZ/GLB MIME)已啟動')
    print(f' 本機:      http://localhost:{PORT}')
    ip = lan_ip()
    if ip:
        print(f' 區域網路:  http://{ip}:{PORT}   (iPhone 連這個測 AR)')
    print(' 停止伺服器:Ctrl + C')
    print('=' * 54)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
