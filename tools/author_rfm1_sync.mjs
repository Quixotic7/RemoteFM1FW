#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// The nightly author .rfm1 sync (.github/workflows/author-rfm1-sync.yml, docs/AUTHOR-RFM1.md).
//
// For every firmware in the rolling release `current`, the repository its source_url names is asked for its newest
// stable GitHub release. An .rfm1 attached there replaces the file in `current` (renamed to <id>-<version>.rfm1, the
// bytes unchanged) when every check passes: the same manifest id; a newer version (or the same version when the file
// in `current` is FM1VST's build), equal to the release tag's version; source_url in the same repository (a commit
// other than the tag's is taken with a warning: the public-commit rule is for our own builds, owner 2026-11-15);
// licence texts; an abi the files in `current` use; rfm1_check.py; rfm1_run (no trap, a screen, and sound unless the
// file in `current` is silent too). What passed goes up to `current` (with a new SHA256SUMS) and to a dated
// release with only those files, as RFM1Manager's publish does. The rules and the small helpers below (isStableTag,
// cmpVer, readRfm1, manifestProblems, the notes) are copied from RFM1Manager (https://github.com/Quixotic7/RFM1Manager,
// lib/util.js, lib/rfm1.js, lib/publish.js); this script stays self-contained so the workflow needs nothing else.
// Nothing is added that is not in `current` already, so a GATED firmware stays as it is: hosted here only.
//
//   node tools/author_rfm1_sync.mjs --fm1vst DIR --rfm1-run BIN [--dry-run] [--repo OWNER/NAME] [--work DIR]
//                                   [--current-dir DIR] [--today YYYY-MM-DD]
//
// --current-dir reads a local folder (its .rfm1 files) as `current` instead of the release, for a dry run against a
// staged set. Needs: Node 20, gh (logged in, or GH_TOKEN), python3. No npm packages.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, appendFileSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

export const ROLLING = "current";

