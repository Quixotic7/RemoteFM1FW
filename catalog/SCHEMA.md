# RemoteFM1FW catalog metadata (schema 1)

`catalog/catalog.json` adds card text and a thumbnail to the `.rfm1` files of this repository's releases. Everything
else about a firmware (id, name, version, licence, authors, source_url at its commit, built_by) is the file's own
manifest (the `rfm1` custom section, RemoteFM1IOS docs/RFM1-FORMAT.md section 4); this file never repeats it.

```json
{
  "schema": 1,
  "about": "free text",
  "firmwares": {
    "<id>": {
      "description": "(not read by RemoteFM1 yet; `what` is the description it shows)",
      "image": "images/<id>.png",
      "author": "short author name for a card (optional; the manifest's authors are the credit)",
      "category": "Synth | Groovebox | Drums | Sampler | Other ...",
      "tag": "a short subtitle",
      "what": "the description RemoteFM1 (site and iOS app) shows for the firmware: one paragraph",
      "site": "https://... (optional: the firmware's own page)",
      "editor": "https://... (optional: the author's own web editor / manager page)",
      "port": "Felucca (optional: the firmware's USB MIDI port name)",
      "beta": false,
      "virtual": true,
      "author_meta": { "commit": "<sha>", "fields": { "tag": "...", "image": "docs/card.png" }, "image": { "file": "images/<id>.png", "sha256": "..." }, "skin": true, "labels": { "buttons": 4, "knobs": 4 }, "warnings": [] },
      "overrides": ["what"]
    }
  }
}
```

- `virtual` (only when true) marks a Fantasy CFW: the file's manifest says `"virtual": true` (FM1VST docs/VIRTUAL-CARTS.md).
  It runs in RemoteFM1's apps only, never on an FM-1, and has no device package. RFM1Manager copies it from the manifest
  when it stages a release; don't set it by hand.
- `editor` is the https URL of the firmware author's own web editor or manager (never a copy hosted elsewhere). The
  RemoteFM1 apps open it with Web MIDI injected, wired to the firmware running in the app.
- `port` is the firmware's USB MIDI port name as its USB descriptor gives it (e.g. `Felucca`,
  `ChoralRoot FM-1`): editors look for an output whose name contains it, so the apps name their in-app port so.
- Keys of `firmwares` are manifest ids (`[a-z0-9_]{1,31}`). Every field is optional; unknown fields are ignored.
- `image` is relative to `catalog/`; PNG, JPEG or WebP, square, 512 px recommended, at most 1 MiB.
- `author_meta` and `overrides` are RFM1Manager's bookkeeping; readers ignore them and read the card fields above,
  which always hold the values to show. `author_meta` is what the firmware's own `RemoteFM1Metadata.json` said
  (docs/REMOTEFM1-METADATA.md), read from its repository at `commit` (the commit built): `fields` are the
  card fields it set (`image` as the path in that repository; `image` beside it is the copy here and its SHA-256),
  `skin` whether it has a usable skin and `labels` how many panel labels it gives (both embedded in the .rfm1 by
  FM1VST, not here), `warnings` what was wrong with it.
  `overrides` lists the card fields the catalog's owner set by hand: those win over the author's values (a field
  listed but absent is one the owner removed). A field neither in `author_meta.fields` nor in `overrides` is the
  owner's own (every card made before author files existed). An entry without `author_meta` has no author file.
  `hub_meta` is the fallback from the FM-1 Firmware Hub: the author's `fmhub.json` as the Hub's catalog carries it
  (`sha`: the Hub's short commit of that file). `fields` are the card fields it filled (`what`, `category`,
  `editor`, `author`), `image` the Hub's copy of the author's picture (its `url`, the copy here, its SHA-256). It fills
  only fields that `author_meta` does not set and `overrides` does not list.
- Readers fetch `https://raw.githubusercontent.com/Quixotic7/RemoteFM1FW/<tag or main>/catalog/catalog.json` and images
  beside it. The fields `author`, `category`, `tag`, `what`, `site`, `beta` are the ones RemoteFM1's
  `web/site/data/fw-catalog.json` uses, so the site's build_catalog.mjs can read this file in its place.
