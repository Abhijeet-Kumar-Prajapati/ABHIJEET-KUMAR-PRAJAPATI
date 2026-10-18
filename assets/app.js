/* =============================================================================
   Portfolio behaviour
   -----------------------------------------------------------------------------
   Vanilla JS, no dependencies, no build step. Every section is rendered from
   assets/data.js at load time, then wired up.

   Progressive enhancement is deliberate: if IntersectionObserver is missing,
   content still renders and is simply visible without the reveal animation.
   ========================================================================== */

(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Colour per language, used by the donut and the per-project stack bars. */
  const LANG_COLOR = {
    JavaScript: "#f7df1e",
    HTML: "#e34f26",
    Python: "#3776ab",
    CSS: "#1572b6",
    Java: "#007396",
    PowerShell: "#5391fe",
    Batchfile: "#6b7b8d",
    "Inno Setup": "#7b68ee",
    NSIS: "#4a90d9",
    Shell: "#89e051",
  };
  const colorFor = (lang) => LANG_COLOR[lang] || "#6d5efc";

  const ICONS = {
    github:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.3 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg>',
    external:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>',
    mail:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
    code:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>',
    location:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    sun:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>',
    moon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    menu:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  };

  const repoUrl = (p) => `${PROFILE.github}/${p.repo}`;

  /* ---------- Theme --------------------------------------------------------- */

  function initTheme() {
    const saved = localStorage.getItem("akp-theme");
    const initial =
      saved ||
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.dataset.theme = initial;

    const btn = $("#themeBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("akp-theme", next);
      btn.setAttribute("aria-label", next === "light" ? "Switch to dark theme" : "Switch to light theme");
    });
  }

  /* ---------- Static markup ------------------------------------------------ */

  function paintStatic() {
    $("#year").textContent = new Date().getFullYear();
    $("#mailLink").href = "mailto:" + PROFILE.email;
    $("#mailText").textContent = PROFILE.email;

    /* Rotating role in the hero. */
    const slot = $("#roleSlot");
    if (slot) {
      let i = 0;
      const show = () => {
        const el = document.createElement("span");
        el.className = "role-item in";
        el.textContent = ROLES[i % ROLES.length];
        slot.replaceChildren(el);
        i++;
      };
      show();
      if (!reduceMotion) setInterval(show, 2600);
    }

    /* Contact card + socials. */
    const socials = $("#socials");
    if (socials) {
      socials.innerHTML = [
        { href: PROFILE.github, icon: ICONS.github, label: "GitHub" },
        { href: "mailto:" + PROFILE.email, icon: ICONS.mail, label: "Email" },
        {
          href: PROFILE.github + "/Abhijeet-Kumar-Prajapati/discussions",
          icon: ICONS.external,
          label: "Discussions",
        },
      ]
        .map(
          (s) =>
            `<a href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${s.label}">${s.icon}</a>`
        )
        .join("");
    }
  }

  /* ---------- Stats --------------------------------------------------------- */

  function paintStats() {
    /* #stats-grid, not #stats - the section itself already owns the id
       "stats", so querySelector would otherwise return the wrong node. */
    $("#stats-grid").innerHTML = STATS.map(
      (s) => `
      <div class="stat rv">
        <div class="num" data-to="${s.value}">0${s.suffix}</div>
        <div class="lbl">${s.label}</div>
        <div class="note">${s.note}</div>
      </div>`
    ).join("");
  }

  /* ---------- About + donut ------------------------------------------------ */

  function paintAbout() {
    $("#facts").innerHTML = [
      ["Degree", PROFILE.degree],
      ["University", PROFILE.university],
      ["Graduating", PROFILE.graduation + " · " + PROFILE.cgpa],
      ["Location", PROFILE.location],
      ["Focus", "Offline-first desktop and web apps"],
      ["Status", "Open to internships and junior roles"],
    ]
      .map(([k, v]) => `<div class="fact"><span class="k">${k}</span><span class="v">${v}</span></div>`)
      .join("");

    /* Conic-gradient donut. Stops are cumulative across the language list. */
    let acc = 0;
    const stops = LANGUAGES.map((l) => {
      const from = acc;
      acc += l.pct;
      return `${colorFor(l.name)} ${from}% ${acc}%`;
    });

    const donut = $("#donut");
    if (donut) {
      donut.style.background = `conic-gradient(${stops.join(",")})`;
      $("#donutTotal").textContent = String(LANGUAGES.length);
    }

    $("#legend").innerHTML = LANGUAGES.map(
      (l) => `
      <div>
        <i style="background:${colorFor(l.name)}"></i>
        <span>${l.name}</span>
        <span class="pct">${l.pct}%</span>
      </div>`
    ).join("");
  }

  /* ---------- Skills -------------------------------------------------------- */

  function paintSkills() {
    /* #skills-grid, not #skills - same id collision as the stats section. */
    $("#skills-grid").innerHTML = SKILLS.map(
      (g) => `
      <div class="skill-card rv">
        <h3>${g.group}</h3>
        ${g.items
          .map(
            (s) => `
          <div class="skill">
            <div class="skill-top">
              <span class="nm">${s.name}</span>
              <span class="pc">${s.level}%</span>
            </div>
            <div class="bar"><span data-w="${s.level}"></span></div>
            <div class="skill-note">${s.note}</div>
          </div>`
          )
          .join("")}
      </div>`
    ).join("");
  }

  /* ---------- Projects ------------------------------------------------------ */

  function projectCard(p) {
    const stack = p.stack
      .map(
        (s) => `
      <div class="stack-row">
        <span class="nm">${s.lang}</span>
        <span class="tr"><span data-w="${s.pct}" style="background:${colorFor(s.lang)}"></span></span>
        <span class="pv">${s.pct}%</span>
      </div>`
      )
      .join("");

    const highlights = p.highlights
      ? `<ul class="tags">${p.highlights.map((h) => `<li class="tag">${h}</li>`).join("")}</ul>`
      : "";

    const links = [`<a href="${repoUrl(p)}" target="_blank" rel="noopener noreferrer">${ICONS.code}Code</a>`];
    if (p.live) {
      links.push(
        `<a href="${p.live}" target="_blank" rel="noopener noreferrer">${ICONS.external}Live demo</a>`
      );
    }
    links.push(`<a href="${repoUrl(p)}#readme" target="_blank" rel="noopener noreferrer">${ICONS.github}Repo</a>`);

    return `
    <article class="card rv" data-tags="${p.tags.join("|")}">
      <div class="card-top">
        <span class="card-icon">${ICONS.code}</span>
        <span class="year">${p.year}</span>
      </div>
      <h3>${p.name}</h3>
      <div class="tag-line">${p.tagline}</div>
      <p class="blurb">${p.blurb}</p>
      <div class="stack">${stack}</div>
      ${highlights}
      <div class="card-links">${links.join("")}</div>
    </article>`;
  }

  function paintProjects() {
    $("#grid").innerHTML = PROJECTS.map(projectCard).join("");

    /* Filter chips, built from whichever languages actually occur. */
    const all = [];
    PROJECTS.forEach((p) => p.tags.forEach((t) => all.indexOf(t) === -1 && all.push(t)));
    const sorted = all.sort((a, b) => {
      const ca = PROJECTS.filter((p) => p.tags.indexOf(a) !== -1).length;
      const cb = PROJECTS.filter((p) => p.tags.indexOf(b) !== -1).length;
      return cb - ca || a.localeCompare(b);
    });

    const filters = ["All"].concat(sorted);
    $("#filters").innerHTML = filters
      .map((f, i) => `<button class="filter${i === 0 ? " on" : ""}" data-f="${f}">${f}</button>`)
      .join("");

    $("#filters").addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (!btn) return;
      const want = btn.dataset.f;

      $$("#filters .filter").forEach((b) => b.classList.toggle("on", b === btn));

      const cards = $$("#grid .card");
      let shown = 0;
      cards.forEach((c) => {
        const hit = want === "All" || c.dataset.tags.split("|").indexOf(want) !== -1;
        c.classList.toggle("hidden", !hit);
        if (hit) shown++;
      });

      let empty = $("#noHits");
      if (shown === 0 && !empty) {
        empty = document.createElement("p");
        empty.id = "noHits";
        empty.className = "no-hits";
        empty.textContent = "No project uses " + want + " yet.";
        $("#grid").append(empty);
      } else if (shown !== 0 && empty) {
        empty.remove();
      }
    });
  }

  /* ---------- Timeline ------------------------------------------------------ */

  function paintTimeline() {
    $("#timeline").innerHTML = TIMELINE.map(
      (t) => `
      <div class="tl-item rv">
        <div class="tl-when">${t.when}</div>
        <h3>${t.what}</h3>
        <p>${t.detail}</p>
      </div>`
    ).join("");
  }

  /* ---------- Marquee ------------------------------------------------------- */

  function paintMarquee() {
    const words = PROJECTS.map((p) => p.name).concat(["Python", "JavaScript", "Java", "HTML", "CSS", "WebGL"]);
    const half = words.map((w) => `<span>${w}</span>`).join("");
    $("#marquee").innerHTML = `<div class="marquee-track">${half}${half}</div>`;
  }

  /* ---------- Reveal on scroll ---------------------------------------------- */

  function initReveal() {
    const items = $$(".rv");
    if (!("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          /* Stagger siblings so a row cascades rather than popping at once. */
          const sibs = Array.from(entry.target.parentElement.children).filter((c) =>
            c.classList.contains("rv")
          );
          const idx = Math.max(0, sibs.indexOf(entry.target));
          entry.target.style.transitionDelay = Math.min(idx * 70, 420) + "ms";
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((i) => io.observe(i));
  }

  /* ---------- Counters and bars -------------------------------------------- */

  function initCounters() {
    const nums = $$("[data-to]");
    if (!nums.length) return;

    const run = (el) => {
      const target = Number(el.dataset.to);
      /* Preserve any prefix the markup already has, e.g. a suffix symbol. */
      const suffix = el.textContent.replace(/[\d.,]/g, "");

      if (reduceMotion || target === 0) {
        el.textContent = String(target) + suffix;
        return;
      }

      const dur = 1500;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        /* easeOutExpo, so the number settles instead of stopping dead. */
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          run(e.target);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.5 }
    );
    nums.forEach((n) => io.observe(n));
  }

  function initBars() {
    const bars = $$(".bar span[data-w], .stack-row .tr span[data-w]");
    if (!bars.length) return;

    const fill = (el) => {
      el.style.width = el.dataset.w + "%";
    };

    if (!("IntersectionObserver" in window) || reduceMotion) {
      bars.forEach(fill);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          fill(e.target);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.25 }
    );
    bars.forEach((b) => io.observe(b));
  }

  /* ---------- Card tilt ---------------------------------------------------- */

  function initTilt() {
    if (reduceMotion) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    $$("#grid .card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        /* Feed the sheen its position. */
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        card.style.transform =
          "perspective(900px) rotateX(" + (0.5 - py) * 6 + "deg) rotateY(" + (px - 0.5) * 7 + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Nav: stuck, progress, scroll-spy ----------------------------- */

  function initNav() {
    const nav = $("#nav");
    const bar = $("#progress");
    const sections = $$("section[id]");
    const links = $$(".nav-links a");

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("stuck", y > 12);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

      let current = sections[0] ? sections[0].id : "";
      sections.forEach((s) => {
        if (y >= s.offsetTop - 140) current = s.id;
      });
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile drawer ------------------------------------------------ */

  function initDrawer() {
    const drawer = $("#drawer");
    const burger = $("#burger");
    const close = $("#drawerClose");

    const setOpen = (open) => {
      drawer.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
      burger.setAttribute("aria-expanded", String(open));
    };

    burger.addEventListener("click", () => setOpen(!drawer.classList.contains("open")));
    close.addEventListener("click", () => setOpen(false));
    $("#scrim").addEventListener("click", () => setOpen(false));
    $$("#drawerPanel a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ---------- Command palette ---------------------------------------------- */

  function initPalette() {
    const pal = $("#palette");
    const input = $("#paletteInput");
    const list = $("#paletteList");

    let items = [];
    let sel = 0;

    const build = () => {
      const nav = $$(".nav-links a").map((a) => ({
        label: a.textContent.trim(),
        hint: "Jump to section",
        go: () => {
          const el = document.querySelector(a.getAttribute("href"));
          if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        },
      }));

      const repos = PROJECTS.map((p) => ({
        label: p.name,
        hint: p.tagline,
        go: () => window.open(repoUrl(p), "_blank", "noopener"),
      }));

      const acts = [
        {
          label: "Download complete package (ZIP)",
          hint: "Action",
          go: () => window.open(PROFILE.fullZipUrl, "_blank"),
        },
        {
          label: "Download website source (ZIP)",
          hint: "Action",
          go: () => window.open(PROFILE.sourceZipUrl, "_blank"),
        },
        {
          label: "Download CV — 2 pages (PDF)",
          hint: "Action",
          go: () => window.open(PROFILE.resumeUrl, "_blank"),
        },
        {
          label: "Download Resume — 1 page (PDF)",
          hint: "Action",
          go: () => window.open(PROFILE.onePageUrl, "_blank"),
        },
        {
          label: "Copy email address",
          hint: "Action",
          go: () => copyEmail(),
        },
        {
          label: "Toggle light / dark theme",
          hint: "Action",
          go: () => $("#themeBtn").click(),
        },
        {
          label: "Print this page",
          hint: "Action",
          go: () => window.print(),
        },
      ];

      return nav.concat(repos, acts);
    };

    const render = (q) => {
      const needle = q.trim().toLowerCase();
      items = needle
        ? items.filter((i) => (i.label + " " + i.hint).toLowerCase().indexOf(needle) !== -1)
        : items;
      sel = 0;

      if (!items.length) {
        list.innerHTML = `<li class="empty">Nothing matches "${q}"</li>`;
        return;
      }
      list.innerHTML = items
        .map(
          (i, n) =>
            `<li class="${n === 0 ? "sel" : ""}" data-n="${n}">${i.label}<span class="kicker">${i.hint}</span></li>`
        )
        .join("");
    };

    const open = () => {
      items = build();
      pal.classList.add("open");
      input.value = "";
      render("");
      setTimeout(() => input.focus(), 40);
    };
    const close = () => pal.classList.remove("open");

    const choose = (n) => {
      const item = items[n];
      if (!item) return;
      close();
      setTimeout(item.go, 60);
    };

    document.addEventListener("keydown", (e) => {
      const combo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (combo) {
        e.preventDefault();
        pal.classList.contains("open") ? close() : open();
        return;
      }
      if (!pal.classList.contains("open")) return;

      if (e.key === "Escape") return close();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        sel = Math.min(sel + 1, items.length - 1);
        paint();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        sel = Math.max(sel - 1, 0);
        paint();
      } else if (e.key === "Enter") {
        e.preventDefault();
        choose(sel);
      }
    });

    function paint() {
      $$("#paletteList li").forEach((li) => {
        li.classList.toggle("sel", Number(li.dataset.n) === sel);
      });
      const active = $('#paletteList li.sel');
      if (active) active.scrollIntoView({ block: "nearest" });
    }

    input.addEventListener("input", () => render(input.value));
    list.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-n]");
      if (li) choose(Number(li.dataset.n));
    });
    $("#paletteVeil").addEventListener("click", close);
    $("#paletteBtn").addEventListener("click", () => (pal.classList.contains("open") ? close() : open()));
  }

  /* ---------- Toast + clipboard -------------------------------------------- */

  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function copyEmail() {
    const done = () => toast("Email copied to clipboard");
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(PROFILE.email).then(done).catch(fallback);
    } else {
      fallback();
    }
    function fallback() {
      /* execCommand is deprecated but remains the only path on plain http://
         origins, which is exactly where clipboard.writeText is unavailable. */
      const ta = document.createElement("textarea");
      ta.value = PROFILE.email;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (err) {
        toast("Copy failed - email is " + PROFILE.email);
      }
      ta.remove();
    }
  }

  function initCopy() {
    const btn = $("#copyBtn");
    if (btn) btn.addEventListener("click", copyEmail);
  }

  /* ---------- Boot ---------------------------------------------------------- */

  function init() {
    paintStatic();
    paintStats();
    paintAbout();
    paintSkills();
    paintProjects();
    paintTimeline();
    paintMarquee();

    initTheme();
    initNav();
    initDrawer();
    initPalette();
    initCopy();

    /* Reveal observers must run after the markup exists. */
    initReveal();
    initCounters();
    initBars();
    initTilt();

    document.body.classList.add("ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();