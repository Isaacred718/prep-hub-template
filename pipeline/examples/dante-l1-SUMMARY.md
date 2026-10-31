# Dante Certification Level 1 — research summary

Research stage output for `dossier.json`. Sources checked on the live web on 2026-10-13.

## Headline

- **Track:** one, `L1`: Dante Certification Level 1, **3rd Edition**. This edition rewrote Levels 1–3 from scratch and launched in autumn 2025. Audinate's press release is dated 8 Oct 2025. No prerequisite is stated.
- **Cost:** free. You need a free GetDante account.
- **Format:** self-paced online course of chapters with videos and quizzes, then a final certification test on the TalentLMS portal (`getdante.com/certify`).
- **Validity:** three years from the award date.
- **Credit:** 5.5 AVIXA RUs (CTS, CTS-D, CTS-I, ANP) and 3.25 CEDIA CEUs, per the official program page.
- **No official blueprint.** Audinate publishes no exam content outline, weights or task list. `duties` is absent, so readiness falls back to per-domain scoring.

## Domains (from the official course structure)

| Domain | Basis |
|---|---|
| Dante & Audinate Ecosystem | Chapter 2 (public) |
| Digital Audio Fundamentals | "digital audio basics" chapter, referenced in the Ch4 transcript; chapter number not public |
| Dante Audio Products | Chapter 4 (public) |
| Digital Video Fundamentals | "video basics" chapter, referenced in the Ch6 transcript; chapter number not public |
| Dante AV | Chapter 6 (public) |
| Dante Functional Categories & First Network | Chapter 7 (public) |
| Networking Fundamentals | MAC/IP addressing and topologies, named in the official course descriptions |
| Latency | "introduction to latency" chapter, referenced in the Ch10 transcript |
| Dante Controller | Chapter 10 (public) |

Audinate publishes five Level 1 chapters on getdante.com, each with video, learning objectives and a full transcript: Ch2, 4, 6, 7 and 10. They are the best grounding sources for NotebookLM. The other chapters are only inside the portal. Their titles and the total chapter count (at least 10) are unknown.

## Gated or uncertain

- **Gated:** the full course, the chapter quizzes and the final test are behind the GetDante login on TalentLMS. I did not view them.
- **Not published:** the test's question count, time limit, pass mark, retake/attempt rules and proctoring. The dossier's `passMark 70`, `simQuestions 50` and `simMinutes 60` are app practice defaults, not Audinate figures. The disclaimer says so.
- **Chapter order:** Ch1 (programme intro), Ch3 (digital audio), Ch5 (video) and Ch8–9 (networking, latency) are inferred from cross-references in the transcripts, not verified.
- **Fetching:** audinate.com/learning pages returned HTTP 403. support.getdante.com needed a real browser render.

## Conflicts between official sources

1. **RUs:** the program page and the press release say 5.5 RUs for Level 1, and AVIXA's own listing agrees. The support FAQ (updated 2026-05-11) says "~2 RUs" (and ~4 / ~6 for L2 / L3). That looks stale. I recommend citing 5.5.
2. **Launch date:** the support FAQ says September 2025. The press release says 8 Oct 2025. The 3rd Edition page was first published 26 Aug 2025, and the chapter videos 3 Oct 2025.
3. **Validity:** "three years" everywhere, but the certificates FAQ says some certificates last 3–5 years and that a new edition can mark old certificates expired.
4. **Edition risk:** the 2nd Edition is still live in non-English languages, and most third-party notes cover the 1st or 2nd Edition. Build only from 3rd Edition material.

## Recommended content targets

- **265 questions** for L1, split by apparent course emphasis since there are no official weights: Controller 45, Networking 35, Digital Audio 35, Functional Categories 30, Dante AV 30, Latency 25, Audio Products 25, Digital Video 25, Ecosystem 15.
- **20 cards per domain** (180 total).
- **9 guides**, one per domain.
- **10 drills**: Dante Controller troubleshooting scenarios such as a renamed device breaking subscriptions, a sample-rate mismatch, the wrong NIC, and video resolution or frame-rate switching delays.
- **No library:** there are no public 3rd Edition PDFs.
- **Before shipping:** someone enrolled (free) should check the four non-public domains against the gated course and record the final test's rules.
