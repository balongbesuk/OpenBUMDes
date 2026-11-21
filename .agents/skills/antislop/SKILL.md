---
name: antislop
description: >
  Anti-AI-slop discipline for code, UI, and prose: eliminates bloated abstractions,
  decorative UI clutter, generic AI aesthetics, silent error swallowing, and hollow
  conversational filler. Trigger on "antislop", "anti-slop", "no slop", "clean up slop",
  or whenever writing UI components, refactoring code, or reviewing output quality.
---

# Antislop

Eliminate AI slop across code, UI, and communication. Keep every line earned, functional, and authentic to OpenBUMDes.

## 1. Code Antislop
- **No speculative abstractions**: Do not create single-use wrappers, factories, or config layers for hypothetical future needs.
- **No silent error swallowing**: Never write empty `catch {}` or `catch { return null }` without logging or propagating context (`{ cause: err }`), unless explicitly an optional non-critical read.
- **No dead weight**: Remove unused imports, unreachable branches, commented-out blocks, and redundant `what`-comments (comment only *why* when non-obvious).
- **No placeholder/stub code**: Never leave `TODO`, mock data, or hardcoded sample village names in production logic.

## 2. UI & Design Antislop
- **No generic AI aesthetic**: Avoid gratuitous gradients, decorative glow shadows, excessive `Sparkles` icons on non-AI features, or pill-badge overload.
- **Respect domain gravity**: OpenBUMDes is an official village accounting system (Kepmendes PDTT 136/2022). Keep layouts clean, scannable, high-contrast, and printable without visual noise.
- **No fake feedback**: Every button, toast, and status badge must reflect real state and real server responses.

## 3. Prose & Reply Antislop
- **Zero filler**: Skip "Tentu!", "Dengan senang hati!", or generic summaries repeating what the user just asked.
- **Plain, direct language**: Use concrete file paths, exact symbol names, and verifiable results. Avoid buzzwords ("revolusioner", "seamless", "holistik").
