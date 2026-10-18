# Abhijeet Kumar Prajapati — Portfolio Source

The complete source of the portfolio website.

**Zero dependencies. No build step. No package manager.** Open `index.html` in any
modern browser and it runs — including offline, because there is no CDN and nothing
is fetched at runtime.

---

## Contents

```
index.html                            page structure
serve.js                              local preview server
package.json                          scripts only — zero dependencies
assets/
  style.css                           design tokens, layout, animations, print styles
  app.js                              rendering, animation, filtering, command palette
  data.js                             all content: profile, 11 projects, skills
  banner.jpg                          the banner graphic used by the profile
downloads/
  Abhijeet-Kumar-Prajapati-CV.pdf      the curriculum vitae, generated from this site
automation/
  build-cv.js                          regenerates the CV PDF
README.md                             this file
```

> Want everything, including the full automation and the docs? Take the
> **Complete package** instead — this site plus `serve.js`, all three build
> scripts, `check-site.js` and the documentation.

## Running it

The quickest way, with Node 18 or newer:

```bash
npm run dev
```

That starts `serve.js` and prints the address, usually `http://127.0.0.1:8123`.
There is **no `npm install` step** — this project has no dependencies, so there is
nothing to download.

Or run the server directly:

```bash
node serve.js          # http://127.0.0.1:8123
node serve.js 9000     # choose a different port
```

### Do I even need a server?

Opening `index.html` directly works. The server exists for two reasons: the
clipboard API is only available on a secure origin, so "Copy address" falls back to
a deprecated path on `file://`; and a real origin is what GitHub Pages serves, so
testing locally matches production.

## Scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Start the preview server and show the LAN address |
| `npm start` | Same, without the LAN address |
| `npm run cv` | Regenerate `Abhijeet-Kumar-Prajapati-CV.pdf` |
| `npm run package` | Regenerate this archive |
| `npm run full` | Regenerate the complete-package archive |
| `npm run build` | All three downloads, in order |

## Features, and where they live

| Feature | Where |
| :--- | :--- |
| Light and dark theme, remembered between visits | `app.js` → `initTheme()` |
| Command palette — <kbd>Ctrl</kbd>+<kbd>K</kbd> | `app.js` → `initPalette()` |
| Project filtering by technology | `app.js` → `paintProjects()` |
| Scroll-triggered reveal and counters | `app.js` → `initReveal()`, `initCounters()` |
| Card tilt that follows the cursor | `app.js` → `initTilt()` |
| Scroll progress bar and section highlighting | `app.js` → `initNav()` |
| Mobile drawer navigation | `app.js` → `initDrawer()` |

## Editing the content

Everything the page displays comes from `assets/data.js`. You should not need to
touch the HTML at all to change the site.

```js
const PROJECTS = [
  {
    name: "Olmavax A.I",
    repo: "olmavax-A.I",              // the GitHub repository name
    tagline: "Local-first multi-agent AI workspace",
    blurb: "One or two sentences shown on the card.",
    stack: [                          // measured language share, highest first
      { lang: "Python", pct: 57 },
      { lang: "JavaScript", pct: 30 },
    ],
    tags: ["Python", "JavaScript"],   // drives the filter chips
    kb: 907,
    featured: true,                   // reserved for future layout variants
    live: "https://…",                // optional; adds a "Live demo" button
    year: "2026",
  },
];
```

Changing the `stack` percentages changes the bars on the card, the filter list,
and the language donut, because they are all derived from the same array.

## Regenerating the CV

```bash
node automation/build-cv.js
```

`build-cv.js` writes the PDF directly — no PDF library, no network. It uses the
standard Type1 Helvetica fonts, so the file is roughly 11 KB and opens anywhere.

---

## Browser support

Current versions of Chrome, Edge, Firefox and Safari. The layout is mobile-first
and degrades gracefully: without `IntersectionObserver` the content is simply
visible instead of animating, and `prefers-reduced-motion` disables the drifting
background, the counters and every transition.

## Licence

Written by Abhijeet Kumar Prajapati. Reuse it, adapt it, learn from it.