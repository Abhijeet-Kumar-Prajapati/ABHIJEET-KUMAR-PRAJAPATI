"use strict";
/* =============================================================================
   Static checks for the portfolio site.
   -----------------------------------------------------------------------------
   The site is static, so there is no test runner to lean on. These checks catch
   the mistakes that actually happen when hand-editing four files that reference
   each other by id:

     - app.js asking for an id that index.html does not have, which throws on
       load and silently blanks that section
     - the same id used twice, where only the first match works
     - a content field missing from data.js
     - a download link pointing at a file that was never built
     - a repository name that does not exist on GitHub

   The two bugs that motivated this were paintStats and paintSkills both
   addressing their <section> instead of the grid inside it, which overwrote
   the section heading. Neither showed up as an error - the page just quietly
   lost content.

       node automation/check-site.js
   ========================================================================== */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

let failures = 0;
function check(label, cond, detail) {
  console.log((cond ? "  PASS  " : "  FAIL  ") + label + (detail ? "   " + detail : ""));
  if (!cond) failures++;
}

const read = (rel) => {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
};

console.log("=== files ===");
const html = read("index.html");
const css = read(path.join("assets", "style.css"));
const js = read(path.join("assets", "app.js"));
const data = read(path.join("assets", "data.js"));

check("index.html exists", !!html);
check("assets/style.css exists", !!css);
check("assets/app.js exists", !!js);
check("assets/data.js exists", !!data);

if (!html || !css || !js || !data) {
  console.error("\nmissing source file, stopping");
  process.exit(1);
}

console.log("\n=== encoding ===");
for (const [name, body] of [
  ["index.html", html],
  ["style.css", css],
  ["app.js", js],
  ["data.js", data],
]) {
  const bad = [...body].filter((c) => c === "\uFFFD").length;
  check(name + " has no replacement characters", bad === 0, bad ? bad + " found" : "");
}

console.log("\n=== element ids ===");
const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

/* Ids created at runtime are looked up defensively, so they are allowed to be
   absent from the markup. noHits is created only when a filter matches nothing. */
const DYNAMIC = new Set(["noHits"]);