// ---------- the manager's rules (RFM1Manager lib/util.js, lib/publish.js, lib/rfm1.js) ----------
export const NAME_RE = /^[a-z0-9_]{1,31}-[A-Za-z0-9._+-]+\.rfm1$/;
export const FORBIDDEN_RE = /\.(syx|sysex|mid|midi|json|bin|wav|aif|aiff|txt|zip|tar|gz|c|h|py)$/i;
export const PRE_RE = /(rc|beta|alpha|pre|preview|dev|nightly|test|snapshot|draft|wip)/i;
export function isStableTag(t) {
  return /^(?:[A-Za-z][A-Za-z0-9_]*[-_])?[vV]?\d+(\.\d+){0,3}$/.test(t) && !PRE_RE.test(t);
}
export function verOf(t) { return String(t).replace(/^[A-Za-z][A-Za-z0-9_]*[-_](?=v?\d)/, "").replace(/^v/i, ""); }
export function cmpVer(a, b) {
  const pa = verOf(a).split(/[.\-]/).map((x) => parseInt(x, 10) || 0), pb = verOf(b).split(/[.\-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
  return 0;
}

export const sha256 = (b) => createHash("sha256").update(b).digest("hex");

function leb(buf, pos) {
  let r = 0, shift = 0, b;
  do { b = buf[pos++]; r |= (b & 0x7f) << shift; shift += 7; } while (b & 0x80);
  return [r >>> 0, pos];
}
// an .rfm1 (a Wasm module) read without running it: its custom sections
export function readRfm1(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x0061736d) throw new Error("not a WebAssembly module");
  let pos = 8;
  const custom = {};
  while (pos < buf.length) {
    const id = buf[pos++];
    let size; [size, pos] = leb(buf, pos);
    const end = pos + size;
    if (end > buf.length) throw new Error("a section runs past the end of the file");
    if (id === 0) {
      let n, p2; [n, p2] = leb(buf, pos);
      custom[buf.slice(p2, p2 + n).toString("utf8")] = buf.slice(p2 + n, end).toString("utf8");
    }
    pos = end;
  }
  if (!custom.rfm1) throw new Error("no rfm1 manifest section");
  const manifest = JSON.parse(custom.rfm1);
  const licenses = Object.keys(custom).filter((k) => k.startsWith("rfm1.license.")).sort()
    .map((k) => ({ section: k, name: custom[k].split("\n")[0], bytes: custom[k].length }));
  return { manifest, licenses, credits: custom["rfm1.credits"] || "", sha256: sha256(buf), size: buf.length };
}

export function manifestProblems(info) {
  const m = info.manifest, p = [];
  for (const k of ["rfm1", "abi", "id", "name", "version", "license", "source_url"]) if (m[k] === undefined || m[k] === "") p.push(`manifest: ${k} missing`);
  if (!Array.isArray(m.authors) || !m.authors.length) p.push("manifest: authors empty");
  if (!/^https:\/\/github\.com\/[^/@\s]+\/[^/@\s]+@[0-9a-f]{40}$/.test(m.source_url || "")) p.push(`manifest: source_url is not https://github.com/<owner>/<repo>@<40-hex commit> (${m.source_url})`);
  if (!info.licenses.length) p.push("no licence texts (rfm1.license.<n> sections)");
  return p;
}

export const commitOf = (m) => (/@([0-9a-f]{7,40})$/.exec(m?.source_url || "") || [])[1] || null;
export const slugOf = (m) => (/^https:\/\/github\.com\/([^/@\s]+\/[^/@\s]+?)(?:\.git)?@/.exec(m?.source_url || "") || [])[1] || null;
// FM1VST's own build (fm1_add_rfm1): "FM1VST 0.6.2 (e85477bb6807) fm1_add_rfm1, emcc ..."
// firmwares whose FM1VST build stays in `current` even when the author's release has an .rfm1: id -> why (the owner's
// call; the manager has the same list, RFM1Manager lib/authorrfm1.js AUTHOR_RFM1_HOLD)
export const HOLD = {
  evilgenius: "held on FM1VST's build (owner, 2026-11-15): fm1-base's --rfm1 host (host/rfm1.c) gives SysEx to its screen reader only, so the app never answers its manager",
};
export const isOurBuild = (m) => /^FM1VST /.test(m?.built_by || "");
const digestSha = (a) => (a?.digest && a.digest.startsWith("sha256:") ? a.digest.slice(7).toLowerCase() : null);

// the newest stable release: not a draft, not a prerelease, a tag the manager calls stable
export function pickStableRelease(releases) {
  return (releases || []).filter((r) => !r.draft && !r.prerelease && isStableTag(r.tag_name))
    .sort((a, b) => String(b.published_at || b.created_at).localeCompare(String(a.published_at || a.created_at)))[0] || null;
}

// rfm1_run's verdict line ("loom 0.16.2: chord rms 0.0000 (peak 0.000), 94 LCD writes, 38.4x real time ...")
export function parseRun(text) {
  const m = /chord rms ([0-9.]+) \(peak ([0-9.]+)\), (\d+) LCD writes, ([0-9.]+)x real time/.exec(text || "");
  return m ? { rms: Number(m[1]), peak: Number(m[2]), lcd: Number(m[3]), realtime: Number(m[4]), line: m[0] } : null;
}
// rfm1_run's own silence threshold (its --min-rms default); the sync runs it with --min-rms 0 and judges here
export const SILENT_RMS = 0.0005;

const short = (c) => String(c || "?").slice(0, 7);

// the checks that need no tool: { verdict: "same" | "held" | "older" | "refuse" | "candidate", reasons, file }
//   cur:    { file, info }               the file in `current`
//   author: { asset, info }              the author's .rfm1 (asset: its release asset name)
//   rel:    { slug, tag, tagCommit }     the author's release; tagCommit: the tag's commit (40 hex)
//   commitOnGitHub: whether the manifest's commit exists in the repository (asked only when it is not the tag's)
//   abis, formats: the abi / rfm1 values of the files in `current`
export function judgeStatic({ cur, author, rel, commitOnGitHub = null, abis, formats }) {
  const m = author.info.manifest, cm = cur.info.manifest;
  if (author.info.sha256 === cur.info.sha256) return { verdict: "same", reasons: [] };
  if (HOLD[cm.id]) return { verdict: "held", reasons: [HOLD[cm.id]] };
  const p = [];
  if (m.id !== cm.id) p.push(`its manifest id "${m.id}" is not the current file's "${cm.id}"`);
  else {
    const c = cmpVer(m.version, cm.version);
    if (c < 0) return { verdict: "older", reasons: [`the author's ${m.version} is older than ${cm.version} in ${ROLLING}`] };
    if (c === 0) {
      if (!isOurBuild(cm)) p.push(`the same version ${m.version} as the file in ${ROLLING}, which is already not FM1VST's build, with other bytes`);
    }
  }
  if (verOf(m.version) !== verOf(rel.tag)) p.push(`its manifest version ${m.version} is not the release tag ${rel.tag}'s version ${verOf(rel.tag)}`);
  const s = slugOf(m);
  if (s && s.toLowerCase() !== rel.slug.toLowerCase()) p.push(`source_url names ${s}, not ${rel.slug}`);
  // owner, 2026-11-15: the commit rule is for the files we build; the author's own file is their release's file even
  // when its source_url names another (or an unpublished) commit: taken, with a warning
  const notes = [];
  const ac = commitOf(m);
  if (ac && ac !== rel.tagCommit) {
    if (commitOnGitHub === false) notes.push(`source_url names commit ${short(ac)}, which is not on GitHub (the tag ${rel.tag} is ${short(rel.tagCommit)})`);
    else notes.push(`source_url names commit ${short(ac)}, not the tag ${rel.tag}'s commit ${short(rel.tagCommit)}`);
  }
  p.push(...manifestProblems(author.info));
  if (!abis.has(m.abi)) p.push(`abi ${m.abi} is not one ${ROLLING}'s files use (${[...abis].join(", ")})`);
  if (!formats.has(m.rfm1)) p.push(`rfm1 format ${m.rfm1} is not one ${ROLLING}'s files use (${[...formats].join(", ")})`);
  if (!!m.virtual !== !!cm.virtual) p.push(m.virtual ? "a Fantasy CFW (virtual) where the current file is not" : "not a Fantasy CFW (virtual) where the current file is");
  const file = `${m.id}-${m.version}.rfm1`;
  if (!NAME_RE.test(file) || FORBIDDEN_RE.test(file)) p.push(`${file} is not an <id>-<version>.rfm1 name RemoteFM1FW publishes`);
  return p.length ? { verdict: "refuse", reasons: p, notes } : { verdict: "candidate", reasons: [], notes, file };
}

// the tools' verdicts: check = rfm1_check.py { code, out }; runAuthor / runCur = rfm1_run { code, out }
export function judgeRuns({ check, runAuthor, runCur, silentOk = false }) {
  const p = [];
  const last = (t) => String(t || "").trim().split("\n").filter((l) => /error|fail|trap|halt/i.test(l)).slice(-1)[0] || String(t || "").trim().split("\n").slice(-1)[0] || "";
  if (check.code !== 0) p.push(`rfm1_check failed: ${last(check.out).slice(0, 200)}`);
  const a = parseRun(runAuthor.out), c = runCur ? parseRun(runCur.out) : null;
  if (runAuthor.code !== 0) p.push(`rfm1_run failed (exit ${runAuthor.code}): ${last(runAuthor.out).slice(0, 200)}`);
  else if (!a) p.push("rfm1_run printed no chord line");
  else {
    if (a.lcd === 0) p.push("rfm1_run: no LCD writes");
    const curSilent = !!c && runCur.code === 0 && c.rms < SILENT_RMS;
    if (a.rms < SILENT_RMS && !silentOk && !curSilent) p.push(`rfm1_run: silent (chord rms ${a.rms}) where the current file plays (rms ${c ? c.rms : "?"})`);
  }
  return { ok: !p.length, reasons: p, run: a, curRun: c };
}

// ---------- sums, notes, tags ----------
export function parseSums(t) {
  const m = new Map();
  for (const l of String(t || "").split("\n")) { const r = /^([0-9a-f]{64})\s+\*?(\S+)$/.exec(l.trim()); if (r) m.set(r[2], r[1]); }
  return m;
}
export const sumsText = (map) => [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([n, h]) => `${h}  ${n}\n`).join("");

// `current`'s SHA256SUMS after the replacements: [{ file, sha256, was }]
export function newSums(oldSums, taken) {
  const m = new Map(oldSums);
  for (const t of taken) { m.delete(t.was); m.set(t.file, t.sha256); }
  return m;
}

export function nextTag(day, exists) {
  for (const s of ["", ..."bcdefghijklmnopqrstuvwxyz"]) if (!exists(`${day}${s}`)) return `${day}${s}`;
  throw new Error(`no free tag for ${day}`);
}

// the dated release's notes, in RFM1Manager's words (lib/publish.js releaseNotes) plus the author's release of each
export function releaseNotes(tag, taken, total, prevName) {
  const n = taken.length;
  const lines = [`RemoteFM1 firmware files (.rfm1), ${tag}: the ${n} file${n === 1 ? "" : "s"} this publish added or updated; SHA256SUMS lists their SHA-256. The full set (${total} files) is the release \`${ROLLING}\` (always Latest).`, ""];
  lines.push("**Updated:** " + taken.map((t) => `\`${t.file}\` (was \`${t.was}\`)`).join(", "), "");
  for (const t of taken) lines.push(`- \`${t.file}\`: ${t.name} ${t.version}, from the author's release [${t.slug} ${t.tag}](${t.url}) (\`${t.asset}\`): built by the author (${t.builtBy}), unchanged${t.asset !== t.file ? ` (renamed to \`${t.file}\`)` : ""}.`);
  lines.push("");
  lines.push(`Compared with ${prevName}. Each file's licence texts, credits and its exact source (source_url at its commit) are inside it. Published by the nightly author .rfm1 sync (.github/workflows/author-rfm1-sync.yml): the firmware's own release file, checked with rfm1_check and rfm1_run.`);
  return lines.join("\n") + "\n";
}
export function currentNotes(tag, notes, n) {
  return `${notes.replace(/\s+$/, "")}\n\n---\n\`${ROLLING}\` always holds the full set: every current .rfm1 file and SHA256SUMS (${n} files), updated in place by each publish. This is ${tag}: the dated release ${tag} holds only the files it added or updated, older dated releases hold the older versions.\n`;
}

// ---------- FM1VST glue: RUN_ARGS per core id (rfm1_run's options in the glue's test) ----------
const KEYS_RFM1 = ["AUTHORS", "MEMORY_MIB", "STACK_KIB", "LICENSE_FILES", "SOURCE_URL", "DEFINES", "FLAGS", "INCLUDES", "RUN_ARGS", "HOSTED_DESPITE_GATE", "VIRTUAL", "NEEDS", "FOLDERS"];
export function glueRunArgs(text, fileDir, root) {
  const out = {};
  const re = /^\s*fm1_add_rfm1\s*\(/gm;
  let m;
  while ((m = re.exec(text))) {
    let i = m.index + m[0].length, depth = 1, inq = false, body = "";
    for (; i < text.length && depth; i++) {
      const c = text[i];
      if (c === '"' && text[i - 1] !== "\\") inq = !inq;
      else if (!inq && c === "#") { while (i < text.length && text[i] !== "\n") i++; continue; }
      else if (!inq && c === "(") depth++;
      else if (!inq && c === ")") { depth--; if (!depth) break; }
      body += c;
    }
    const toks = [...body.matchAll(/"((?:[^"\\]|\\.)*)"|(\S+)/g)].map((x) => (x[1] !== undefined ? x[1] : x[2]));
    const id = toks[0];
    const k = toks.indexOf("RUN_ARGS");
    if (!id || k < 0) continue;
    const args = [];
    for (const t of toks.slice(k + 1)) { if (KEYS_RFM1.includes(t)) break; args.push(t); }
    out[id] = args.map((a) => a.replaceAll("${CMAKE_CURRENT_LIST_DIR}", fileDir).replaceAll("${CMAKE_SOURCE_DIR}", root));
  }
  return out;
}
function loadRunArgs(fm1vst) {
  const out = {};
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n.endsWith(".cmake")) Object.assign(out, glueRunArgs(readFileSync(p, "utf8"), dirname(p), fm1vst));
    }
  };
  if (existsSync(join(fm1vst, "core-glue"))) walk(join(fm1vst, "core-glue"));
  return out;
}

