# Your own .rfm1 in RemoteFM1

If your firmware is already in RemoteFM1FW, you can ship its `.rfm1` yourself. Every night (03:20 UTC) a GitHub
Action here (`.github/workflows/author-rfm1-sync.yml`) looks at your repository's newest stable release. If that
release has an `.rfm1` attached, the Action checks it and puts it in the release
[`current`](https://github.com/Quixotic7/RemoteFM1FW/releases/latest) in place of the old file. The RemoteFM1 apps
and remotefm1.com pick it up from there. The site re-hosts the files at its 04:17 UTC deploy.

## What to do

1. Build the `.rfm1` from the commit you tag. fm1-base's `tools/build.py --rfm1` does this, and so does FM1VST's
   `docs/RFM1.md`. Its manifest's `source_url` should be `https://github.com/<you>/<repo>@<the tagged commit>`, and
   that commit should be pushed.
2. Make a **stable** GitHub release: not a draft, not a prerelease, with a tag like `v1.2.3` or `name-v1.2.3` (no
   `beta`, `rc`, `dev` and so on in it).
3. Attach the file to it, ideally named `<id>-<version>.rfm1`. Any name works: the file is renamed to
   `<id>-<version>.rfm1` here. Its bytes are never changed.

## The checks

The file is taken only if all of these hold:

- the manifest `id` is the one your firmware has in `current`;
- the manifest `version` is the release tag's version (`v1.2.3` → `1.2.3`) and is newer than the file in `current`.
  The same version is taken only to replace a file RemoteFM1FW built itself;
- `source_url` names your repository. If it names a commit other than the tag's, the file is still taken, with a
  warning in the run's log. Please keep the two the same, so that anyone can find the exact source;
- the licence texts (`rfm1.license.<n>`) are there, and `abi` and `rfm1` are versions RemoteFM1 runs today;
- FM1VST's `tools/rfm1_check.py` passes, and `rfm1_run` boots the file, plays a chord and draws the screen with no
  trap. The chord has to sound unless the current file is silent in the same test too, as a looper may be.

If a check fails, the old file stays in place and the run's summary says why. The Action only replaces firmwares that
are already here: adding a new firmware, or changing whether one is hosted, is still the owner's decision. Its
notes credit your release as "built by the author, unchanged".

The files RemoteFM1FW builds itself are made with [RFM1Manager](https://github.com/Quixotic7/RFM1Manager). It takes
your release's `.rfm1` in the same way when it builds the commit you tagged.