const used = [...new Set([...js.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map((m) => m[1]))];
const missing = used.filter((id) => !htmlIds.has(id) && !DYNAMIC.has(id));
check("every id app.js queries exists in index.html", missing.length === 0, missing.join(", ") || used.length + " checked");

const dupe = [...htmlIds].filter((id) => (html.match(new RegExp('id="' + id + '"', "g")) || []).length > 1);
check("no duplicate ids in index.html", dupe.length === 0, dupe.join(", ") || htmlIds.size + " unique");

const created = [...js.matchAll(/\.id\s*=\s*"([A-Za-z0-9_-]+)"/g)].map((m) => m[1]);
const collide = created.filter((c) => htmlIds.has(c));
check("ids created at runtime do not clash with markup", collide.length === 0, collide.join(", ") || created.join(", ") || "none");

/* A section and its inner grid must not share a name - that is the exact bug
   that broke the stats and skills sections. */
const sectionIds = new Set([...html.matchAll(/<section[^>]*\bid="([^"]+)"/g)].map((m) => m[1]));
const sectionClash = [...sectionIds].filter((id) => js.indexOf('$("#' + id + '").innerHTML') !== -1);
check("no section is overwritten via innerHTML", sectionClash.length === 0, sectionClash.join(", ") || sectionIds.size + " sections");

console.log("\n=== data ===");
const globals = ["PROFILE", "ROLES", "STATS", "LANGUAGES", "SKILLS", "PROJECTS", "TIMELINE"];
const absent = globals.filter((g) => !new RegExp("const\\s+" + g + "\\s*=").test(data));
check("every global app.js uses is declared", absent.length === 0, absent.join(", ") || globals.length + "/" + globals.length);

const projects = [...data.matchAll(/\n  \{\n    id: "([^"]+)"/g)].map((m) => m[1]);
check("eleven projects declared", projects.length === 11, projects.length + " found");

const repos = [...data.matchAll(/repo: "([^"]+)"/g)].map((m) => m[1]);
check("every project has a repo name", repos.length === projects.length, repos.length + " repos");

const owner = (data.match(/github: "https:\/\/github\.com\/([^"]+)"/) || [])[1];
check("profile owner present", !!owner, owner || "");

/* Repo names must match what GitHub actually reports, capitalisation included. */
if (owner) {
  const expected = [
    "olmavax-A.I", "pylab-studio", "AETHER-STUDIO", "Campus-Nexus",
    "CODELITE-SOFTWARE-PC", "Abhijeet-Work-Hub", "GAME-VALT-PLATFORM",
    "Ionic-ToolKit-", "Web-Media-Player",
    "MULTIPLE-JAVA-PRACTICE-PROGRAMS---ALL-IN-ONE-LAUNCHER",
    "Open-Architecture-Power-Media-Player.--Software-Andriod-Mac-Os",
  ];
  const wrong = repos.filter((r) => expected.indexOf(r) === -1);
  check("all repo names match real GitHub repositories", wrong.length === 0, wrong.join(", ") || "11/11");
}

console.log("\n=== downloads ===");
const links = [...new Set([...html.matchAll(/href="(downloads\/[^"]+)"/g)].map((m) => m[1]))];
check("download links declared", links.length > 0, links.join(", "));
for (const l of links) {
  check("file exists: " + path.basename(l), fs.existsSync(path.join(ROOT, l)));
}

/* The PDFs are generated rather than hand-made, so they are worth validating:
   a broken xref table still downloads fine but refuses to open in some readers. */
console.log("\n=== pdf documents ===");
function readPdf(name) {
  const p = path.join(ROOT, "downloads", name);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p).toString("latin1");
}

const DOCS = [
  ["Abhijeet-Kumar-Prajapati-CV.pdf", 2],
  ["Abhijeet-Kumar-Prajapati-Resume.pdf", 1],
];

for (const [name, wantPages] of DOCS) {
  const t = readPdf(name);
  if (!t) {
    check(name + " exists", false);
    continue;
  }
  check(name + " is a PDF", t.startsWith("%PDF-1.4"));
  check(name + " ends with %%EOF", t.trimEnd().endsWith("%%EOF"));

  const count = Number((t.match(/\/Count (\d+)/) || [])[1]);
  check(name + " page count", count === wantPages, count + " (expected " + wantPages + ")");

  /* Every xref offset must land exactly on its object header. */
  const sx = t.lastIndexOf("startxref");
  const xrefAt = Number(t.slice(sx + 9).trim().split(/\s/)[0]);
  check(name + " startxref points at the table", t.slice(xrefAt, xrefAt + 4) === "xref");

  const entries = [...t.slice(t.indexOf("xref", xrefAt), t.indexOf("trailer")).matchAll(/^(\d{10}) \d{5} n $/gm)];
  let bad = 0;
  entries.forEach((m, i) => {
    const at = Number(m[1]);
    const want = i + 1 + " 0 obj";
    if (t.slice(at, at + want.length) !== want) bad++;
  });
  check(name + " every xref offset resolves", bad === 0, entries.length + " entries, " + bad + " bad");

  const streams = [...t.matchAll(/<< \/Length (\d+) >>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g)];
  const mismatched = streams.filter((m) => m[2].length !== Number(m[1])).length;
  check(name + " stream lengths match", streams.length === wantPages && mismatched === 0,
        streams.length + " streams, " + mismatched + " mismatched");

  const body = streams.map((m) => m[2]).join(" ");
  check(name + " carries the full name",
        body.indexOf("Abhijeet Kumar Prajapati") !== -1);
}

console.log("\n=== external scripts ===");
const cdn = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
check("no CDN or external dependency", cdn.length === 0, cdn.join(", ") || "all local");

console.log("\n=== accessibility ===");
check("skip link present", html.indexOf('class="skip-link"') !== -1);
check("lang attribute set", /<html[^>]+lang="/.test(html));
check("viewport meta present", html.indexOf('name="viewport"') !== -1);
check("reduced-motion styles present", css.indexOf("prefers-reduced-motion") !== -1);
check("print styles present", css.indexOf("@media print") !== -1);
const imgNoAlt = [...html.matchAll(/<img(?![^>]*\balt=)[^>]*>/g)];
check("every img has alt text", imgNoAlt.length === 0, imgNoAlt.length + " missing");

console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
process.exit(failures ? 1 : 0);