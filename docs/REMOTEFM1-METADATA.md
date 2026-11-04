# RemoteFM1Metadata.json — a guide for firmware authors

## 1. What it is

`RemoteFM1Metadata.json` is one small file at the root of your firmware's repository. When RemoteFM1 builds your
firmware, it reads the file and uses it for your firmware's **card** (description, subtitle, category, links, port
name), its **screenshot**, an optional **skin** for the on-screen FM-1, **labels** for the panel's buttons and knobs,
and the **target** release you want built. Every part is optional. Without the file, nothing changes.

## 2. A complete example

```json
{
  "$schema": "https://raw.githubusercontent.com/Quixotic7/RemoteFM1FW/main/docs/RemoteFM1Metadata.schema.json",
  "schema": 1,
  "target": "v1.4.2",
  "card": {
    "tag": "Granular sampler",
    "what": "A granular sampler with four voices, a pitch-shifting freeze and a tape delay. Load your own samples from the RemoteFM1 folder.",
    "category": "Synth",
    "site": "https://example.github.io/my-fw/",
    "editor": "https://example.github.io/my-fw/editor/",
    "port": "My FW",
    "image": "docs/remotefm1-card.png"
  },
  "skin": {
    "background": "art/skin-portrait.png",
    "landscape": "art/skin-landscape.png",
    "dim": 0.2,
    "theme": { "body": "#1B1B22", "key": "#2C2C36", "knob": "#E8E2D0", "led": "#FF7A2F", "bezel": "#0E0E12" }
  },
  "labels": {
    "buttons": { "FX": "DRUMS", "SEL": "TRACK", "SEQ": "STEPS", "GLO": "SHIFT" },
    "knobs": { "K1": "CUTOF", "K2": "RESO", "K3": "DECAY", "K4": "MIX" }
  }
}
```

## 3. Field reference

Top level:

| Field | Type | Limits | | What happens |
| --- | --- | --- | --- | --- |
| `$schema` | string | the schema's URL | optional | Lets your editor check the file. Ignored by the build. |
| `schema` | number | `1` | optional (recommended) | The format version. Anything else is read as 1, with a warning. |
| `target` | string | a tag name | optional | The release we build (section **target** below). |
| `card` | object | | optional | Your firmware's card. |
| `skin` | object | | optional | A background and colours for the on-screen FM-1. |
| `labels` | object | | optional | Fixed names for the panel's buttons and knobs. |

### card

| Field | Type | Limits | | What happens |
| --- | --- | --- | --- | --- |
| `tag` | string | 1–40 characters, one line | optional | The short subtitle under the firmware's name. |
| `what` | string | 1–600 characters | optional | The description RemoteFM1 shows when your firmware is selected. One paragraph. |
| `category` | string | `Synth`, `Groovebox`, `Chords`, `Drums` or `Other` | optional | Where your firmware is listed. Another value is skipped and the current category stays. |
| `site` | string | `https://` URL, up to 300 characters | optional | A link to your firmware's own page. |
| `editor` | string | `https://` URL, up to 300 characters | optional | Your own web editor or manager page. RemoteFM1 opens it with Web MIDI connected to the firmware running in the app. |
| `port` | string | 1–31 characters, one line | optional | Your firmware's USB MIDI port name, exactly as its USB descriptor gives it. Editors look for a port with this name. |
| `image` | path | PNG, JPEG or WebP; square; up to 1 MiB; 512 × 512 px recommended | optional | The card picture (a screenshot works well). We copy it into the catalog. Not square or too big: skipped. |

### skin

The RemoteFM1 apps draw the skin behind the on-screen FM-1's faceplate. Users can turn firmware skins off; then
their own background and colours show. A skin needs at least one image or a theme.

| Field | Type | Limits | | What happens |
| --- | --- | --- | --- | --- |
| `background` | path | PNG or JPEG; up to 4 MiB; longer side up to 4096 px | optional | The background, cropped to fill. Portrait, or any shape. Apps scale it down to 2048 px. |
| `landscape` | path | same as `background` | optional | A second image for wide views. |
| `dim` | number | 0 to 0.8 (default 0) | optional | How much of the faceplate colour (`body`) is laid over the image, so labels stay readable. |
| `theme` | object | the 5 main roles, or all 14 roles; each `"#RRGGBB"` | optional | The faceplate colours. |

Theme roles. The five main ones are `body` (faceplate), `key` (face of keys and buttons), `knob` (knob body), `led`
(lit LEDs and lit legends) and `bezel` (display frame); with only these five, the rest are derived from them.
All fourteen: `body`, `label` (text on the faceplate), `bed` (recessed wells), `key`, `hi` (lit top edge of keys),
`lo` (shadow under keys), `keyText` (button legends), `knob`, `mark` (knob pointer), `bezel`, `lcd`, `ink`, `led`,
`ledOff` (unlit LED). Give exactly five or exactly fourteen; a mix is skipped.

