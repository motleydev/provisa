#!/usr/bin/env bash
# Runs a verification command inside a nix-provided environment, for runners
# that have no FHS lib dir and no system package manager (NixOS, and the
# Paperclip agent runners, which are NixOS).
#
# Two environments, because the two things that were unrunnable need different
# closures:
#
#   browser   PLAYWRIGHT_LD_LIBRARY_PATH, the escape hatch the site's
#             verify-*.mjs scripts already read. Playwright's own downloaded
#             chromium links against libnspr4/libglib/libgbm and friends, none
#             of which are at an FHS path here; this points the browser process
#             at nix's copies without exporting LD_LIBRARY_PATH over every
#             binary on the box.
#
#   install   python3.12 and postgres on PATH. The install blocks the site
#             serves pin >=3.12,<3.13 and this runner ships 3.13 only, so the
#             page's first command cannot be attempted without it (PRO-9).
#
# Usage:
#   scripts/nix-verify-env.sh browser node site/verify-home.mjs http://127.0.0.1:8731
#   scripts/nix-verify-env.sh install python3 -m venv .venv
#
# Run the command directly, as above. Wrapping it in `bash -c` on a runner that
# sets BASH_ENV re-runs that rc file inside the wrapper and puts the runner's
# own python3 back in front of this one, which is how you get 3.13 out of the
# install environment; `env -u BASH_ENV bash -c ...` if you need a shell.
#
# First run pulls from the binary cache and takes a few minutes; after that the
# closure is in the store and the wrapper costs one nix eval.
set -euo pipefail

if command -v nix >/dev/null 2>&1; then
  NIX=$(command -v nix)
elif [ -x /run/current-system/sw/bin/nix ]; then
  # NixOS keeps the system profile off non-login PATHs; this is where it is.
  NIX=/run/current-system/sw/bin/nix
else
  echo "nix-verify-env: no nix on PATH and none at /run/current-system/sw/bin/nix." >&2
  echo "This wrapper exists to borrow nix's closures; without nix there is nothing to borrow." >&2
  exit 1
fi

ENVIRONMENT=${1-}
if [ -z "$ENVIRONMENT" ]; then
  echo "nix-verify-env: first argument must be 'browser' or 'install'." >&2
  exit 1
fi
shift

if [ "$#" -eq 0 ]; then
  echo "nix-verify-env: give a command to run in the '$ENVIRONMENT' environment." >&2
  exit 1
fi

# Chromium's runtime closure, written to a file in the store rather than
# evaluated to a string: the file's contents carry string context for every
# library in it, so building the file is what realises the closure. A bare
# `nix eval` would hand back paths that are not in the store yet, and the first
# sign of that is chromium exiting on a missing .so.
#
# makeLibraryPath, not buildEnv: a buildEnv of these collides on glib's and
# nss's shared sonames and drops one, which also surfaces much later as a
# missing libglib-2.0.so.0.
CHROMIUM_LIBS='let p = (builtins.getFlake "nixpkgs").legacyPackages.${builtins.currentSystem};
in p.writeText "chromium-library-path" (p.lib.makeLibraryPath (with p; [
  stdenv.cc.cc.lib glib glibc nspr nss dbus expat
  atk at-spi2-atk at-spi2-core cups cairo pango gtk3 gdk-pixbuf
  libdrm libgbm libxkbcommon alsa-lib fontconfig freetype libxml2 libGL
  libx11 libxcomposite libxdamage libxext libxfixes libxrandr libxcb
  libxcursor libxi libxrender libxtst libxshmfence
]))'

case "$ENVIRONMENT" in
  browser)
    libfile=$("$NIX" build --impure --no-link --print-out-paths --expr "$CHROMIUM_LIBS")
    PLAYWRIGHT_LD_LIBRARY_PATH=$(cat "$libfile")
    export PLAYWRIGHT_LD_LIBRARY_PATH
    exec "$@"
    ;;
  install)
    # Prepending the store paths by hand rather than using `nix shell`: the
    # runner's PATH already carries a python3 (3.13), and nix shell does not put
    # its own bin ahead of it, so `python3 -V` inside the shell still answered
    # 3.13 — which is the exact interpreter the install blocks exclude.
    # One installable per call, and ^out on postgres: its default outputs are
    # out, lib and man, and --print-out-paths prints all three in an order that
    # is not the order they were asked for.
    py=$("$NIX" build --no-link --print-out-paths 'nixpkgs#python312')
    pg=$("$NIX" build --no-link --print-out-paths 'nixpkgs#postgresql_16^out')
    PATH="$py/bin:$pg/bin:$PATH"
    export PATH
    # The embedded tier installs manylinux wheels, which link their C++ runtime
    # by bare soname: duckdb's _duckdb.so wants libstdc++.so.6 and finds nothing
    # at an FHS path, so `provisa run` dies on `import duckdb` straight after an
    # otherwise clean install. zlib is here for the same reason, one layer down.
    # Two libraries, not glibc: putting a second glibc on LD_LIBRARY_PATH would
    # swap it under every process this command starts.
    LD_LIBRARY_PATH=$(cat "$("$NIX" build --impure --no-link --print-out-paths --expr \
      'let p = (builtins.getFlake "nixpkgs").legacyPackages.${builtins.currentSystem};
       in p.writeText "manylinux-library-path"
         (p.lib.makeLibraryPath (with p; [ stdenv.cc.cc.lib zlib ]))')")
    export LD_LIBRARY_PATH
    exec "$@"
    ;;
  *)
    echo "nix-verify-env: unknown environment '$ENVIRONMENT'; expected 'browser' or 'install'." >&2
    exit 1
    ;;
esac
