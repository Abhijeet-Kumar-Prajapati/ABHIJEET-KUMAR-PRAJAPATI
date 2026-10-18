# Security Policy

This document explains how this repository is protected, how its automation handles credentials,
and what to do if something goes wrong.

The short version: **the only real asset here is a GitHub token.** Everything else in this
repository is public by design.

---

## 🔐 Reporting a Vulnerability

If you find a security problem in this repository, please report it privately rather than
opening a public issue.

**Preferred method — GitHub Security Advisories:**

1. Go to <https://github.com/Abhijeet-Kumar-Prajapati/ABHIJEET-KUMAR-PRAJAPATI/security/advisories/new>
2. Describe the problem and the steps needed to reproduce it

This opens a private channel between you and the repository owner. Nothing is published until
a fix has been prepared.

**Please do not report through:**

- A public GitHub Issue
- A pull request from a fork
- A social media mention or a public email

Please give a reasonable amount of time for a fix to be prepared before disclosing the issue
publicly. For a personal project this is usually a few days.

**What is *not* a vulnerability here**

Most changes to this repository are made by its owner and are not exploitable by a third party.
The following are not treated as security issues:

- Editing the README text, or any content outside the `AUTO:` blocks
- Changing repository topics or the profile bio
- Running the automation with your own token against your own account
- Missing or incorrect metadata

---

## 📋 Supported Versions

This repository holds a personal profile page and the automation that maintains it. There are
no released versions to backport patches to, so only the current state of `main` is supported.

| Version | Supported |
|---|---|
| `main` (current) | ✅ |
| Any previous commit | ❌ |
| Archived copies / forks | ❌ |

---

## 🎯 What could actually go wrong

Being clear about the threat model matters more than a long list of protections.

| Asset | Risk if compromised | Likelihood |
|---|---|---|
| **GitHub token** | Write access to the profile repository | Low — but this is the one that matters |
| **Profile README** | Cosmetic only — anyone can fork it | None |
| **Automation code** | Runs on your machine, not on a public server | Low |

The automation is the only executable code in this repository. It performs four actions:

1. Reads your public repositories
2. Updates repository **topics**
3. Updates your profile **bio**
4. Rewrites the `AUTO:` blocks inside `README.md`

It does **not** read, store, or transmit any personal data. It never writes to any repository
other than this one.

---

## 🔑 Token handling

This automation talks to the GitHub API, which requires a **Personal Access Token**.

**Use a fine-grained token only.** A classic token (`ghp_...`) grants access to your entire
account, which is far more than this script needs.

| | Fine-grained ✅ | Classic ❌ |
|---|---|---|
| Repositories reachable | Only the ones you select | **Every** repository you own |
| Permissions | Narrow and specific | Broad account-wide access |
| Damage if leaked | Bounded to one repository | Potentially your whole account |
| Expiry | Forced and renewable | Often set to never expire |

### Creating the token

1. Go to `Settings → Developer settings → Personal access tokens → Fine-grained tokens`
2. **Token name:** something recognisable, e.g. `profile-auto-manager`
3. **Resource owner:** your own account
4. **Repository access:** `Only select repositories`, then select just:
   - `Abhijeet-Kumar-Prajapati/ABHIJEET-KUMAR-PRAJAPATI`
   - Any project repository whose topics you want synced (for example `Web-Media-Player`)
5. **Repository permissions:**
   - `Contents` → **Read and write**
   - `Metadata` → **Read-only** (enabled automatically, and required)
6. **Account permissions:**
   - `Profile` → **Read and write** — only needed if you want the bio updated
   - If you would rather not grant this, leave it out. The script will skip the bio step and
     everything else will still work
7. **Expiration:** `90 days`. A reminder will arrive before it lapses

### Storing the token

Store the token in a `.env` file in the root of this repository:

```
GITHUB_TOKEN=github_pat_your_token_here
```

The file is listed in `.gitignore`, so Git will never track it and it cannot be committed by
accident.