### labels

Names drawn on the on-screen FM-1's controls. They are fixed names: if your firmware changes its labels while it
plays (per page or mode), do that in your code instead ([live panel labels](https://github.com/Quixotic7/FM1VST/blob/rfm1-manager/docs/DYNAMIC-LABELS.md)); labels your code draws
always win over these.

| Field | Type | Limits | | What happens |
| --- | --- | --- | --- | --- |
| `buttons` | object | keys: `FX` `SEL` `ENV` `LFO` `EDIT` `GLO` `HOME` `SAVE` `ARP` `SEQ` `PLAY` `REC` `OCT-` `OCT+` | optional | Each listed button shows your name. Unlisted buttons keep their usual name. |
| `knobs` | object | keys: `SELECT` `ALGO` `PRESETS` `K1` `K2` `K3` `K4` `MASTER` | optional | Each listed knob shows your name. |
| each value | string | 0–10 printable ASCII characters | | Shown in upper case. `""` means the control has no job: it is drawn blank or dimmed. 5 characters or fewer draw best; longer ones are shrunk, then cut. |

Keys are not case-sensitive (`oct+` is `OCT+`).

### target

| Field | Type | Limits | | What happens |
| --- | --- | --- | --- | --- |
| `target` | string | a tag in your repository, e.g. `v1.4.2` | optional | We build this release instead of our own pick. `1.4.2` also matches a tag `v1.4.2`. |

Without a target we build your newest stable release (or stable tag). A target lets you hold back a broken latest
release, or opt in a beta tag. If the tag doesn't exist, or it is older than the version we already publish (a
downgrade), we warn and build our usual pick.

## 4. Rules that apply everywhere

- **Where:** the file is `RemoteFM1Metadata.json` at the root of your repository.
- **Which copy:** we read it from the release commit we build, so a release's card, skin and labels always match its
  code. The one exception is `target`: it decides which commit we build, so it is read from the tip of your default
  branch.
- **Paths** (`image`, `background`, `landscape`) are relative to the repository root, with `/` between folders. No
  `..`, no absolute paths, no symlinks. The file must exist at that commit.
- **Nothing is fetched from the network.** Every image must be a file in your repository.
- **Sizes:** the card image up to 1 MiB, each skin image up to 4 MiB, the JSON file itself up to 256 KiB.
- **Unknown fields** are ignored, with a warning (so a newer file still works with an older reader).
- **Invalid fields** are skipped, with a warning; the rest of the file is used. A file that isn't valid JSON is
  ignored as a whole, with one warning.
- **It never fails a build.** The worst case is that a field is not used.
- **Images** must be your own (or yours to publish for this use). We report any image whose licence is in doubt and
  don't ship it.

## 5. What you can't set, and why

The firmware's **id, name, version, licence, authors and credits, source link, beta flag** and **hosting** are not
read from this file. They come from your build itself (the version, licence texts and the exact source commit are
recorded inside each `.rfm1` file) or from the catalog's maintainer (whether a firmware is listed or hosted). That
keeps the credit and licence information tied to the code, where it can be checked. These fields are ignored, with a
warning.

## 6. Who wins

- Your file fills your card's fields on every new release we build, so a new release can change them.
- The RemoteFM1 maintainer can override any card field by hand. An override wins and is kept across releases, until
  the maintainer clears it (then your value is used again). Text that was on your card before you added the file is
  kept as such an override where it differs from yours; ask if you'd like yours used instead.
- The maintainer can turn off a firmware's skin or labels (for example if an image's licence is unclear), and can pin
  another release than your `target`.

## 7. Checking your file

You can't run our build, but you can catch nearly everything before you release:

- Add the `"$schema"` line from the example. Editors such as VS Code then check the file as you type: unknown fields,
  wrong types, lengths, categories, `https://` links, label names, theme colours, path shape. The schema is
  [`docs/RemoteFM1Metadata.schema.json`](RemoteFM1Metadata.schema.json).
- What the schema can't see, we check at build time and warn about: a path that doesn't exist at the release commit
  or is a symlink; an image that isn't really PNG / JPEG / WebP, isn't square (card), or is too large; a card image
  under 256 px (used, with a warning); a `target` tag that doesn't exist or would be a downgrade; labels longer than
  5 characters (used, with a warning).
- Make sure the file and every image it names are **committed in the release you tag**.
- After we build your release, the warnings are listed in this repository's `catalog/catalog.json`, under your
  firmware's `author_meta.warnings`.

## 8. Changelog

- Schema 1, 2026-11-04: first version (card, skin, labels, target).
