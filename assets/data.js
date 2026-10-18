/* =============================================================================
   Portfolio data
   -----------------------------------------------------------------------------
   Everything the site renders comes from this file.

   The project figures are measured, not guessed: language percentages come from
   the GitHub languages API (GET /repos/{owner}/{repo}/languages), which counts
   bytes of code per language. "size" is the repository size in kilobytes as
   reported by the API.

   Keeping the data in one file means the page renders instantly and works with
   no network at all - there is no runtime API call to fail or rate-limit.
   ========================================================================== */

const PROFILE = {
  name: "Abhijeet Kumar Prajapati",
  initials: "AKP",
  role: "Software Developer",
  tagline: "Turning ideas into code, and code into impact.",
  location: "Katras, Jharkhand, India",
  email: "abhijeet943935@gmail.com",
  github: "https://github.com/Abhijeet-Kumar-Prajapati",
  degree: "B.Tech Information Technology",
  university: "Vinoba Bhave University, Hazaribagh",
  graduation: "2026",
  cgpa: "6.3 CGPA",
  resumeUrl: "downloads/Abhijeet-Kumar-Prajapati-CV.pdf",
  onePageUrl: "downloads/Abhijeet-Kumar-Prajapati-Resume.pdf",
  sourceZipUrl: "downloads/Abhijeet-Kumar-Prajapati-Portfolio.zip",
  fullZipUrl: "downloads/Abhijeet-Kumar-Prajapati-Complete-Package.zip",
};

/* Rotating roles shown in the hero. */
const ROLES = [
  "Software Developer",
  "Python Developer",
  "JavaScript Developer",
  "Java Programmer",
  "Offline-First App Builder",
  "Problem Solver",
];

const STATS = [
  { value: 11, suffix: "", label: "Projects Shipped", note: "all working applications" },
  { value: 11, suffix: "", label: "Public Repositories", note: "every one buildable" },
  { value: 320, suffix: "+", label: "Tests Passing", note: "across 6 suites" },
  { value: 0, suffix: "", label: "External Dependencies", note: "no npm, no pip" },
];

/* Aggregate language share across all 11 repositories, in percent. */
const LANGUAGES = [
  { name: "JavaScript", pct: 36 },
  { name: "HTML", pct: 33 },
  { name: "Python", pct: 14 },
  { name: "CSS", pct: 7 },
  { name: "Java", pct: 6 },
  { name: "PowerShell", pct: 3 },
];

const SKILLS = [
  {
    group: "Languages",
    items: [
      { name: "Python", level: 90, note: "automation, APIs, agents" },
      { name: "JavaScript", level: 88, note: "web, WebGL, Node" },
      { name: "Java", level: 72, note: "DSA and OOP practice" },
      { name: "PowerShell", level: 70, note: "Windows scripting" },
    ],
  },
  {
    group: "Frontend",
    items: [
      { name: "HTML", level: 92, note: "semantic, accessible markup" },
      { name: "CSS", level: 85, note: "layout, animation, responsive" },
      { name: "WebGL / Three.js", level: 70, note: "AETHER STUDIO" },
    ],
  },
  {
    group: "Currently learning",
    items: [
      { name: "C", level: 45, note: "systems and pointers" },
      { name: "C++", level: 45, note: "competitive programming" },
      { name: "SQL", level: 40, note: "data structures behind the queries" },
    ],
  },
  {
    group: "Tools",
    items: [
      { name: "Git & GitHub", level: 85, note: "branching, CI, history rewriting" },
      { name: "VS Code", level: 90, note: "daily driver" },
      { name: "Windows", level: 88, note: "desktop app targets" },
    ],
  },
];

/* -----------------------------------------------------------------------------
   The eleven projects.

   featured: renders in the larger card style at the top of the grid.
   Each project's `stack` is the measured language breakdown, high to low.
   -------------------------------------------------------------------------- */
