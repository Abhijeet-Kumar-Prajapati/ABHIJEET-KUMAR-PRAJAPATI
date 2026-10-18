"use strict";
/* =============================================================================
   Local preview server for the portfolio site.
   -----------------------------------------------------------------------------
   The site is plain static files, so this does one job: serve them over
   http://127.0.0.1:<port> so you can develop against a real origin instead of
   opening index.html over file://.

   Why bother, when file:// works? Two reasons. The clipboard API is only
   available on a secure origin, so "Copy address" falls back to a deprecated
   path on file://. And a real origin is what GitHub Pages will serve, so
   testing here matches production.

   No dependencies - Node's built-in http and fs modules only.

       node serve.js               # http://127.0.0.1:8123
       node serve.js 9000          # pick a port
       node serve.js --open        # also print the LAN address
   ========================================================================== */

const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = __dirname;
const args = process.argv.slice(2);
const portArg = args.find((a) => /^\d+$/.test(a));
const PORT = Number(portArg) || Number(process.env.PORT) || 8123;
const showLan = args.includes("--open") || args.includes("--lan");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css.map": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain" }).end("bad request");
    return;
  }

  if (pathname.endsWith("/")) pathname += "index.html";

  /* Resolve inside ROOT and verify. Guards against ../ traversal. */
  const target = path.resolve(ROOT, "." + pathname);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain" }).end("403 forbidden");
    console.log("  403  " + pathname);
    return;
  }

  fs.stat(target, (err, stat) => {
    if (err || stat.isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        "<!doctype html><meta charset=utf-8>" +
          "<body style='font:16px system-ui;padding:40px;background:#07070c;color:#f2f3f8'>" +
          "<h1 style='font-size:20px'>404 &mdash; " + escapeHtml(pathname) + "</h1>" +
          "<p style='color:#8b8fa8'>That file is not in this repository.</p>" +
          "<p><a style='color:#6d5efc' href='/'>&larr; back to the portfolio</a></p>"
      );
      console.log("  404  " + pathname);
      return;
    }

    const type = TYPES[path.extname(target).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
      /* No caching, so a reload always shows the file you just edited. */
      "Cache-Control": "no-store, must-revalidate",
    });

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    const stream = fs.createReadStream(target);
    stream.pipe(res);
    stream.on("error", () => res.destroy());
    console.log("  200  " + pathname);
  });
});

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function lanAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return null;
}

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error("port " + PORT + " is already in use.");
    console.error("try another:  node serve.js " + (PORT + 1));
  } else {
    console.error(e.message);
  }
  process.exit(1);
});

server.listen(PORT, "127.0.0.1", () => {
  const line = "  ".padEnd(30, "-");
  console.log("");
  console.log("  Abhijeet Kumar Prajapati - local preview");
  console.log("  " + line);
  console.log("  local    http://127.0.0.1:" + PORT + "/");
  if (showLan) {
    const lan = lanAddress();
    console.log("  network  " + (lan ? "http://" + lan + ":" + PORT + "/" : "no LAN address found"));
  }
  console.log("  serving  " + ROOT);
  console.log("");
  console.log("  Ctrl+C to stop.");
  console.log("");
});