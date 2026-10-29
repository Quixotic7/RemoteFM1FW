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
| `coralflower-0.5.rfm1` | CoralFlower 0.5 | FicusFicusov | GPL-3.0-only | [FicusFicusov/CoralFlower](https://github.com/FicusFicusov/CoralFlower/tree/b5ceb997be330c8a420958eb8f4e0f4b3ca084c2) |
| `duell-1.0.rfm1` | DUELL (unofficial build) 1.0 | oscillr | GPL-3.0-only | [oscillr/DUELL](https://github.com/oscillr/DUELL/tree/33e2e2ed36a9d1a33a39ac1d1f06282c9045aab0) |
| `felucca-1.6.1.rfm1` | Felucca 1.6.1 | Leo Kuroshita (Hügelton Instruments) | GPL-3.0-only | [hugelton/Felucca](https://github.com/hugelton/Felucca/tree/a53ecf428c29c780108fd70a31b71a32a6b5c313) |
| `fimba-0.6.1.rfm1` | FiMba-1 0.6.1 | jadamsowers | GPL-3.0-only | [jadamsowers/fm1-fimba](https://github.com/jadamsowers/fm1-fimba/tree/0485ed0d387ce78216428c7b19f97d77bbe10b4d) |
| `fmini-1.8.0.rfm1` | FMini-1 1.8.0 | ruppert | GPL-3.0-only | [ruppert/fmini-1](https://github.com/ruppert/fmini-1/tree/ab0f5c83d9c3b8cf10fd2f9ef3dc760a06c3abb3) |
| `fomni-0.4.rfm1` | FoMni-1 0.4 | Charles Vestal | GPL-3.0-only | [charlesvestal/fm1-fomni](https://github.com/charlesvestal/fm1-fomni/tree/6ecd227013cc18def0e89d035b3760eb268b342b) |
| `ghoulbox-2.3.2.rfm1` | GHOULBOX 2.3.2 | jasonpersinger | GPL-3.0-only | [jasonpersinger/ghoulbox-fm1-dungeon-synth](https://github.com/jasonpersinger/ghoulbox-fm1-dungeon-synth/tree/71ac3f87e0a33b08831f11a89fbd6012de8024ce) |
| `jiant-0.9.9.rfm1` | JIANT FM 0.9.9 | juanjiant-bit | GPL-3.0-only | [juanjiant-bit/JIANT](https://github.com/juanjiant-bit/JIANT/tree/0912abb2f0c71cd26252d441dc74f3cdf825e6fb) |
| `minitone-1.0.1.rfm1` | Mini-Tone 1.0.1 | eldontyrellcorp | GPL-3.0-only | [eldontyrellcorp/Mini-Tone](https://github.com/eldontyrellcorp/Mini-Tone/tree/5e5d09c52f8aed2cf6688c8d23a25dd91532a261) |
| `pigeon-0.4.1.rfm1` | PIGEON 0.4.1 | TheShrimpBlimp | GPL-3.0-only | [TheShrimpBlimp/pigeon](https://github.com/TheShrimpBlimp/pigeon/tree/8f34e81b6d7b03fa45ffd7443b71f9ba838ef0f7) |
| `purplemonkey-0.11.rfm1` | PurpleMonkey 0.11 | Quixotic7 | GPL-3.0-only | [Quixotic7/PurpleMonkeyFM1](https://github.com/Quixotic7/PurpleMonkeyFM1/tree/7590d4a5205bd4932b206d676c09b9521843a023) |
| `s1vave-1.0.rfm1` | S1Vave 1.0 | Andrew GG (a fork of zvenson's OberVave) | GPL-3.0-only | [AndrewGG88/S1Vave](https://github.com/AndrewGG88/S1Vave/tree/97303378678c247ca1d005ae641114f4544acf65) |
| `skiff-1.4.rfm1` | Skiff 1.4 | illuminus5 | GPL-3.0-only | [illuminus5/skiff](https://github.com/illuminus5/skiff/tree/c01fa1ed619266d770ea6552b153612e1b77d0a9) |
| `speak37-1.0.rfm1` | Speak37 1.0 | genkigenki | GPL-3.0-only | [genkigenki/Speak37](https://github.com/genkigenki/Speak37/tree/a617d60fca316bd8c72ac9041579367f6633c0ab) |

**How they were built:** with [FM1VST](https://github.com/Quixotic7/FM1VST)'s `fm1_add_rfm1` (branch `rfm1-target`,
commit [`0da0448`](https://github.com/Quixotic7/FM1VST/tree/0da04482a3af4f5054fdf0171ed43c05573ca0f3)), Emscripten 6.0.13. That commit holds the
build glue for each firmware (`core-glue/`), the `.rfm1` shim and the tools; its `docs/RFM1.md` says how to rebuild a
file and how firmware authors can make `.rfm1` files in their own releases. Together with each firmware's source above,
that is the complete source of every file here.

`s1vave-1.0.rfm1` was built later, from FM1VST's branch `s1vave`
(commit [`13a66e2`](https://github.com/Quixotic7/FM1VST/tree/13a66e2e0a06cff40b732b5c4094cf4cb7187b6e), Emscripten 6.0.13). That branch adds S1Vave's glue and
the in-module coroutine that firmwares on zvenson's Dinghy platform need as `.rfm1` files.

**Firmware authors:** if you'd rather your firmware weren't listed here, or want to publish `.rfm1` files yourself,
open an issue and it will be changed or removed.
