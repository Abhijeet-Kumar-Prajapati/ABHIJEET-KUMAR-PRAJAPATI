"use strict";
/* =============================================================================
   Generates the two PDF documents offered on the site:
       Abhijeet-Kumar-Prajapati-CV.pdf       two pages, every project in full
       Abhijeet-Kumar-Prajapati-Resume.pdf   one page, the short version

   There is no PDF library available and no network access at build time, so
   this writes the files directly: PDF 1.4 with the standard Type1 Helvetica
   fonts, which every reader already has. WinAnsiEncoding is used, and anything
   outside it is transliterated first, because Type1 base fonts cannot encode
   arbitrary Unicode.

   Layout is in PostScript points. A4 is 595.28 x 841.89.
   ========================================================================== */

const fs = require("fs");
const path = require("path");

/* ---------- Page geometry (A4, in points) --------------------------------- */
const PW = 595.28;
const PH = 841.89;
const M = 46;
const CONTENT_W = PW - M * 2;

/* ---------- Palette (RGB 0-1) -------------------------------------------- */
const INK = [0.09, 0.10, 0.17];
const MUTED = [0.42, 0.45, 0.56];
const RULE = [0.82, 0.84, 0.88];
const BRAND = [0.43, 0.37, 0.99];
const ACCENT = [0.13, 0.83, 0.93];
const BAND = [0.96, 0.97, 0.99];

/* ---------- Helvetica metrics -------------------------------------------- */
/* Advance widths per 1000 units. Only the ranges the documents actually use. */
const W_REG = { " ": 278, "!": 278, '"': 355, "#": 556, "$": 556, "%": 889, "&": 667,
  "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278,
  ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556, "@": 1015, "[": 278,
  "]": 278, "^": 469, "_": 556, "{": 334, "|": 260, "}": 334, "~": 584 };
const W_BOLD = { " ": 278, "!": 333, '"': 474, "#": 556, "$": 556, "%": 889, "&": 722,
  "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278,
  ":": 333, ";": 333, "<": 584, "=": 584, ">": 584, "?": 611, "@": 975, "[": 333,
  "]": 333, "^": 584, "_": 556, "{": 389, "|": 280, "}": 389, "~": 584 };

function charWidth(ch, bold) {
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return bold ? 722 : 667;
  if (code >= 97 && code <= 122) return 556;
  if (code >= 48 && code <= 57) return 556;
  const table = bold ? W_BOLD : W_REG;
  return table[ch] !== undefined ? table[ch] : 556;
}

function textWidth(s, size, bold) {
  let w = 0;
  for (const ch of s) w += charWidth(ch, bold);
  return (w / 1000) * size;
}

/* WinAnsi covers Latin-1. A few characters that appear need transliterating. */
function toWinAnsi(s) {
  return String(s)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u00B7\u2022]/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E]/g, "");
}

