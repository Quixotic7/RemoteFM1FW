# RemoteFM1 firmware (.rfm1)

FM-1 firmwares built as `.rfm1` files for [RemoteFM1 for iOS](https://github.com/Quixotic7/RemoteFM1IOS). An `.rfm1` is
a firmware's host build compiled to WebAssembly ([the format](https://github.com/Quixotic7/RemoteFM1IOS/blob/main/docs/RFM1-FORMAT.md)):
RemoteFM1 runs it on your iPhone or iPad, with your FM-1 (or the on-screen panel) as the controls.

**Download** the files from the [latest release](https://github.com/Quixotic7/RemoteFM1FW/releases/latest).

**Add one to RemoteFM1:** open the `.rfm1` file on your iPhone (from Safari's downloads, Files or AirDrop) and choose
RemoteFM1, or use Add firmware… on RemoteFM1's firmware page, or put it in Files › On My iPhone › RemoteFM1 › Firmware.

These files don't change your FM-1: nothing is installed on the unit.

## The firmwares

Every firmware is its authors' work, under its own licence. Each file carries its licence texts and credits (RemoteFM1
shows them under About), and the exact source it was built from.

| File | Firmware | Author | Licence | Source (the commit built) |
| --- | --- | --- | --- | --- |
| `amb-1.3.rfm1` | AMB-1 1.3 | Charles Vestal | MPL-2.0 | [charlesvestal/fm1-amb](https://github.com/charlesvestal/fm1-amb/tree/188b0a42f20a547864e732ae5ea1339d0fbcf395) |
| `choralroot-0.26.1.rfm1` | ChoralRoot 0.26.1 | Quixotic7 | GPL-3.0-only | [Quixotic7/ChoralRootFM1](https://github.com/Quixotic7/ChoralRootFM1/tree/7d97982a7db3dad2da456a3e4d4478548b6571d9) |
| `clipper-1.3.rfm1` | Clipper 1.3 † | isod89 | GPL-3.0-only (+ the Hügelton icons, all rights reserved) | [isod89/clipper-fm1](https://github.com/isod89/clipper-fm1/tree/fbd8434e7b501ec5d772f5c5f656c25735929369) |
| `coralflower-0.5.rfm1` | CoralFlower 0.5 | FicusFicusov | GPL-3.0-only | [FicusFicusov/CoralFlower](https://github.com/FicusFicusov/CoralFlower/tree/b5ceb997be330c8a420958eb8f4e0f4b3ca084c2) |
| `duell-1.0.rfm1` | DUELL (unofficial build) 1.0, with key velocity and aftertouch | oscillr | GPL-3.0-only | [oscillr/DUELL](https://github.com/oscillr/DUELL/tree/33e2e2ed36a9d1a33a39ac1d1f06282c9045aab0) |
| `felucca-1.6.1.rfm1` | Felucca 1.6.1 | Leo Kuroshita (Hügelton Instruments) | GPL-3.0-only | [hugelton/Felucca](https://github.com/hugelton/Felucca/tree/a53ecf428c29c780108fd70a31b71a32a6b5c313) |
| `fimba-0.6.1.rfm1` | FiMba-1 0.6.1 | jadamsowers | GPL-3.0-only | [jadamsowers/fm1-fimba](https://github.com/jadamsowers/fm1-fimba/tree/0485ed0d387ce78216428c7b19f97d77bbe10b4d) |
| `fmini-1.8.0.rfm1` | FMini-1 1.8.0 | ruppert | GPL-3.0-only | [ruppert/fmini-1](https://github.com/ruppert/fmini-1/tree/ab0f5c83d9c3b8cf10fd2f9ef3dc760a06c3abb3) |
| `fomni-0.4.rfm1` | FoMni-1 0.4 | Charles Vestal | GPL-3.0-only | [charlesvestal/fm1-fomni](https://github.com/charlesvestal/fm1-fomni/tree/6ecd227013cc18def0e89d035b3760eb268b342b) |
| `ghoulbox-2.3.2.rfm1` | GHOULBOX 2.3.2 | jasonpersinger | GPL-3.0-only | [jasonpersinger/ghoulbox-fm1-dungeon-synth](https://github.com/jasonpersinger/ghoulbox-fm1-dungeon-synth/tree/71ac3f87e0a33b08831f11a89fbd6012de8024ce) |
| `jiant-0.9.9.rfm1` | JIANT FM 0.9.9 | juanjiant-bit | GPL-3.0-only | [juanjiant-bit/JIANT](https://github.com/juanjiant-bit/JIANT/tree/0912abb2f0c71cd26252d441dc74f3cdf825e6fb) |
| `karma-3.0.2.rfm1` | KARMA 3.0.2 † | Ariel Muchnik | GPL-3.0-only (+ the Hügelton icons, all rights reserved) | [eatyourgreensstudio-dotcom/karma-fm1](https://github.com/eatyourgreensstudio-dotcom/karma-fm1/tree/81d45b7d026316f5d8b6340cd6568822c81885ca) |
| `melodee-1.5.1.rfm1` | Melodee 1.5.1 | Kerem Kilic (Ellic Studio) | GPL-3.0-only (+ Apache-2.0, BSD-3-Clause, MIT, MPL-2.0, OFL-1.1 parts: its LICENSING.md) | [keremimo/melodee](https://github.com/keremimo/melodee/tree/6a608ba122ac42293908d394e26713e31ec52fb0) |
| `minitone-1.0.1.rfm1` | Mini-Tone 1.0.1 | eldontyrellcorp | GPL-3.0-only | [eldontyrellcorp/Mini-Tone](https://github.com/eldontyrellcorp/Mini-Tone/tree/5e5d09c52f8aed2cf6688c8d23a25dd91532a261) |
| `obervave-3.3.rfm1` | OberVave 3.3 | zvenson | GPL-3.0-only | [zvenson/obervave](https://github.com/zvenson/obervave/tree/25d463be127716af3f378c5302d2d84c3c89febd) |
| `pigeon-0.4.1.rfm1` | PIGEON 0.4.1 | TheShrimpBlimp | GPL-3.0-only | [TheShrimpBlimp/pigeon](https://github.com/TheShrimpBlimp/pigeon/tree/8f34e81b6d7b03fa45ffd7443b71f9ba838ef0f7) |
| `purplemonkey-0.11.rfm1` | PurpleMonkey 0.11 | Quixotic7 | GPL-3.0-only | [Quixotic7/PurpleMonkeyFM1](https://github.com/Quixotic7/PurpleMonkeyFM1/tree/7590d4a5205bd4932b206d676c09b9521843a023) |
| `s1vave-1.0.rfm1` | S1Vave 1.0 | Andrew GG (a fork of zvenson's OberVave) | GPL-3.0-only | [AndrewGG88/S1Vave](https://github.com/AndrewGG88/S1Vave/tree/97303378678c247ca1d005ae641114f4544acf65) |
| `skiff-1.4.rfm1` | Skiff 1.4 | illuminus5 | GPL-3.0-only | [illuminus5/skiff](https://github.com/illuminus5/skiff/tree/c01fa1ed619266d770ea6552b153612e1b77d0a9) |
| `sloop-2.8.4.rfm1` | SLOOP 2.8.4 † | isod89 | GPL-3.0-only (+ the Hügelton icons, all rights reserved) | [isod89/sloop-fm1](https://github.com/isod89/sloop-fm1/tree/91f30182d9095e0ecdb43396554f2ce5a67df179) |
| `speak37-1.0.rfm1` | Speak37 1.0 | genkigenki | GPL-3.0-only | [genkigenki/Speak37](https://github.com/genkigenki/Speak37/tree/a617d60fca316bd8c72ac9041579367f6633c0ab) |
| `x0x-1.1.0.rfm1` | X0X 1.1.0 † | Charles Vestal | GPL-3.0-only | [charlesvestal/fm1-x0x](https://github.com/charlesvestal/fm1-x0x/tree/27f6fac7e07ce97b5de158b45aec99f59a9e23fd) |

**How they were built:** with [FM1VST](https://github.com/Quixotic7/FM1VST)'s `fm1_add_rfm1` (branch `rfm1-target`,
commit [`0da0448`](https://github.com/Quixotic7/FM1VST/tree/0da04482a3af4f5054fdf0171ed43c05573ca0f3)), Emscripten 6.0.13. That commit holds the
build glue for each firmware (`core-glue/`), the `.rfm1` shim and the tools; its `docs/RFM1.md` says how to rebuild a
file and how firmware authors can make `.rfm1` files in their own releases. Together with each firmware's source above,
that is the complete source of every file here.

`s1vave-1.0.rfm1` was built later, from FM1VST's branch `s1vave`
(commit [`13a66e2`](https://github.com/Quixotic7/FM1VST/tree/13a66e2e0a06cff40b732b5c4094cf4cb7187b6e), Emscripten 6.0.13). That branch adds S1Vave's glue and
the in-module coroutine that firmwares on zvenson's Dinghy platform need as `.rfm1` files.

`duell-1.0.rfm1` was rebuilt later, from FM1VST's branch `duell-velocity`
(commit [`850368e`](https://github.com/Quixotic7/FM1VST/tree/850368ef0546ec8fe955b25f80e953a3d2ff1eaa), Emscripten 6.0.13), from the same DUELL source.
That build has DUELL's own KEY SENSE (key velocity and aftertouch) and plays the velocity and pressure of
RemoteFM1's keys: turn on MENU › CONTROL › KEY VELOCITY for the velocity (off by default, as on the FM-1); AFTERTOUCH
is on by default.

`clipper-1.3.rfm1`, `obervave-3.3.rfm1`, `sloop-2.8.4.rfm1` and `x0x-1.1.0.rfm1` were added later, from FM1VST's branch
`rfm1-catalog-2` (commit [`5fde8b2`](https://github.com/Quixotic7/FM1VST/tree/5fde8b25fc0826500db281cb77ddea3b5fae9b61), Emscripten 6.0.13).
That branch adds their build glue (SLOOP updated to 2.8.4; Clipper, a SLOOP-family firmware) and the option that
builds them as hosted files.

`karma-3.0.2.rfm1` was added later, from FM1VST's branch `rfm1-karma`
(commit [`b415fc4`](https://github.com/Quixotic7/FM1VST/tree/b415fc4da5130d17d80983cc5e41197b89dd1c4b), Emscripten 6.0.13).
That branch adds KARMA's build glue (a SLOOP-family firmware, with Plaits' and Elements' models in C++).

`melodee-1.5.1.rfm1` was added later, from FM1VST's branch `rfm1-melodee`
(commit [`51419f7`](https://github.com/Quixotic7/FM1VST/tree/51419f7960c789776692e8c415d9a5aeb3c65e89), Emscripten 6.0.13): Melodee's latest stable
release with its release build's options and everything its firmware has (FM6, CZ-1, Prophet, SID and x0x 909, eight
tracks, the shared FX rack), the CZ-1 and Prophet-5 factory sounds compiled in as Melodee's own build does; USB audio
and the USB MIDI host are left out (they need the FM-1's USB hardware).

† **Hosted here, not part of the app.** SLOOP, Clipper and KARMA are built as their authors intended, with the Hügelton icon
atlas that Felucca's licensing keeps under all rights reserved; X0X as its author ships it, with its 909 cymbal
samples. These files are only hosted here for download: RemoteFM1 doesn't bundle them, it downloads and runs the
file you choose.

**Firmware authors:** if you'd rather your firmware weren't listed here, or want to publish `.rfm1` files yourself,
open an issue and it will be changed or removed.