// ---------- I/O ----------
function sh(cmd, args, { input, binary = false, timeoutMs = 10 * 60e3 } = {}) {
  const r = spawnSync(cmd, args, { input, maxBuffer: 256 << 20, timeout: timeoutMs, encoding: binary ? "buffer" : "utf8", env: { ...process.env, GH_PROMPT_DISABLED: "1" } });
  const err = binary ? (r.stderr || Buffer.alloc(0)).toString("utf8") : r.stderr || "";
  return { code: r.status ?? (r.error ? 127 : 1), out: r.stdout ?? (binary ? Buffer.alloc(0) : ""), err: err + (r.error ? String(r.error) : "") };
}
function ghJson(path) {
  const r = sh("gh", ["api", path]);
  if (r.code) { const e = new Error(`gh api ${path}: ${(r.err || r.out).trim().slice(0, 300)}`); e.status = /HTTP (\d+)/.exec(r.err)?.[1]; throw e; }
  return JSON.parse(r.out);
}
function ghOk(args, timeoutMs) {
  const r = sh("gh", args, { timeoutMs });
  if (r.code) throw new Error(`gh ${args.join(" ")}: exit ${r.code}: ${(r.err || r.out).trim().slice(-1000)}`);
  return r.out;
}
// a release asset by its id, cached under dir/<name> when its SHA-256 is the asset's digest
function fetchAsset(repo, a, path) {
  const want = digestSha(a);
  if (existsSync(path) && (!want || sha256(readFileSync(path)) === want) && statSync(path).size === a.size) return readFileSync(path);
  const r = sh("gh", ["api", "-H", "Accept: application/octet-stream", `repos/${repo}/releases/assets/${a.id}`], { binary: true });
  if (r.code) throw new Error(`download ${repo} ${a.name}: ${r.err.trim().slice(0, 300)}`);
  if (want && sha256(r.out) !== want) throw new Error(`download ${repo} ${a.name}: SHA-256 is not the asset's digest`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, r.out);
  return r.out;
}