const PROJECTS = [
  {
    id: "olmavax-ai",
    name: "Olmavax A.I",
    repo: "olmavax-A.I",
    tagline: "Local-first multi-agent AI workspace",
    blurb:
      "A complete AI workspace that runs entirely on your own machine. No account, no cloud, no telemetry, and zero npm dependencies. Works even with no API key, because nineteen plugins and an offline brain handle real work locally.",
    highlights: [
      "Nine specialised agents",
      "19 local plugins",
      "22-language syntax highlighting",
      "Voice input sharing the chat",
      "PDF export and a QR encoder built from scratch",
      "Optional Python sidecar, 27 modules",
    ],
    stack: [
      { lang: "Python", pct: 57 },
      { lang: "JavaScript", pct: 30 },
      { lang: "CSS", pct: 9 },
      { lang: "HTML", pct: 3 },
    ],
    tags: ["Python", "JavaScript", "HTML", "CSS"],
    kb: 907,
    featured: true,
    live: "https://abhijeet-kumar-prajapati.github.io/olmavax-A.I/docs/",
    year: "2026",
  },
  {
    id: "pylab-studio",
    name: "PyLab Studio",
    repo: "pylab-studio",
    tagline: "132 Python programs in one project",
    blurb:
      "A single project holding 132 small Python programs across 9 categories. Each one runs three different ways: from a console menu, from a local website, or from a live web demo.",
    highlights: ["132 programs", "9 categories", "3 ways to run each", "Beginner friendly"],
    stack: [
      { lang: "Python", pct: 70 },
      { lang: "JavaScript", pct: 13 },
      { lang: "HTML", pct: 12 },
      { lang: "CSS", pct: 5 },
    ],
    tags: ["Python", "JavaScript", "HTML", "CSS"],
    kb: 244,
    year: "2026",
  },
  {
    id: "aether-studio",
    name: "AETHER STUDIO",
    repo: "AETHER-STUDIO",
    tagline: "Procedural 3D and 4D animation",
    blurb:
      "A WebGL studio that puts 3D animation, keyframed 4D animation and rigid-body dynamics behind one shared render loop. Every human, car, bird, terrain, cloth and jelly is generated at runtime. No models, no textures, no build step.",
    highlights: ["3D and 4D on one timeline", "Rigid-body physics", "Fully procedural", "Zero assets"],
    stack: [
      { lang: "JavaScript", pct: 76 },
      { lang: "HTML", pct: 12 },
      { lang: "CSS", pct: 12 },
    ],
    tags: ["JavaScript", "HTML", "CSS"],
    kb: 409,
    year: "2026",
  },
  {
    id: "campus-nexus",
    name: "Campus Nexus",
    repo: "Campus-Nexus",
    tagline: "Library, store and arcade in one app",
    blurb:
      "Four separate student projects merged into a single application: a library system, a store, an arcade, a dashboard and a security centre, all sharing one login and one codebase.",
    highlights: ["5 modules", "Single shared login", "Roles and permissions", "One codebase"],
    stack: [
      { lang: "JavaScript", pct: 82 },
      { lang: "HTML", pct: 10 },
      { lang: "CSS", pct: 8 },
    ],
    tags: ["JavaScript", "HTML", "CSS"],
    kb: 2590,
    year: "2026",
  },
  {
    id: "codelite",
    name: "CodeLite",
    repo: "CODELITE-SOFTWARE-PC",
    tagline: "Offline code editor for Windows",
    blurb:
      "A lightweight, fully offline code editor for Windows. No telemetry, no accounts, no tracking, under 100 KB of code.",
    highlights: ["Fully offline", "Installer included", "No telemetry", "Tiny footprint"],
    stack: [
      { lang: "JavaScript", pct: 55 },
      { lang: "HTML", pct: 23 },
      { lang: "CSS", pct: 9 },
      { lang: "PowerShell", pct: 8 },
    ],
    tags: ["JavaScript", "HTML", "CSS", "PowerShell"],
    kb: 508,
    year: "2026",
  },
  {
    id: "java-practice",
    name: "Java Practice Programs",
    repo: "MULTIPLE-JAVA-PRACTICE-PROGRAMS---ALL-IN-ONE-LAUNCHER",
    tagline: "40 Java programs with automated CI",
    blurb:
      "A structured collection of 40 Java programs covering Data Structures and Algorithms, OOP and small projects. BubbleSort, MergeSort, QuickSort, DFS/BFS, Dijkstra, Kruskal, Huffman, inheritance, exception handling and more.",
    highlights: ["40 programs", "Automated CI on every push", "All-in-one launcher", "DSA and OOP"],
    stack: [
      { lang: "Java", pct: 50 },
      { lang: "HTML", pct: 28 },
      { lang: "PowerShell", pct: 22 },
    ],
    tags: ["Java", "HTML", "PowerShell"],
    kb: 62,
    year: "2026",
  },
  {
    id: "apm-player",
    name: "APM Open Player",
    repo: "Open-Architecture-Power-Media-Player.--Software-Andriod-Mac-Os",
    tagline: "One player, every format, every platform",
    blurb:
      "A universal media player combining the best of VLC, MX Player and KM Player into one open-source application. Ships for Windows 64-bit, macOS and Android.",
    highlights: ["Windows, macOS, Android", "Every codec", "Open source"],
    stack: [
      { lang: "JavaScript", pct: 68 },
      { lang: "Java", pct: 13 },
      { lang: "HTML", pct: 11 },
      { lang: "CSS", pct: 5 },
    ],
    tags: ["JavaScript", "Java", "HTML", "CSS"],
    kb: 491,
    year: "2026",
  },
  {
    id: "work-hub",
    name: "Work Hub",
    repo: "Abhijeet-Work-Hub",
    tagline: "Every project in one dashboard",
    blurb:
      "One application that scans and shows every project on the machine in a single dashboard: Flask apps, AI assistants, web projects, Android apps and practice files.",
    highlights: ["Auto-discovers projects", "Launch from the UI", "Local-only by default"],
    stack: [
      { lang: "HTML", pct: 29 },
      { lang: "Python", pct: 28 },
      { lang: "JavaScript", pct: 23 },
      { lang: "CSS", pct: 19 },
    ],
    tags: ["HTML", "Python", "JavaScript", "CSS"],
    kb: 61,
    year: "2026",
  },
  {
    id: "gamevault",
    name: "GameVault",
    repo: "GAME-VALT-PLATFORM",
    tagline: "Mobile gaming platform",
    blurb:
      "A mobile gaming platform built for the Indian mobile gaming community. Discover games, join tournaments with real prize money, climb the leaderboard and connect with other players.",
    highlights: ["Tournaments with prize money", "Leaderboard", "No build step"],
    stack: [
      { lang: "JavaScript", pct: 54 },
      { lang: "HTML", pct: 35 },
      { lang: "CSS", pct: 11 },
    ],
    tags: ["JavaScript", "HTML", "CSS"],
    kb: 128,
    year: "2026",
  },
  {
    id: "ionic-toolkit",
    name: "Ionic ToolKit",
    repo: "Ionic-ToolKit-",
    tagline: "All-in-one student toolkit, installable as a PWA",
    blurb:
      "A single-page PWA bundling eight tools: scientific calculator, library management, Snake, DSA visualizer, matrix operations, coding platform, AI chat and an in-app browser. Every tool ships in a basic and an advanced version.",
    highlights: ["8 tools", "Basic + Advanced modes", "Installable PWA", "Works offline"],
    stack: [{ lang: "HTML", pct: 100 }],
    tags: ["HTML", "CSS", "JavaScript"],
    kb: 35,
    year: "2026",
  },
  {
    id: "web-media-player",
    name: "Web Media Player",
    repo: "Web-Media-Player",
    tagline: "Responsive single-file media player",
    blurb:
      "A responsive web media player for local audio and video, with playlist controls, playback speed, volume and brightness adjustment, keyboard shortcuts and fullscreen support.",
    highlights: ["Keyboard shortcuts", "Auto-advancing playlist", "Zero dependencies"],
    stack: [{ lang: "HTML", pct: 100 }],
    tags: ["HTML", "CSS", "JavaScript"],
    kb: 14,
    year: "2026",
    live: "https://abhijeet-kumar-prajapati.github.io/Web-Media-Player/",
    featured: true,
  },
];

const TIMELINE = [
  {
    when: "October 2026",
    what: "Olmavax A.I released",
    detail:
      "Built and published a local-first multi-agent AI workspace: 92 files, six passing test suites, a Python sidecar and a live documentation site.",
  },
  {
    when: "October 2026",
    what: "Eleven projects published",
    detail:
      "Moved every project to a public repository, documented each one honestly, and enabled GitHub Pages for the ones that can be served statically.",
  },
  {
    when: "2022 - 2026",
    what: "B.Tech Information Technology",
    detail:
      "Vinoba Bhave University, Hazaribagh. Graduating 2026 with a 6.3 CGPA.",
  },
  {
    when: "Next",
    what: "Internships and open source",
    detail:
      "Looking for an internship or entry-level software role where I can contribute to something real.",
  },
];