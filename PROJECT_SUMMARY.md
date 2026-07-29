# 🇸🇪 Muninn — Project Architecture & Delegation Guide

> **Muninn** is a professional, audio-first Swedish language learning application designed to guide learners from **zero to fluent (A1 to C2)** using state-of-the-art **FSRS-4.5 spaced repetition**, frequency-ranked vocabulary, and natural neural speech synthesis.

---

## 📍 Key Links & Repository Info
- **GitHub Repository**: [`https://github.com/RobbieGHunt/Muninn.git`](https://github.com/RobbieGHunt/Muninn.git)
- **Live Deployment**: [`https://robbieghunt.github.io/Muninn/`](https://robbieghunt.github.io/Muninn/)
- **Local Workspace**: `c:\Users\robbi\Documents\Swedish\App\Muninn`

---

## 🏗️ 1. Technical Stack & Architecture

| Layer | Technology / Implementation | Key Files |
| :--- | :--- | :--- |
| **Core Framework** | React 18 + TypeScript + Vite | [`package.json`](file:///c:/Users/robbi/Documents/Swedish/App/Muninn/package.json), [`vite.config.ts`](file:///c:/Users/robbi/Documents/Swedish/App/Muninn/vite.config.ts) |
| **Persistence** | Dexie.js (IndexedDB wrapper) | [`src/db/database.ts`](file:///c:/Users/robbi/Documents/Swedish/App/Muninn/src/db/database.ts), [`src/db.ts`](file:///c:/Users/robbi/Documents/Swedish/App/Muninn/src/db.ts) |
| **SRS Math Engine** | FSRS v4.5 (Free Spaced Repetition Scheduler) | [`src/services/fsrsService.ts`](file:///c:/Users/robbi/Documents/Swedish/App/Muninn/src/services/fsrsService.ts) |
| **Audio Engine** | Web Speech API + Neural AI Hierarchy + Pre-rendered MP3 | [`src/services/audioService.ts`](file:///c:/Users/robbi/Documents/Swedish/App/Muninn/src/services/audioService.ts) |
| **UI & Styling** | Nordic Dusk CSS Tokens + Tailwind CDN + Outfit Font | [`src/index.css`](file:///c:/Users/robbi/Documents/Swedish/App/Muninn/src/index.css), [`index.html`](file:///c:/Users/robbi/Documents/Swedish/App/Muninn/index.html) |
| **Deployment** | GitHub Actions (`.github/workflows/deploy.yml`) | [`.github/workflows/deploy.yml`](file:///c:/Users/robbi/Documents/Swedish/App/Muninn/.github/workflows/deploy.yml) |

---

## 🧠 2. FSRS-4.5 Spaced Repetition Engine

- **Mathematical Memory Parameters**: Tracks `stability` (retention half-life in days), `difficulty` (1 to 10 scale), and `retrievability` ($R = (1 + \frac{t}{9 \cdot S})^{-1}$).
- **Card States**: `0` (New), `1` (Learning), `2` (Review), `3` (Relearning).
- **Rating Buttons**:
  - `1 - Again` (Coral Red `#EF4444`, interval `< 10m`)
  - `2 - Hard` (Amber Yellow `#F59E0B`, interval `~1.2d`)
  - `3 - Good` (Emerald Green `#10B981`, interval `~3.5d`)
  - `4 - Easy` (Cyan Blue `#06B6D4`, interval `~9.0d`)
- **Queue Logic**:
  - Automatically loads new cards strictly in ascending order of `frequencyRank` (most common words first).
  - Enforces daily new card caps (`5` to `50` cards/day) set in Settings.
  - Supports a **"Studera extra ord 🚀" (Bonus Session)** button to bypass the daily cap when the user wants to study more.

---

## 🇸🇪 3. Swedish SLA Pedagogy & Master Lexicon

Muninn follows modern **Second Language Acquisition (SLA)** principles (*Krashen's $i+1$ Comprehensible Input* and frequency-indexed ordering):

1. **Modular Tier Structure**:
   - **Tier 1 (Foundation - Ranks 1–500, A1)**: Pronouns, top 100 verbs, core nouns with `en/ett` gender tags, numbers, prepositions.
   - **Tier 2 (Everyday - Ranks 501–2500, A2/B1)**: Daily life, particle verbs (*tycka om*, *tänka på*), food, travel, work.
   - **Tier 3 (Fluent - Ranks 2501–6000, B2/C1)**: Professional, news, academic, abstract nouns.
   - **Tier 4 (Mastery - Ranks 6001+, C2)**: Idiomatic expressions (*slå två flugor i en smäll*, *ana ugglor i mossen*), specialized vocabulary.
2. **Paired Pronouns & Word Forms**:
   - Related pronouns and cases are combined into cohesive cards (e.g. `jag / mig`, `du / dig`, `han / honom`, `sin / sitt / sina`).
3. **Card Schema**:
   - Every card contains: `id`, `front`, `back`, `ipa`, `gender` (`'en' | 'ett'`), `cefrLevel` (`A1`–`C2`), `frequencyRank`, `example` (Swedish $i+1$ sentence), `exampleTranslation` (English), and optional `inflections`.

---

## 🔊 4. Audio Engine & Speech Sanitization

- **Prosodic Pause Sanitization (`sanitizeForSpeech`)**:
  - Converts slashes (`/`), backslashes (`\`), and vertical bars (`|`) into longer natural breathing pauses (`... ... `).
  - Strips parenthetical meta tags `(subject)`, `(en-ord)` and non-speech symbols.
  - **Guarantees**: Paired cards like `jag / mig` are spoken as *"jag... mig"* without pronouncing *"streck"*.
- **Neural AI Voice Hierarchy (`getPreferredSwedishVoice`)**:
  - Automatically selects high-fidelity Neural AI Swedish voices:
    1. *Microsoft Sofie Neural*
    2. *Microsoft Mattias Neural*
    3. Other Neural / Natural AI Swedish voices
    4. *Google svenska*
    5. Standard Swedish voices (*Alva*, *Klarafono*, *Oskar*).
- **Pre-Rendered Audio Track Support (`card.audioUrl`)**:
  - Accepts optional pre-rendered MP3/WAV URLs with seamless fallback to Web Speech Synthesis if an audio file fails to load.

---

## 🎨 5. UI/UX Ergonomics & Visual Design

- **Nordic Dusk Theme**: Deep slate background (`#0B0F19`), glassmorphism card surfaces (`#161F33`), cyan `en-ord` pills (`#06B6D4`), amber `ett-ord` pills (`#F59E0B`), purple verb pills (`#A855F7`).
- **No-Scroll Card Fit**:
  - Main study card uses a fixed viewport container (`h-[calc(100vh-140px)] min-h-[460px] max-h-[640px] flex flex-col justify-between`).
  - Header bar, focal target word, IPA phonetics, English translation, example sentence, and 4 rating buttons fit on screen without vertical scrolling in standard browser fullscreen sizes.
- **Settings Modal**:
  - Daily new cards selector (5, 10, 15, 20, 30, 50).
  - Speech rate slider (0.5x to 1.5x) with "Testa 🔊" audio button.
  - Audio auto-play toggle switch.
  - "Ord inlärda" (Words Learned) counter metric.
  - Single-click direct "Återställ alla framsteg" (Reset Progress) confirmation dialog.

---

## 🤖 6. Agent Delegation & Workflow Rules

When working on Muninn, follow these strict execution rules:

### Agent Roles
- **Sven (Orchestrator)**: Project lead. Oversees subagent invocation, task routing, git/npm commands, and architectural integrity.
- **Klara (Creative Design Lead)**: UI/UX redesigns, CSS design tokens, responsive card layouts, settings modal, and visual ergonomics.
- **Lars (Lead Systems Engineer)**: Tech stack setup, Dexie IndexedDB schemas, FSRS-4.5 math scheduler, audio engine, unit tests, and GitHub Pages deployment workflow.
- **Nils (Swedish Language & SLA Expert)**: Lexicon tier expansion, $i+1$ example sentence generation, IPA phonetics, Rikssvenska pronunciation auditing, and grammar rules.

### Pre-Approved Tools & Command Directives
- **Pre-Approved Permissions**: `command(git)`, `command(npm)`, and `write_file(c:\Users\robbi\Documents\Swedish\App\Muninn)` are pre-approved by user policy.
- **Git Executable Path**: Always run git using `& "C:\Program Files\Git\cmd\git.exe"` or direct string `git`.
- **NO Recursive Executable Search Rule**: NEVER run `Get-ChildItem` or system-wide directory searches to locate executables (`node`, `npm`, `git`).
- **Autonomous Execution**: Run terminal commands (`npm run build`, git commit, git push) directly without blocking for unnecessary permissions.

---

## 🛠️ Common Operations & Commands

```powershell
# Run local development server
npm run dev

# Run TypeScript build check
npm run build

# Run unit test suite
npm test

# Commit & push changes to GitHub
& "C:\Program Files\Git\cmd\git.exe" add .
& "C:\Program Files\Git\cmd\git.exe" commit -m "Your commit message"
& "C:\Program Files\Git\cmd\git.exe" push origin main
```