function parseArgs(argv) {
  const o = { repo: "Quixotic7/RemoteFM1FW", dryRun: false, work: join(process.env.RUNNER_TEMP || tmpdir(), "author-rfm1-sync"),
    fm1vst: null, rfm1Run: null, currentDir: null, today: new Date().toISOString().slice(0, 10), python: "python3" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = () => argv[++i];
    if (a === "--dry-run") o.dryRun = true;
    else if (a === "--repo") o.repo = v();
    else if (a === "--work") o.work = resolve(v());
    else if (a === "--fm1vst") o.fm1vst = resolve(v());
    else if (a === "--rfm1-run") o.rfm1Run = resolve(v());
    else if (a === "--current-dir") o.currentDir = resolve(v());
    else if (a === "--today") o.today = v();
    else if (a === "--python") o.python = v();
    else throw new Error(`unknown option ${a}`);
  }
  if (!o.fm1vst || !o.rfm1Run) throw new Error("--fm1vst DIR (FM1VST's tools/ and core-glue/) and --rfm1-run BIN are required");
  if (o.currentDir && !o.dryRun) throw new Error("--current-dir is for a dry run only");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.today)) throw new Error(`bad --today ${o.today}`);
  return o;
}

const ann = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

export async function main(argv) {
  const o = parseArgs(argv);
  const say = (l) => process.stdout.write(l + "\n");
  const warn = (title, msg) => say(process.env.GITHUB_ACTIONS ? `::warning title=${ann(title).replace(/[:,]/g, " ")}::${ann(msg)}` : `warning: ${title}: ${msg}`);
  mkdirSync(o.work, { recursive: true });

  // 1. `current`: its assets (digests), SHA256SUMS and manifests
  let live = null, curName, oldSumsText;
  const cur = [];
  if (o.currentDir) {
    curName = `${relative(process.cwd(), o.currentDir) || o.currentDir} (local)`;
    for (const n of readdirSync(o.currentDir).filter((x) => x.endsWith(".rfm1")).sort()) cur.push({ file: n, path: join(o.currentDir, n), buf: readFileSync(join(o.currentDir, n)) });
    oldSumsText = existsSync(join(o.currentDir, "SHA256SUMS")) ? readFileSync(join(o.currentDir, "SHA256SUMS"), "utf8") : sumsText(new Map(cur.map((c) => [c.file, sha256(c.buf)])));
  } else {
    live = ghJson(`repos/${o.repo}/releases/tags/${ROLLING}`);
    curName = live.name || ROLLING;
    const sa = live.assets.find((a) => a.name === "SHA256SUMS");
    if (!sa) throw new Error(`${ROLLING} has no SHA256SUMS`);
    oldSumsText = fetchAsset(o.repo, sa, join(o.work, "current", `SHA256SUMS-${digestSha(sa) || sa.id}`)).toString("utf8");
    for (const a of live.assets.filter((x) => x.name.endsWith(".rfm1")).sort((x, y) => x.name.localeCompare(y.name))) {
      const p = join(o.work, "current", a.name);
      cur.push({ file: a.name, path: p, buf: fetchAsset(o.repo, a, p), asset: a });
    }
  }
  const oldSums = parseSums(oldSumsText);
  for (const c of cur) {
    try { c.info = readRfm1(c.buf); } catch (e) { c.error = e.message; }
    if (oldSums.get(c.file) && c.info && oldSums.get(c.file) !== c.info.sha256) c.error = `not the SHA-256 ${ROLLING}'s SHA256SUMS lists`;
  }
  const good = cur.filter((c) => c.info && !c.error);
  const abis = new Set(good.map((c) => c.info.manifest.abi)), formats = new Set(good.map((c) => c.info.manifest.rfm1));
  const ids = new Set(good.map((c) => c.info.manifest.id));
  const runArgs = loadRunArgs(o.fm1vst);
  say(`${ROLLING}: ${curName}, ${cur.length} .rfm1 files (abi ${[...abis].join(", ")}); ${o.dryRun ? "dry run" : "publishing what passes"}`);

  // 2. each firmware's author release
  const res = { taken: [], same: [], refused: [], none: [], errors: [] };
  const relCache = new Map();
  for (const c of cur) {
    if (c.error) { res.errors.push({ c, why: c.error }); continue; }
    const m = c.info.manifest, label = `${m.name} ${m.version} (\`${c.file}\`)`;
    const slug = slugOf(m);
    if (!slug) { res.none.push({ c, label, why: "source_url is not a GitHub repository" }); continue; }
    let rels = relCache.get(slug.toLowerCase());
    if (!rels) {
      try { rels = ghJson(`repos/${slug}/releases?per_page=30`); } catch (e) { res.errors.push({ c, label, why: `could not list ${slug}'s releases: ${e.message}` }); continue; }
      relCache.set(slug.toLowerCase(), rels);
    }
    const rel = pickStableRelease(rels);
    if (!rel) { res.none.push({ c, label, slug, why: "no stable release" }); continue; }
    const assets = rel.assets.filter((a) => a.name.endsWith(".rfm1"));
    const where = `${slug} ${rel.tag_name}`;
    if (!assets.length) { res.none.push({ c, label, slug, why: `${rel.tag_name} has no .rfm1` }); continue; }
    if (assets.some((a) => digestSha(a) === c.info.sha256)) { res.same.push({ c, label, where, url: rel.html_url }); continue; }
    // the release's .rfm1 for this firmware: by manifest id (a release may carry several)
    let author = null, otherIds = [];
    try {
      for (const a of assets.slice(0, 4)) {
        const buf = fetchAsset(slug, a, join(o.work, "author", slug.replace("/", "__"), `${a.id}-${a.name}`));
        const info = readRfm1(buf);
        if (info.sha256 === c.info.sha256) { author = { asset: a.name, a, buf, info }; break; }
        if (info.manifest.id === m.id) { author = { asset: a.name, a, buf, info }; break; }
        otherIds.push(info.manifest.id);
        author ||= { asset: a.name, a, buf, info, idMismatch: true };
      }
    } catch (e) { res.refused.push({ c, label, where, url: rel.html_url, reasons: [e.message] }); continue; }
    if (author.info.sha256 === c.info.sha256) { res.same.push({ c, label, where, url: rel.html_url }); continue; }
    // its .rfm1 is another firmware in `current` (one repository, several firmwares): not this one's
    if (author.idMismatch && otherIds.every((id) => ids.has(id) && id !== m.id)) { res.none.push({ c, label, slug, why: `${rel.tag_name}'s .rfm1 is ${otherIds.join(", ")}` }); continue; }
    let tagCommit;
    try { tagCommit = ghJson(`repos/${slug}/commits/${encodeURIComponent(rel.tag_name)}`).sha; } catch (e) { res.errors.push({ c, label, why: `the tag ${rel.tag_name}'s commit: ${e.message}` }); continue; }
    const ac = commitOf(author.info.manifest);
    let commitOnGitHub = null;
    if (ac && ac !== tagCommit) {
      try { ghJson(`repos/${slug}/commits/${ac}`); commitOnGitHub = true; } catch (e) { commitOnGitHub = e.status === "422" || e.status === "404" ? false : null; }
    }
    const rl = { slug, tag: rel.tag_name, tagCommit };
    const st = judgeStatic({ cur: c, author, rel: rl, commitOnGitHub, abis, formats });
    const entry = { c, label, where, url: rel.html_url, author };
    if (st.verdict === "same") { res.same.push(entry); continue; }
    if (st.verdict === "held" || st.verdict === "older") { res.none.push({ ...entry, slug, why: st.reasons[0] }); continue; }
    if (st.verdict === "refuse") { res.refused.push({ ...entry, reasons: st.reasons }); continue; }
    // the tools, on the renamed file (the author's bytes) and on the current file with the same options
    const out = join(o.work, "out", st.file);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, author.buf);
    const check = sh(o.python, ["-I", join(o.fm1vst, "tools", "rfm1_check.py"), out]);
    const ra = runArgs[m.id] || [];
    const mi = ra.indexOf("--min-rms"), silentOk = mi >= 0 && Number(ra[mi + 1]) === 0;
    const args = [...ra.filter((_, i) => i !== mi && i !== mi + 1 || mi < 0), "--min-rms", "0"];
    const runAuthor = sh(o.rfm1Run, [...args, out]), runCur = sh(o.rfm1Run, [...args, c.path]);
    const j = judgeRuns({ check: { code: check.code, out: check.out + check.err }, runAuthor: { code: runAuthor.code, out: runAuthor.out + runAuthor.err },
      runCur: { code: runCur.code, out: runCur.out + runCur.err }, silentOk });
    if (!j.ok) { res.refused.push({ ...entry, reasons: j.reasons, notes: st.notes }); continue; }
    const am = author.info.manifest;
    res.taken.push({ ...entry, file: st.file, path: out, sha256: author.info.sha256, was: c.file, run: j.run, curRun: j.curRun,
      name: am.name, version: am.version, builtBy: am.built_by, slug, tag: rel.tag_name, asset: author.asset, notes: st.notes });
  }

  // 3. the report
  const S = [];
  S.push(`## Author .rfm1 sync${o.dryRun ? " (dry run)" : ""}`, "", `\`${ROLLING}\` is ${curName}: ${cur.length} .rfm1 files.`, "");
  S.push(`### Taken (${res.taken.length})`, "");
  for (const t of res.taken) S.push(`- \`${t.file}\` from [${t.where}](${t.url}) (\`${t.asset}\`), replacing \`${t.was}\`: ${t.run.line} (the current file: ${t.curRun ? t.curRun.line : "?"})${t.notes.length ? `. Note: ${t.notes.join("; ")}` : ""}`);
  if (!res.taken.length) S.push("- nothing");
  S.push("", `### Refused (${res.refused.length})`, "");
  for (const r of res.refused) S.push(`- ${r.label}: [${r.where}](${r.url}) \`${r.author?.asset || "?"}\`: ${r.reasons.join("; ")}`);
  if (!res.refused.length) S.push("- nothing");
  S.push("", `### Already the author's file (${res.same.length})`, "");
  for (const s of res.same) S.push(`- ${s.label}: [${s.where}](${s.url})`);
  if (!res.same.length) S.push("- none");
  if (res.errors.length) { S.push("", `### Not checked (${res.errors.length})`, ""); for (const e of res.errors) S.push(`- ${e.label || e.c.file}: ${e.why}`); }
  S.push("", `<details><summary>No author .rfm1 to take (${res.none.length})</summary>`, "");
  for (const n of res.none) S.push(`- ${n.label}${n.slug ? ` (${n.slug})` : ""}: ${n.why}`);
  S.push("", "</details>", "");
  for (const t of res.taken) if (t.notes.length) warn(`taken ${t.file} with a note`, `${t.where} ${t.asset}: ${t.notes.join("; ")}`);
  for (const r of res.refused) warn(`refused ${r.c.file}`, `${r.where} ${r.author?.asset || ""}: ${r.reasons.join("; ")}`);
  for (const e of res.errors) warn(`not checked ${e.c.file}`, e.why);

  // 4. the publish
  if (!o.dryRun && res.taken.length) {
    try { S.push(...publish(o, live, oldSumsText, res.taken, cur.length, say)); }
    catch (e) { S.push("", `**Publish failed:** ${e.message}`); flush(S, say); throw e; }
  } else if (res.taken.length) S.push(`(dry run: nothing uploaded; a run would update \`${ROLLING}\` and make a dated release from ${o.today})`);
  flush(S, say);
  return res;
}

