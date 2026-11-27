# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Astro (static output) + TypeScript + vanilla three.js, deployed to GitHub Pages. The owner pinned three.js and left the rest to the builder ("the best one possible as u like", 2026-11-27). Astro was chosen once the owner asked for three complete versions: they share one typed content source, and every version must ship its text as real HTML with the 3D layered on top. No UI framework runs in the browser.

## Users

Primary: recruiters and hiring engineers deciding whether to interview Veerabhadra Swami Challagali ("vbs") for software-engineering and AI/ML roles. They arrive from a link on the résumé, the GitHub profile or a job application, on a laptop between other tasks or on a phone, and give the page well under a minute before deciding to read on. Their job: judge whether this person ships real systems, then find the proof and the contact details without hunting.

Secondary: engineers who land from GitHub and want to see what was built and how.

## Product Purpose

A personal portfolio at https://vbs-0.github.io that says who vbs is, shows what they built using the résumé and their public GitHub repositories, and makes contact easy.

It ships as three complete versions of the same content, because the owner picks one per job application or event (decision of 2026-11-27): `/phone/` (About phone), `/manual/` (Service manual) and `/classic/` (Classic). The root URL shows whichever version `site.config.ts` names as the default.

Success means a visitor can say what vbs builds after the first screen, can reach the evidence for any claim (repository, live demo, measured number) in one click, and can email, call or download the résumé from wherever they stop reading.

## Positioning

Range plus rigor. vbs works on every layer of a shipped product: Android device bring-up (device tree, vendor blobs, kernel images, recovery), protocols and small native tools (Rust, Kotlin, Java against the ADB wire protocol), full-stack products (FastAPI or Django, PostgreSQL, React, Flutter) and machine learning. Each project is documented with measurements, test counts and stated limits rather than adjectives. The artifacts and their numbers are what a neighbouring portfolio could not truthfully copy.

## Operating Context

- Entry points: the "GitHub" link in the résumé PDF, the GitHub profile README, job applications, messages on Telegram.
- Hiring engineers click through to repositories and live demos; recruiters look for role, experience, education and a résumé file.
- The site is static files on GitHub Pages. GitHub data (public repositories, languages, the contribution calendar) is fetched at build time and committed as JSON, so the page never depends on a live API call.
- Source material: the résumé `swami_AiML_EXP_2026 (1).pdf` (October 2026) and the public repositories under https://github.com/vbs-0.

## Capabilities and Constraints

- Three single-page versions sharing one content source. No backend, no analytics or third-party trackers, self-hosted fonts.
- three.js is required by the owner.
- All content must be readable with WebGL unavailable, with JavaScript disabled, and with reduced motion requested.
- Must run acceptably on a mid-range Android phone.
- Private and company code is never shown. Work at SkyLinx is described only with résumé facts plus the two owner-approved additions below.
- The only repository the builder may push to is `vbs-0/vbs-0.github.io` (owner approval, 2026-11-27).
- Owner-approved public information (2026-11-27): mobile number, résumé PDF download, employer name (SkyLinx, product Emplinx), team-lead role.
- The lead role is worded "one of two team leads on a nine-person team".
- Left out on purpose: the `bomber` and `commit-hygiene` repositories, forks, education percentages, school-level education.
- Open decisions: exact spelling of the employer name (written as SkyLinx); full names of the colleges (the résumé says SVEC and AKRG); LinkedIn URL (none provided); custom domain (none yet).

## Brand Commitments

- Name: Veerabhadra Swami Challagali. Handle: vbs (`vbs-0` on GitHub, `@vbs_0` on Telegram).
- Public email: chvbswami@gmail.com (the résumé address).
- Voice observed in the owner's own READMEs, to be kept: plain statements, numbers with their source, limits stated openly ("Honest limits", "Not measured yet"), no hype.

## Evidence on Hand

- Résumé facts: Software Engineer, full-time since July 2026 after an April to June 2026 internship (FastAPI event-management system; Django HRMS across web and Android; multi-tenant recruitment, attendance, payroll, leave and self-service modules). B.Tech AI and ML, SVEC, 2023 to 2026. Diploma EEE, AKRG, 2017 to 2022. NVIDIA certificate "Building RAG Agents with LLMs" (May 2025). Algo Phoenix 2025 first place, Hack Wave 1.0 third place, Hack Overflow 2K24.
- Public repositories with READMEs, screenshots and measured results: studease, pam, QuantumLink-PQC, device_xiaomi_air with vendor_xiaomi_air, air-kernel and twrp_xiaomi_air, clipbridge, notepad-showdown, ai-bridge-mcp, termadb, commit-hygiene, RL, predoctor1.2, DSAAllocator, smart-crop-management, Garuda-Technologies/pulse.
- Live demos answering HTTP 200 on 2026-11-27: https://pam.is-cool.dev, https://studease.is-cool.dev, https://predoctor.ccbp.tech, https://taskverse3.vercel.app.
- GitHub snapshot on 2026-11-27: 33 public repositories, 520 contributions in the last year.
- Absent, and not to be invented: a portrait photo, testimonials, a LinkedIn profile, blog posts, download or user counts.

## Product Principles

1. Every claim sits one click from its evidence.
2. The résumé is the floor: nothing on the page contradicts it, and anything beyond it is owner-approved.
3. Content first: the page is complete with the 3D switched off.
4. Limits stay visible: a research prototype is called a research prototype.
5. Fast on the kind of phone the owner builds for.

## Accessibility & Inclusion

WCAG 2.2 AA as the target. Everything operable by keyboard, reduced motion respected, and no information available only through the 3D scene.
