#!/usr/bin/env python3
"""Build a Chromium runtime for a sandbox that has no system browser libraries.

The site/ verify scripts need Playwright's Chromium. On a NixOS-style runner
there is no /usr/lib, so that binary cannot start: it wants ~21 shared objects
(libnss3, libatk-1.0, libgbm, libxkbcommon, libXrandr and the rest) that are
not built anywhere on the host, and there is no nix-shell or apt-get to get
them. What the host does have is nix-ld at /lib64/ld-linux-x86-64.so.2, which
runs an FHS binary against whatever NIX_LD_LIBRARY_PATH points at.

So: fetch the Debian bookworm packages that carry those objects, unpack them
into a sysroot, and print the environment that aims nix-ld at it.

    eval "$(python3 site/design-system/browser-deps.py --prefix /somewhere/durable)"
    (cd provisa-ui && npx --no-install playwright install chromium)
    python3 site/design-system/serve.py 8743 &
    node site/design-system/verify-page-vs-starburst.mjs http://127.0.0.1:8743

--prefix wants a path outside the checkout that survives the run: without it both
the sysroot and the 900MB browser land in scratch and are deleted, so the next
pass re-downloads them. serve.py rather than `http.server` because two checkers
request the extensionless production route. The playwright that installs the
browser must be provisa-ui's -- it is the one this repo pins, and a browser build
only drives the playwright it shipped with.

glibc is deliberately not taken from Debian — nix-ld supplies the host's, which
is newer than bookworm's and serves the Debian libraries' symbols. Everything
in DENY is there for that reason.

The sysroot goes under PAPERCLIP_RUN_SCRATCH_DIR when the runner sets it, so it
is cleaned up with the run; pass --prefix to put it somewhere durable.
"""

import argparse
import gzip
import io
import lzma
import os
import sys
import tarfile
import urllib.request

MIRROR = "https://deb.debian.org/debian/"
INDEX = MIRROR + "dists/bookworm/main/binary-amd64/Packages.gz"

# Chromium's own needs, plus fontconfig and two font families so text measures
# the same here as on a workstation. The dependency closure brings the rest.
SEEDS = """
libglib2.0-0 libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0
libdbus-1-3 libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2
libgbm1 libexpat1 libxcb1 libxkbcommon0 libasound2 libcups2 libdrm2
libpango-1.0-0 libcairo2 libfontconfig1 libfreetype6 libharfbuzz0b
fonts-dejavu-core fonts-liberation2 libxrender1 libxi6 libxtst6 libxshmfence1
libcurl4 libnghttp2-14 libjpeg62-turbo libpng16-16 libwebp7 libgtk-3-0
""".split()

# The host's, via nix-ld. A Debian copy of any of these would be older than the
# glibc the loader is going to use and is the one way this arrangement breaks.
DENY = {"libc6", "libc-bin", "libgcc-s1", "gcc-12-base", "libstdc++6",
        "debconf", "dpkg", "base-files", "ucf"}


def read_index():
    raw = gzip.decompress(urllib.request.urlopen(INDEX, timeout=180).read())
    pkgs, provides = {}, {}
    for block in raw.decode("utf-8", "replace").split("\n\n"):
        if not block.strip():
            continue
        fields, key = {}, None
        for line in block.split("\n"):
            if line.startswith(" ") and key:
                continue
            if ":" in line:
                key, _, val = line.partition(":")
                fields[key] = val.strip()
        name = fields.get("Package")
        if not name:
            continue
        pkgs[name] = fields
        for virt in fields.get("Provides", "").split(","):
            virt = virt.split("(")[0].strip()
            if virt:
                provides.setdefault(virt, name)
    return pkgs, provides


def closure(pkgs, provides):
    """Breadth-first over Depends, taking the first alternative of each OR."""
    seen, order, stack = set(), [], list(SEEDS)
    while stack:
        name = stack.pop(0)
        if name not in pkgs:
            name = provides.get(name, name)
        if name in seen or name in DENY or name not in pkgs:
            continue
        seen.add(name)
        order.append(name)
        for dep in pkgs[name].get("Depends", "").split(","):
            first = dep.split("|")[0].split("(")[0].strip()
            if first:
                stack.append(first)
    return order


def ar_members(buf):
    """Unpack a .deb, which is an ar archive. There is no `ar` on the host."""
    if buf[:8] != b"!<arch>\n":
        raise ValueError("not an ar archive")
    off = 8
    while off + 60 <= len(buf):
        header = buf[off:off + 60]
        name = header[0:16].decode().strip().rstrip("/")
        size = int(header[48:58].decode().strip())
        yield name, buf[off + 60:off + 60 + size]
        off += 60 + size + (size % 2)


def unpack(deb, prefix):
    for name, data in ar_members(deb):
        if not name.startswith("data.tar"):
            continue
        if name.endswith(".xz"):
            data = lzma.decompress(data)
        elif name.endswith(".gz"):
            data = gzip.decompress(data)
        with tarfile.open(fileobj=io.BytesIO(data)) as tf:
            for member in tf.getmembers():
                try:
                    tf.extract(member, prefix, filter="tar")
                except tarfile.TarError:
                    # A handful of packages ship a compatibility symlink that
                    # resolves outside the sysroot (/etc/X11/rgb.txt is the one
                    # that bites). None of them is a shared object.
                    pass


def main():
    scratch = os.environ.get("PAPERCLIP_RUN_SCRATCH_DIR") or os.environ.get("TMPDIR", "/tmp")
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--prefix", default=os.path.join(scratch, "sysroot"))
    args = ap.parse_args()
    prefix = os.path.abspath(args.prefix)

    marker = os.path.join(prefix, ".browser-deps-complete")
    if not os.path.exists(marker):
        print("fetching the Debian index...", file=sys.stderr)
        pkgs, provides = read_index()
        want = closure(pkgs, provides)
        print(f"{len(want)} packages to unpack into {prefix}", file=sys.stderr)
        os.makedirs(prefix, exist_ok=True)
        for i, name in enumerate(want, 1):
            url = MIRROR + pkgs[name]["Filename"]
            unpack(urllib.request.urlopen(url, timeout=300).read(), prefix)
            if i % 25 == 0 or i == len(want):
                print(f"  {i}/{len(want)}", file=sys.stderr)
        open(marker, "w").close()
    else:
        print(f"reusing {prefix}", file=sys.stderr)

    libs = [os.path.join(prefix, "usr/lib/x86_64-linux-gnu"),
            os.path.join(prefix, "lib/x86_64-linux-gnu")]
    inherited = os.environ.get("NIX_LD_LIBRARY_PATH")
    if inherited:
        libs.append(inherited)

    # stdout is the shell fragment, so the progress above goes to stderr.
    print(f'export NIX_LD_LIBRARY_PATH="{":".join(libs)}"')
    print(f'export FONTCONFIG_FILE="{prefix}/etc/fonts/fonts.conf"')
    print(f'export FONTCONFIG_PATH="{prefix}/etc/fonts"')
    print(f'export XDG_DATA_DIRS="{prefix}/usr/share"')
    # Under the prefix, not under scratch: the browser build and the sysroot it
    # is linked against have to live or die together. Pinning this to scratch
    # made --prefix durable for the Debian libraries and nowhere for Chromium,
    # so every run re-downloaded the browser into a directory the runner then
    # deleted (PRO-38).
    print(f'export PLAYWRIGHT_BROWSERS_PATH="{os.path.join(prefix, "browsers")}"')


if __name__ == "__main__":
    main()