function flush(S, say) {
  const text = S.join("\n") + "\n";
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  say("");
  say(text);
}

function publish(o, live, oldSumsText, taken, total, say) {
  const repo = o.repo, L = [];
  // `current` must be as it was read (another publish in between: next night)
  const now = ghJson(`repos/${repo}/releases/tags/${ROLLING}`);
  const sa = now.assets.find((a) => a.name === "SHA256SUMS"), sa0 = live.assets.find((a) => a.name === "SHA256SUMS");
  if (!sa || digestSha(sa) !== digestSha(sa0) || now.name !== live.name) throw new Error(`${ROLLING} changed while the sync ran: not publishing (the next run takes it from there)`);
  const free = (t) => {
    for (const p of [`repos/${repo}/releases/tags/${t}`, `repos/${repo}/git/ref/tags/${t}`]) {
      try { ghJson(p); return false; } catch (e) { if (e.status !== "404") throw e; }
    }
    return true;
  };
  const tag = nextTag(o.today, (t) => !free(t));
  const dir = join(o.work, "publish", tag);
  mkdirSync(join(dir, "dated"), { recursive: true });
  const files = taken.map((t) => { const p = join(dir, t.file); copyFileSync(t.path, p); if (sha256(readFileSync(p)) !== t.sha256) throw new Error(`${t.file} changed`); return p; });
  const sums = newSums(parseSums(oldSumsText), taken);
  const sumsTxt = sumsText(sums);
  writeFileSync(join(dir, "SHA256SUMS"), sumsTxt);
  writeFileSync(join(dir, "dated", "SHA256SUMS"), sumsText(new Map(taken.map((t) => [t.file, t.sha256]))));
  const notes = releaseNotes(tag, taken, sums.size, live.name || ROLLING);
  writeFileSync(join(dir, "RELEASE-NOTES.md"), notes);
  writeFileSync(join(dir, "CURRENT-NOTES.md"), currentNotes(tag, notes, sums.size));
  const step = (args, t) => { say(`$ gh ${args.join(" ")}`); ghOk(args, t); };
  // as RFM1Manager orders it: the new files, then SHA256SUMS, then the replaced files out
  step(["release", "upload", ROLLING, "--repo", repo, "--clobber", ...files], 30 * 60e3);
  step(["release", "upload", ROLLING, "--repo", repo, "--clobber", join(dir, "SHA256SUMS")]);
  for (const t of taken) if (t.was !== t.file) step(["release", "delete-asset", ROLLING, t.was, "--repo", repo, "--yes"]);
  // check: every asset of `current` against the new SHA256SUMS
  const after = ghJson(`repos/${repo}/releases/tags/${ROLLING}`);
  const p = [];
  const names = new Set(after.assets.map((a) => a.name));
  for (const [n, h] of sums) { const a = after.assets.find((x) => x.name === n); if (!a) p.push(`${n} missing`); else if (digestSha(a) && digestSha(a) !== h) p.push(`${n} digest`); }
  for (const n of names) if (n !== "SHA256SUMS" && !sums.has(n)) p.push(`${n} not in SHA256SUMS`);
  const as = after.assets.find((a) => a.name === "SHA256SUMS");
  if (!as || (digestSha(as) && digestSha(as) !== sha256(sumsTxt))) p.push("SHA256SUMS not the one uploaded");
  if (p.length) throw new Error(`${ROLLING} does not match its SHA256SUMS: ${p.join("; ")}`);
  say(`ok: ${ROLLING} has ${sums.size} .rfm1 files + SHA256SUMS, every one matching`);
  step(["release", "create", tag, "--repo", repo, "--title", tag, "--notes-file", join(dir, "RELEASE-NOTES.md"), "--target", "main", "--latest=false", ...files, join(dir, "dated", "SHA256SUMS")], 30 * 60e3);
  step(["release", "edit", ROLLING, "--repo", repo, "--title", tag, "--notes-file", join(dir, "CURRENT-NOTES.md"), "--latest"]);
  const latest = ghJson(`repos/${repo}/releases/latest`).tag_name;
  if (latest !== ROLLING) throw new Error(`the Latest release is ${latest}, not ${ROLLING}`);
  L.push("", `**Published:** \`${ROLLING}\` updated (${taken.length} file${taken.length === 1 ? "" : "s"}), dated release [${tag}](https://github.com/${repo}/releases/tag/${tag}); \`${ROLLING}\` is Latest.`);
  return L;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(() => process.exit(0), (e) => { process.stderr.write(`author_rfm1_sync: ${e.message}\n`); process.exit(1); });
}
