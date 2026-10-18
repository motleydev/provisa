#!/usr/bin/env python3
"""Serve site/ the way Cloudflare Pages does, for the verify scripts.

`python3 -m http.server` is enough for the scripts that request a file
(`/why/governance.html`) or a directory index (`/platform/`). It is not enough
for the ones that request the production route — `/why/interfaces` 404s there,
because the extensionless-to-`.html` resolution is Pages' and not the stdlib
handler's. The nav links are extensionless, so the route is what the page is
actually asked for, and asserting on it is the point.

    python3 site/design-system/serve.py 8731 &
    node site/design-system/verify-page-interfaces.mjs http://127.0.0.1:8731

Resolution order matches Pages: the exact path, then `<path>.html`, then
`<path>/index.html`. `_redirects` is not honoured — no verify script needs it.
"""

import argparse
import functools
import http.server
import os
import socketserver


class PagesHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        disk = super().translate_path(path)
        if os.path.exists(disk):
            return disk
        for candidate in (f"{disk}.html", os.path.join(disk, "index.html")):
            if os.path.isfile(candidate):
                return candidate
        return disk

    def log_message(self, fmt, *args):
        pass


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("port", nargs="?", type=int, default=8731)
    ap.add_argument(
        "--directory",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."),
        help="document root (default: site/, next to this script)",
    )
    args = ap.parse_args()

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    handler = functools.partial(PagesHandler, directory=args.directory)
    with socketserver.ThreadingTCPServer(("127.0.0.1", args.port), handler) as httpd:
        print(f"site/ on http://127.0.0.1:{args.port} (Pages-style routes)", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