**A note on Windows.** Do not store the token with `setx`. That command writes the value
permanently into the Windows registry, where it survives uninstalling programs and is far
harder to find and remove. The `.env` file used here is easier to audit and easier to delete.

---

## 🛡️ Protections already in place

| Protection | Where |
|---|---|
| HTTPS only — no plaintext transport | `API = "https://api.github.com"` |
| Token sent **only** as an `Authorization` header | `api()` in `automation/profile_manager.py` |
| Token is **never** printed, logged, or written to disk | `api()` — no print path touches it |
| GitHub API version pinned, so responses cannot shift underfoot | `X-GitHub-Api-Version: 2022-11-28` |
| 30-second timeout on every request | `urlopen(req, timeout=30)` |
| Exponential backoff on rate limits | `api()` — retries on HTTP 403 and 429 |
| No third-party dependencies — standard library only | No `requirements.txt`, no `package.json` |
| `.env`, `.env.local`, `*.token` are git-ignored | `.gitignore` |
| Byte-compiled files and editor folders are git-ignored | `.gitignore` |
| Each step runs in its own `try`/`except` | `main()` — one failure cannot cascade |
| **Idempotent commits** — nothing changes, nothing is committed | `sync_*` return `0` when clean |
| README edits are restricted to `AUTO:` blocks | `replace_block()` matches on markers only |
| The projects table is excluded from automation | `auto_projects: false` in `automation/config.json` |
| Topics are **merged**, never deleted | `sync_topics()` |
| Secrets are read from the environment, not hard-coded | `load_dotenv()` |

### Why this is a low-risk target

- There is no web server, no database, and no network listener.
- There is no user input reaching `eval`, `exec`, or a shell.
- The automation only ever writes to **this** repository, using **your** token.
- Anyone who finds a bug here can already write to a public repository by definition.

---

## 🚨 If the token is ever exposed

Treat any leaked token as compromised immediately. Revocation is fast; investigating an
incident afterwards is not.

1. **Revoke it now**
   `Settings → Developer settings → Personal access tokens` → find the token → **Delete**

   Do this first, before anything else. The token stops working the moment you click.

2. **Create a replacement**
   Follow the steps above, with the same narrow permissions.

3. **Update the local copy**
   Replace the value in your `.env` file.

4. **Check for unexpected activity**
   - Repository **Settings → Insights → Traffic** for unusual clone or view volume
   - **Settings → Audit log** for changes you did not make
   - The repository's **Activity** view for commits you did not author

5. **Rotate anything else that shared the token**
   If the same token was pasted into another tool, service, or chat, revoke it there too.

### Good habits that prevent this

- Never paste a token into a chat, an issue, a screenshot, or a screen recording
- Never commit `.env` — if you do, the token is compromised even if you delete it later,
  because it stays in the git history. Rotate it, then purge the history
- Prefer a 90-day token over a non-expiring one
- If you share your screen, close `.env` and the token settings page first

---

## ✅ Account hardening

These protect your account as a whole, not just this repository. All three are available on
GitHub's free plan.

- [ ] **Two-factor authentication**
      `Settings → Password and authentication`
      This is the single most valuable thing you can enable.

- [ ] **Dependabot alerts**
      `Settings → Code security → Dependabot alerts`
      Warns you when a dependency has a known vulnerability.

- [ ] **Secret scanning**
      `Settings → Code security → Secret scanning`
      Alerts you the moment a token is committed, even if it was only in a deleted line.

- [ ] **Push protection**
      `Settings → Code security → Push protection`
      Blocks pushes that contain known secret patterns.

- [ ] **Review active sessions**
      `Settings → Password and authentication → Active sessions`
      Sign out anything you do not recognise.

- [ ] **Verify your email addresses**
      `Settings → Emails`
      A verified recovery address means you can still recover the account.

---

## 📄 Related documents

- [`PRIVACY.md`](PRIVACY.md) — what data this profile exposes, and what it deliberately does not