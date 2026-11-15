// SPDX-License-Identifier: GPL-3.0-only
// The author .rfm1 sync's accept / refuse rules on fixtures: node --test tools/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readRfm1, judgeStatic, judgeRuns, pickStableRelease, isStableTag, cmpVer, nextTag, newSums, parseSums, sumsText,
  glueRunArgs, releaseNotes } from "./author_rfm1_sync.mjs";

// a minimal .rfm1: the Wasm header and the custom sections
function section(name, text) {
  const n = Buffer.from(name), b = Buffer.from(text);
  const uleb = (v) => { const o = []; do { let x = v & 0x7f; v >>>= 7; if (v) x |= 0x80; o.push(x); } while (v); return Buffer.from(o); };
  const body = Buffer.concat([uleb(n.length), n, b]);
  return Buffer.concat([Buffer.from([0]), uleb(body.length), body]);
}
const A = "a".repeat(40), B = "b".repeat(40), C = "c".repeat(40);
function rfm1(m = {}, { licences = 1, pad = "" } = {}) {
  const man = { rfm1: 1, abi: 6, id: "loom", name: "LOOM-8", version: "0.16.2", license: "GPL-3.0-only",
    source_url: `https://github.com/charlesvestal/fm1-loom@${A}`, authors: ["Charles Vestal"], built_by: "fm1-base c8e0599 tools/build.py --rfm1, emcc 6.0.10", ...m };
  const secs = [section("rfm1", JSON.stringify(man)), section("rfm1.credits", "credits" + pad)];
  for (let i = 0; i < licences; i++) secs.push(section(`rfm1.license.${i}`, "GNU GENERAL PUBLIC LICENSE\n..."));
  return readRfm1(Buffer.concat([Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0]), ...secs]));
}
const ours = (m = {}) => rfm1({ version: "0.15.1", source_url: `https://github.com/charlesvestal/fm1-loom@${C}`, built_by: "FM1VST 0.6.2 (666f79970ac9) fm1_add_rfm1, emcc 6.0.13", ...m });
const rel = { slug: "charlesvestal/fm1-loom", tag: "v0.16.2", tagCommit: A };
const ctx = (cur, author, extra = {}) => judgeStatic({ cur: { file: "x.rfm1", info: cur }, author: { asset: "a.rfm1", info: author }, rel, abis: new Set([6]), formats: new Set([1]), ...extra });

test("readRfm1 reads the manifest and licence sections", () => {
  const i = rfm1({}, { licences: 2 });
  assert.equal(i.manifest.id, "loom");
  assert.equal(i.licenses.length, 2);
  assert.match(i.sha256, /^[0-9a-f]{64}$/);
});

test("a newer author release at the tag's commit is a candidate, renamed to <id>-<version>.rfm1", () => {
  const r = ctx(ours(), rfm1());
  assert.equal(r.verdict, "candidate");
  assert.equal(r.file, "loom-0.16.2.rfm1");
  assert.deepEqual(r.notes, []);
});

test("the same bytes are already the author's file", () => {
  const f = rfm1();
  assert.equal(ctx(f, f).verdict, "same");
});

