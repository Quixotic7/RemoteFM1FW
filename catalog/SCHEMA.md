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
      "beta": false
    }
  }
}
```

- Keys of `firmwares` are manifest ids (`[a-z0-9_]{1,31}`). Every field is optional; unknown fields are ignored.
- `image` is relative to `catalog/`; PNG, JPEG or WebP, square, 512 px recommended, at most 1 MiB.
- Readers fetch `https://raw.githubusercontent.com/Quixotic7/RemoteFM1FW/<tag or main>/catalog/catalog.json` and images
  beside it. The fields `author`, `category`, `tag`, `what`, `site`, `beta` are the ones RemoteFM1's
  `web/site/data/fw-catalog.json` uses, so the site's build_catalog.mjs can read this file in its place.