function esc(s) {
  return toWinAnsi(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(s, size, bold, maxW) {
  const words = toWinAnsi(s).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? line + " " + w : w;
    if (textWidth(candidate, size, bold) <= maxW || !line) line = candidate;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ---------- Content stream builder --------------------------------------- */

class Page {
  constructor() {
    this.ops = [];
    this.y = PH - M;
  }

  color(c) {
    this.ops.push(`${c[0].toFixed(3)} ${c[1].toFixed(3)} ${c[2].toFixed(3)} rg`);
    return this;
  }
  strokeColor(c) {
    this.ops.push(`${c[0].toFixed(3)} ${c[1].toFixed(3)} ${c[2].toFixed(3)} RG`);
    return this;
  }

  text(s, x, y, size, bold, col) {
    if (col) this.color(col);
    this.ops.push(
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${esc(s)}) Tj ET`
    );
    return this;
  }

  textRight(s, xRight, y, size, bold, col) {
    return this.text(s, xRight - textWidth(s, size, bold), y, size, bold, col);
  }

  line(x1, y, x2, col, width) {
    this.strokeColor(col);
    this.ops.push(
      `${width || 0.7} w ${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S`
    );
    return this;
  }

  rect(x, y, w, h, col) {
    this.color(col);
    this.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    return this;
  }

  toStream() {
    return this.ops.join("\n");
  }
}

/* ---------- Serialiser ---------------------------------------------------- */

function serialise(pages) {
  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length; // 1-based
  };

  const catalogId = add(null);
  const pagesId = add(null);
  const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  const contentIds = pages.map((p) => {
    const stream = p.toStream();
    return add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
  });

  const pageIds = pages.map((p, i) =>
    add(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PW} ${PH}] ` +
        `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> ` +
        `/Contents ${contentIds[i]} 0 R >>`
    )
  );

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefPos = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    out += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
  out += `startxref\n${xrefPos}\n%%EOF\n`;

  return Buffer.from(out, "latin1");
}

/* ---------- Content ------------------------------------------------------- */

const NAME = "Abhijeet Kumar Prajapati";
const CONTACT = [
  "abhijeet943935@gmail.com",
  "github.com/Abhijeet-Kumar-Prajapati",
  "Katras, Jharkhand, India",
].join("   |   ");
const SITE = "abhijeet-kumar-prajapati.github.io/ABHIJEET-KUMAR-PRAJAPATI";

const PROFILE_TEXT =
  "Software developer and B.Tech Information Technology student graduating in 2026. " +
  "I build complete, runnable applications - offline-first desktop and web software that " +
  "works without an account, a cloud service or an API key. Eleven public projects, most " +
  "with zero external dependencies and no build step. Comfortable across Python, " +
  "JavaScript and Java, with hands-on experience in WebGL, Windows scripting and " +
  "cross-platform desktop packaging.";

const SHORT_SUMMARY =
  "B.Tech IT student graduating 2026, building complete offline-first applications in " +
  "Python, JavaScript and Java. Eleven shipped public projects, most with zero external " +
  "dependencies and no build step.";

const EDUCATION = [
  {
    school: "Vinoba Bhave University (VBU), Hazaribagh",
    degree: "Bachelor of Technology - Information Technology",
    when: "2022 - 2026",
    extra: "CGPA 6.3 / 63%  |  Hazaribagh, Jharkhand",
  },
];

const SKILLS = [
  ["Languages", "Python (90), JavaScript (88), Java (72), PowerShell (70)"],
  ["Frontend", "HTML (92), CSS (85), WebGL / Three.js (70)"],
  ["Currently learning", "C, C++, SQL"],
  ["Tools", "Git and GitHub (85), VS Code (90), Windows (88)"],
];

const STATS = [
  ["11", "projects shipped"],
  ["5.6 MB", "code published"],
  ["320+", "tests passing"],
  ["0", "dependencies"],
];

const PROJECTS = [
  ["Olmavax A.I", "Local-first multi-agent AI workspace", "Python 57, JavaScript 30, CSS 9, HTML 3",
   "Nine agents, 19 local plugins, 22-language syntax highlighting, voice input, PDF export, a from-scratch QR encoder and an optional 27-module Python sidecar. Zero npm dependencies; works with no API key."],
  ["PyLab Studio", "132 Python programs in one project", "Python 70, JavaScript 13, HTML 12, CSS 5",
   "132 programs across 9 categories, each runnable from a console menu, a local website or a live web demo."],
  ["AETHER STUDIO", "Procedural 3D and 4D animation", "JavaScript 76, HTML 12, CSS 12",
   "A WebGL studio combining keyframed 4D animation and rigid-body physics on one render loop. All geometry, skinning and motion generated at runtime - no models, textures or build step."],
  ["Campus Nexus", "Library, store and arcade in one app", "JavaScript 82, HTML 10, CSS 8",
   "Four separate student projects merged into a single application sharing one login, with a dashboard and a role-based security centre."],
  ["CodeLite", "Offline code editor for Windows", "JavaScript 55, HTML 23, CSS 9, PowerShell 8",
   "A fully offline code editor with an installer. No telemetry, no accounts, no tracking."],
  ["Java Practice Programs", "40 Java programs with automated CI", "Java 50, HTML 28, PowerShell 22",
   "DSA and OOP programs covering sorting, graph traversal, Dijkstra, Kruskal, Huffman, inheritance and exception handling. CI compiles and runs all 40 on every push."],
  ["APM Open Player", "One player, every format, every platform", "JavaScript 68, Java 13, HTML 11, CSS 5",
   "A universal media player for Windows, macOS and Android, combining the strengths of VLC, MX Player and KM Player."],
  ["Work Hub", "Every project in one dashboard", "HTML 29, Python 28, JavaScript 23, CSS 19",
   "Scans and launches every project on the machine from a single local-only dashboard."],
  ["GameVault", "Mobile gaming platform", "JavaScript 54, HTML 35, CSS 11",
   "Discover games, join tournaments with prize money, climb the leaderboard. No build step, no framework."],
  ["Ionic ToolKit", "All-in-one student toolkit, a PWA", "HTML 100",
   "Eight tools - scientific calculator, library, Snake, DSA visualizer, matrix operations, coding platform, AI chat, in-app browser - each in a basic and an advanced version."],
  ["Web Media Player", "Responsive single-file media player", "HTML 100",
   "Playlist controls, playback speed, brightness, keyboard shortcuts and fullscreen, with zero dependencies."],
];

/* The four strongest projects, for the one-page resume. */
const RESUME_PROJECTS = [PROJECTS[0], PROJECTS[2], PROJECTS[1], PROJECTS[3]];

/* ---------- Shared layout helpers ---------------------------------------- */

/* The current page lives in a layout object rather than being passed around by
   return value. A page break replaces L.page, so every drawing call has to go
   through it. Returning a new page and ignoring the result - which is what the
   first version did - keeps drawing onto the discarded page; that is what turned
   a two-page CV into nine. */
function newLayout() {
  return { pages: [], page: new Page() };
}

function need(L, space) {
  if (L.page.y - space < M) {
    L.pages.push(L.page);
    L.page = new Page();
  }
  return L.page;
}

function sectionTitle(L, label) {
  const p = need(L, 46);
  p.y -= 12;
  p.text(label.toUpperCase(), M, p.y, 9.5, true, BRAND);
  p.y -= 6;
  p.line(M, p.y, PW - M, RULE, 0.8);
  p.y -= 15;
}

function body(L, s, size, col, indent, lead) {
  const sz = size || 9.4;
  const ld = lead || 12.4;
  for (const ln of wrap(s, sz, false, CONTENT_W - (indent || 0))) {
    const p = need(L, ld);
    p.text(ln, M + (indent || 0), p.y, sz, false, col || MUTED);
    p.y -= ld;
  }
}

function header(p, role) {
  p.rect(0, PH - 132, PW, 132, BAND);
  p.rect(0, PH - 132, PW, 2.6, BRAND);
  p.text(NAME, M, PH - 62, 22, true, INK);
  p.text(role, M, PH - 84, 10.5, false, MUTED);
  p.text(CONTACT, M, PH - 106, 8.6, false, BRAND);
  p.y = PH - 132 - 30;
}

function statStrip(L) {
  const boxW = (CONTENT_W - 3 * 8) / 4;
  const p = need(L, 60);
  STATS.forEach(([big, small], i) => {
    const x = M + i * (boxW + 8);
    p.rect(x, p.y - 44, boxW, 50, BAND);
    const bx = x + boxW / 2;
    p.text(big, bx - textWidth(big, 16, true) / 2, p.y - 18, 16, true, BRAND);
    p.text(small, bx - textWidth(small, 7.8, false) / 2, p.y - 32, 7.8, false, MUTED);
  });
  p.y -= 44;
}

/* ---------- CV: two pages ------------------------------------------------- */

function buildCv() {
  const L = newLayout();
  let p = L.page;

  header(p, "Software Developer  |  B.Tech Information Technology (2026)");

  sectionTitle(L, "Profile");
  body(L, PROFILE_TEXT);

  sectionTitle(L, "Education");
  for (const e of EDUCATION) {
    p = need(L, 58);
    p.text(e.degree, M, p.y, 10.6, true, INK);
    p.textRight(e.when, PW - M, p.y, 9.4, false, MUTED);
    p.y -= 14;
    p.text(e.school, M, p.y, 9.4, false, MUTED);
    p.y -= 13;
    p.text(e.extra, M, p.y, 8.8, false, MUTED);
    p.y -= 20;
  }

  sectionTitle(L, "Skills");
  for (const [group, list] of SKILLS) {
    const lines = wrap(list, 9.3, false, CONTENT_W - 112);
    p = need(L, lines.length * 12.2 + 6);
    p.text(group, M, p.y, 9.3, true, INK);
    lines.forEach((ln, i) => p.text(ln, M + 112, p.y - i * 12.2, 9.3, false, MUTED));
    p.y -= lines.length * 12.2 + 6;
  }
  L.page.y -= 6;

  sectionTitle(L, "At a glance");
  statStrip(L);

  sectionTitle(L, "Selected and shipped projects");
  p = L.page;
  p.text(
    "Language composition is measured from the source code via the GitHub languages API, not estimated.",
    M, p.y, 8.4, false, MUTED
  );
  p.y -= 20;

  for (const [name, tagline, stack, desc] of PROJECTS) {
    const lines = wrap(desc, 8.9, false, CONTENT_W);
    p = need(L, 13 + 25 + lines.length * 11.6 + 9);

    p.y -= 4;
    p.text(name, M, p.y, 10.2, true, INK);
    p.textRight(stack, PW - M, p.y, 8.2, false, BRAND);
    p.y -= 12.5;
    p.text(tagline, M, p.y, 8.8, false, ACCENT);
    p.y -= 12.5;
    for (const ln of lines) {
      p.text(ln, M, p.y, 8.9, false, MUTED);
      p.y -= 11.6;
    }
    p.y -= 5;
    p.line(M, p.y, PW - M, RULE, 0.5);
    p.y -= 4;
  }

  p = L.page;
  p.y -= 6;
  p.line(M, p.y, PW - M, RULE, 0.8);
  p.y -= 14;
  p.text(
    "Generated from " + SITE + "  -  every project is public and cloneable.",
    M, p.y, 8, false, MUTED
  );

  L.pages.push(L.page);
  return serialise(L.pages);
}

/* ---------- Resume: one page ---------------------------------------------- */

function buildResume() {
  const L = newLayout();
  let p = L.page;

  header(p, "Software Developer  |  B.Tech Information Technology (2026)");

  sectionTitle(L, "Summary");
  body(L, SHORT_SUMMARY, 9.4);

  sectionTitle(L, "Education");
  const e = EDUCATION[0];
  p = L.page;
  p.text(e.degree, M, p.y, 10.2, true, INK);
  p.textRight(e.when, PW - M, p.y, 9.2, false, MUTED);
  p.y -= 13.5;
  p.text(e.school + "  |  " + e.extra, M, p.y, 9, false, MUTED);
  p.y -= 20;

  sectionTitle(L, "Skills");
  for (const [group, list] of SKILLS) {
    const lines = wrap(list, 9.2, false, CONTENT_W - 104);
    p = need(L, lines.length * 12 + 4);
    p.text(group, M, p.y, 9.2, true, INK);
    lines.forEach((ln, i) => p.text(ln, M + 104, p.y - i * 12, 9.2, false, MUTED));
    p.y -= lines.length * 12 + 4;
  }
  L.page.y -= 6;

  sectionTitle(L, "Featured projects");
  for (const [name, tagline, stack, desc] of RESUME_PROJECTS) {
    const lines = wrap(desc, 8.9, false, CONTENT_W);
    p = need(L, 12 + 24 + lines.length * 11.4 + 7);
    p.y -= 3;
    p.text(name, M, p.y, 10, true, INK);
    p.textRight(stack, PW - M, p.y, 8, false, BRAND);
    p.y -= 12;
    p.text(tagline, M, p.y, 8.6, false, ACCENT);
    p.y -= 12;
    for (const ln of lines) {
      p.text(ln, M, p.y, 8.9, false, MUTED);
      p.y -= 11.4;
    }
    p.y -= 3;
  }

  L.page.y -= 4;
  statStrip(L);

  p = L.page;
  p.y -= 12;
  p.line(M, p.y, PW - M, RULE, 0.8);
  p.y -= 13;
  p.text(
    "All eleven projects: " + SITE + "  |  Every repository is public and cloneable.",
    M, p.y, 8, false, MUTED
  );

  L.pages.push(L.page);
  return serialise(L.pages);
}

/* ---------- Write --------------------------------------------------------- */

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "downloads");
fs.mkdirSync(OUT, { recursive: true });

const docs = [
  ["Abhijeet-Kumar-Prajapati-CV.pdf", buildCv()],
  ["Abhijeet-Kumar-Prajapati-Resume.pdf", buildResume()],
];

for (const [name, buf] of docs) {
  const dest = path.join(OUT, name);
  fs.writeFileSync(dest, buf);
  const pages = (buf.toString("latin1").match(/\/Type \/Page[^s]/g) || []).length;
  console.log(
    name.padEnd(38) +
      (buf.length / 1024).toFixed(1).padStart(7) + " KB   " +
      pages + " page" + (pages === 1 ? "" : "s")
  );
}

console.log("\nwritten to " + OUT);