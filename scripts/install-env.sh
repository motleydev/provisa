#!/usr/bin/env bash
# Runs a command against the interpreter the install page's blocks require, on
# a runner that does not ship it.
#
# The blocks the site serves say "Python 3.12 — 3.13 is not supported", and the
# agent runners have 3.13 only, so the page's first command cannot be attempted
# there at all (PRO-9). There is no apt-get and no python3.12 anywhere on the
# host, but the host is NixOS: nix is at /run/current-system/sw/bin/nix even
# when it is off PATH, and the binary cache is reachable. So the interpreter is
# a `nix build` away rather than a blocker.
#
#     scripts/install-env.sh python3 -m venv .venv
#     scripts/install-env.sh ./.venv/bin/pip install 'provisa[embedded]'
#     scripts/install-env.sh ./.venv/bin/provisa run --demo
#
# Run the command directly, as above. Wrapping it in a bare `bash -c` on a
# runner that sets BASH_ENV re-runs that rc file inside the wrapper and puts the
# runner's own python3 back in front of this one, which is how you get 3.13 out
# of this script; use `env -u BASH_ENV bash -c ...` if you need a shell.
#
# For the browser-side verifications see site/design-system/browser-deps.py,
# which solves the other half of the same problem a different way — a Debian
# sysroot aimed at nix-ld. Two mechanisms is one too many; prefer that one for
# anything Chromium, and this one only for the install blocks.
#
# First run pulls from the binary cache and takes a few minutes; afterwards the
# closure is in the store and this costs two nix builds that do nothing.
set -euo pipefail

if command -v nix >/dev/null 2>&1; then
  NIX=$(command -v nix)
elif [ -x /run/current-system/sw/bin/nix ]; then
  # NixOS keeps the system profile off non-login PATHs. This is where it is.
  NIX=/run/current-system/sw/bin/nix
else
  echo "install-env: no nix on PATH and none at /run/current-system/sw/bin/nix." >&2
  echo "This script exists to borrow nix's python 3.12; without nix there is nothing to borrow." >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  echo "install-env: give a command to run against python 3.12." >&2
  exit 1
fi

# One installable per call, and ^out on postgres: its default outputs are out,
# lib and man, and --print-out-paths prints all three in an order that is not
# the order they were asked for.
#
# Postgres is here for the throwaway database the install blocks' second half
# wants; the embedded tier brings its own via pgserver, so `provisa run --demo`
# does not need it.
py=$("$NIX" build --no-link --print-out-paths 'nixpkgs#python312')
pg=$("$NIX" build --no-link --print-out-paths 'nixpkgs#postgresql_16^out')

# Prepending by hand rather than using `nix shell`: the runner's PATH already
# carries a python3, and nix shell did not put its own bin ahead of it, so
# `python3 -V` inside the shell still answered 3.13 — the one interpreter the
# install blocks exclude.
PATH="$py/bin:$pg/bin:$PATH"
export PATH

# The embedded tier installs manylinux wheels, which link their C++ runtime by
# bare soname: duckdb's _duckdb.so wants libstdc++.so.6 and finds nothing at an
# FHS path, so `provisa run` dies on `import duckdb` straight after an otherwise
# clean install. zlib is here for the same reason, one layer down.
#
# Written to a file in the store rather than evaluated to a string: the file's
# contents carry string context for both libraries, so building the file is what
# realises them. A bare `nix eval` hands back paths that need not exist yet, and
# the first sign of that is the same missing-.so failure it was meant to fix.
#
# Two libraries, and deliberately not glibc: a second glibc on LD_LIBRARY_PATH
# would be swapped under every process this command starts.
LD_LIBRARY_PATH=$(cat "$("$NIX" build --impure --no-link --print-out-paths --expr \
  'let p = (builtins.getFlake "nixpkgs").legacyPackages.${builtins.currentSystem};
   in p.writeText "manylinux-library-path"
     (p.lib.makeLibraryPath (with p; [ stdenv.cc.cc.lib zlib ]))')")
export LD_LIBRARY_PATH

exec "$@"