test("the same version replaces our build (AMB-1, FRASIL), not an author's file with other bytes", () => {
  assert.equal(ctx(ours({ version: "0.16.2" }), rfm1()).verdict, "candidate");
  const r = ctx(rfm1({}, { pad: "x" }), rfm1());
  assert.equal(r.verdict, "refuse");
  assert.match(r.reasons[0], /already not FM1VST's build/);
});

test("a held firmware keeps our build, even for a newer author release", () => {
  const r = ctx(ours({ id: "evilgenius" }), rfm1({ id: "evilgenius" }));
  assert.equal(r.verdict, "held");
  assert.match(r.reasons[0], /SysEx/);
});

test("an older author release is not taken (and not a refusal)", () => {
  const r = ctx(ours({ version: "0.17" }), rfm1());
  assert.equal(r.verdict, "older");
});

test("another manifest id is refused (CTL-1: ctl1 in current, ctl in the author's file)", () => {
  const r = ctx(ours({ id: "ctl1" }), rfm1({ id: "ctl" }));
  assert.equal(r.verdict, "refuse");
  assert.match(r.reasons.join(), /manifest id "ctl" is not the current file's "ctl1"/);
});

test("a commit other than the tag's (FRASIL 3.3.1: a9799c3, unpublished) is taken with a note", () => {
  const r = ctx(ours({ version: "0.16.2" }), rfm1({ source_url: `https://github.com/charlesvestal/fm1-loom@${B}` }), { commitOnGitHub: false });
  assert.equal(r.verdict, "candidate");
  assert.match(r.notes[0], /bbbbbbb, which is not on GitHub \(the tag v0.16.2 is aaaaaaa\)/);
  const r2 = ctx(ours(), rfm1({ source_url: `https://github.com/charlesvestal/fm1-loom@${B}` }), { commitOnGitHub: true });
  assert.match(r2.notes[0], /not the tag v0.16.2's commit/);
});

test("refusals: version not the tag's, another repository, no licence texts, an abi or format current does not use, a bad name", () => {
  const cases = [
    [rfm1({ version: "0.16.3" }), /manifest version 0.16.3 is not the release tag v0.16.2's version 0.16.2/],
    [rfm1({ source_url: `https://github.com/someone/fork@${A}` }), /source_url names someone\/fork, not charlesvestal\/fm1-loom/],
    [rfm1({}, { licences: 0 }), /no licence texts/],
    [rfm1({ abi: 7 }), /abi 7 is not one current's files use/],
    [rfm1({ rfm1: 2 }), /rfm1 format 2/],
    [rfm1({ source_url: `https://github.com/charlesvestal/fm1-loom@${A.slice(0, 7)}` }), /40-hex commit/],
    [rfm1({ virtual: true }), /Fantasy CFW/],
    [rfm1({ authors: [] }), /authors empty/],
  ];
  for (const [a, re] of cases) {
    const r = ctx(ours(), a);
    assert.equal(r.verdict, "refuse", String(re));
    assert.match(r.reasons.join("; "), re);
  }
  const bad = judgeStatic({ cur: { file: "x", info: ours({ id: "Bad" }) }, author: { info: rfm1({ id: "Bad", version: "0.16.2" }) }, rel, abis: new Set([6]), formats: new Set([1]) });
  assert.match(bad.reasons.join(), /is not an <id>-<version>.rfm1 name/);
});

const line = (rms, lcd = 90) => `loom 0.16.2: chord rms ${rms} (peak 0.1), ${lcd} LCD writes, 40.0x real time`;
const ok = { code: 0, out: "ok: loom" };
test("rfm1_run: sound, a screen, no trap; silence only when the current file is silent too (LOOM-8)", () => {
  assert.equal(judgeRuns({ check: ok, runAuthor: { code: 0, out: line("0.0160") }, runCur: { code: 0, out: line("0.0150") } }).ok, true);
  const s = judgeRuns({ check: ok, runAuthor: { code: 0, out: line("0.0000") }, runCur: { code: 0, out: line("0.0150") } });
  assert.equal(s.ok, false);
  assert.match(s.reasons[0], /silent/);
  assert.equal(judgeRuns({ check: ok, runAuthor: { code: 0, out: line("0.0000") }, runCur: { code: 0, out: line("0.0000") } }).ok, true);
  assert.equal(judgeRuns({ check: ok, runAuthor: { code: 0, out: line("0.0000") }, runCur: { code: 0, out: line("0.0150") }, silentOk: true }).ok, true);
  assert.match(judgeRuns({ check: ok, runAuthor: { code: 1, out: "rfm1_run: trap: out of bounds memory access" }, runCur: { code: 0, out: line("0.01") } }).reasons[0], /exit 1.*trap/);
  assert.match(judgeRuns({ check: ok, runAuthor: { code: 0, out: line("0.0160", 0) }, runCur: { code: 0, out: line("0.01") } }).reasons[0], /no LCD writes/);
  assert.match(judgeRuns({ check: { code: 1, out: "error: import env.foo not allowed" }, runAuthor: { code: 0, out: line("0.0160") }, runCur: { code: 0, out: line("0.01") } }).reasons[0], /rfm1_check failed: error: import/);
});

test("the newest stable release: no drafts, no prereleases, no beta tags", () => {
  const r = pickStableRelease([
    { tag_name: "v0.17-beta.1", published_at: "2026-11-15T00:00:00Z" },
    { tag_name: "v0.16.9", prerelease: true, published_at: "2026-11-14T12:00:00Z" },
    { tag_name: "v0.16.8", draft: true, published_at: "2026-11-14T13:00:00Z" },
    { tag_name: "v0.16.2", published_at: "2026-11-14T12:09:17Z" },
    { tag_name: "v0.16.1", published_at: "2026-11-14T11:46:47Z" },
  ]);
  assert.equal(r.tag_name, "v0.16.2");
  assert.equal(pickStableRelease([{ tag_name: "nightly" }]), null);
  assert.ok(isStableTag("ghoulbox-v2.4") && isStableTag("V1.88") && !isStableTag("v1.0-rc1"));
  assert.ok(cmpVer("0.16.2", "0.15.1") > 0 && cmpVer("1.3.2", "1.3.2") === 0 && cmpVer("0.16", "0.16.2") < 0);
});

test("SHA256SUMS: the replaced name out, the new one in; tags get the next free suffix", () => {
  const old = parseSums(`${"1".repeat(64)}  amb-1.3.2.rfm1\n${"2".repeat(64)}  loom-0.15.1.rfm1\n`);
  const s = newSums(old, [{ file: "loom-0.16.2.rfm1", sha256: "3".repeat(64), was: "loom-0.15.1.rfm1" }, { file: "amb-1.3.2.rfm1", sha256: "4".repeat(64), was: "amb-1.3.2.rfm1" }]);
  assert.equal(sumsText(s), `${"4".repeat(64)}  amb-1.3.2.rfm1\n${"3".repeat(64)}  loom-0.16.2.rfm1\n`);
  const taken = new Set(["2026-11-15", "2026-11-15b"]);
  assert.equal(nextTag("2026-11-15", (t) => taken.has(t)), "2026-11-15c");
  assert.equal(nextTag("2026-11-16", (t) => taken.has(t)), "2026-11-16");
});

test("the dated release's notes name the author's release and say the file is unchanged", () => {
  const n = releaseNotes("2026-11-16", [{ file: "ctl-1.0.4.rfm1", was: "ctl-1.0.3.rfm1", name: "CTL-1", version: "1.0.4", slug: "charlesvestal/fm1-ctl",
    tag: "v1.0.4", url: "https://github.com/charlesvestal/fm1-ctl/releases/tag/v1.0.4", asset: "ctl-1.0.4.rfm1", builtBy: "fm1-base x" }], 84, "2026-11-15");
  assert.match(n, /the 1 file this publish added or updated/);
  assert.match(n, /\*\*Updated:\*\* `ctl-1.0.4.rfm1` \(was `ctl-1.0.3.rfm1`\)/);
  assert.match(n, /\[charlesvestal\/fm1-ctl v1.0.4\]\(https:\/\/github.com\/charlesvestal\/fm1-ctl\/releases\/tag\/v1.0.4\).*built by the author \(fm1-base x\), unchanged\./);
});

test("RUN_ARGS from the glue, with its folders expanded", () => {
  const g = `fm1_add_core(trax SOURCE x)\nfm1_add_rfm1(trax AUTHORS "j" # a comment (with parens)\n             RUN_ARGS --press PLAY@2000 --tap 10)\nfm1_add_rfm1(mpyre RUN_ARGS --sysex \${CMAKE_SOURCE_DIR}/tests/f.syx MEMORY_MIB 16)\nfm1_add_rfm1(plain AUTHORS "x")\n`;
  assert.deepEqual(glueRunArgs(g, "/g", "/root"), { trax: ["--press", "PLAY@2000", "--tap", "10"], mpyre: ["--sysex", "/root/tests/f.syx"] });
});
