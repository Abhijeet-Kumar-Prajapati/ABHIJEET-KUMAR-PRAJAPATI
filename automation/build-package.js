"use strict";
/* Builds the downloadable portfolio ZIP.

   PowerShell's Compress-Archive is used through PowerShell rather than a JS zip
   library, because nothing here is allowed to add a dependency. The staging
   folder is created, zipped, and then removed so the repository stays clean -
   only the finished .zip is committed. */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

/* Resolved from this file's own location, not hard-coded, so the script keeps
   working wherever the repository is checked out. */
const ROOT = path.resolve(__dirname, "..");
const FOLDER = "Abhijeet-Kumar-Prajapati-Portfolio";
const STAGE = path.join(ROOT, "downloads", "_stage", FOLDER);
const ZIP = path.join(ROOT, "downloads", FOLDER + ".zip");

/* What ships in the package. Keep this list explicit rather than globbing, so a
   stray build artefact can never end up in a download. */
const FILES = [
  ["index.html", "index.html"],
  ["serve.js", "serve.js"],
  ["package.json", "package.json"],
  ["assets\\style.css", "assets/style.css"],
  ["assets\\app.js", "assets/app.js"],
  ["assets\\data.js", "assets/data.js"],
  ["assets\\banner.jpg", "assets/banner.jpg"],
  ["downloads\\Abhijeet-Kumar-Prajapati-CV.pdf", "downloads/Abhijeet-Kumar-Prajapati-CV.pdf"],
  ["downloads\\Abhijeet-Kumar-Prajapati-Resume.pdf", "downloads/Abhijeet-Kumar-Prajapati-Resume.pdf"],
  ["downloads\\package-README.md", "README.md"],
  ["automation\\build-docs.js", "automation/build-docs.js"],
];

const stageRoot = path.join(ROOT, "downloads", "_stage");
fs.rmSync(stageRoot, { recursive: true, force: true });

const missing = [];
for (const [src, dest] of FILES) {
  const from = path.join(ROOT, src);
  if (!fs.existsSync(from)) {
    missing.push(src);
    continue;
  }
  const to = path.join(STAGE, dest);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

if (missing.length) {
  console.error("missing files:\n  " + missing.join("\n  "));
  process.exit(1);
}

fs.rmSync(ZIP, { force: true });
execFileSync(
  "powershell",
  [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${STAGE}' -DestinationPath '${ZIP}' -CompressionLevel Optimal -Force`,
  ],
  { stdio: "inherit" }
);

fs.rmSync(stageRoot, { recursive: true, force: true });

/* Read the zip back to confirm the archive is real and complete.

   End-of-central-directory layout: signature at 0, total entries at 10, size of
   the central directory at 12, and its offset at 16. The per-entry records live
   at that offset, not immediately after the header. */
const buf = fs.readFileSync(ZIP);
const sig = buf.readUInt32LE(0);
if (sig !== 0x04034b50) {
  console.error("not a zip file");
  process.exit(1);
}

const names = [];
const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (eocd < 0) {
  console.error("no end-of-central-directory record");
  process.exit(1);
}

const total = buf.readUInt16LE(eocd + 10);
let cursor = buf.readUInt32LE(eocd + 16);

for (let i = 0; i < total; i++) {
  if (buf.readUInt32LE(cursor) !== 0x02014b50) {
    console.error("bad central directory signature at entry " + i);
    process.exit(1);
  }
  const nameLen = buf.readUInt16LE(cursor + 28);
  const extraLen = buf.readUInt16LE(cursor + 30);
  const commentLen = buf.readUInt16LE(cursor + 32);
  names.push(buf.slice(cursor + 46, cursor + 46 + nameLen).toString("utf8").replace(/\\/g, "/"));
  cursor += 46 + nameLen + extraLen + commentLen;
}

console.log("zip written : " + ZIP);
console.log("entries     : " + total);
console.log("size        : " + (buf.length / 1024).toFixed(1) + " KB");
console.log("contents    :");
names.filter((n) => n.indexOf("/") !== -1).forEach((n) => console.log("   " + n));
console.log("staging removed, repo stays clean");