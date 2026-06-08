---
name: Extracting zip/archives in this Replit container
description: This NixOS container has no unzip/python3; how to extract zip archives.
---

This container lacks `unzip`, `python3`, `7z`, `jar`, and `bsdtar` (only `gunzip` exists, which can't handle `.zip`).

**Rule:** To extract a `.zip` (e.g. user-attached assets), parse it with Node in the code_execution sandbox using the built-in `zlib` (`inflateRawSync` for deflate method 8, raw copy for method 0). Read the End-of-Central-Directory record, walk the central directory, then each local header. Skip macOS junk entries (`._*`, `.DS_Store`).

**Why:** No CLI archive tool is installed and installing one wastes time; Node + zlib is always available and reliable.

**How to apply:** Any time you receive a `.zip` and `unzip`/`python` fail with command-not-found, go straight to the Node/zlib approach instead of trying more CLI tools.
