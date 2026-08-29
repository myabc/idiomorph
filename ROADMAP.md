# Idiomorph Roadmap

## Overview
This document outlines the development roadmap for Idiomorph. It provides a high-level view of the project's goals, milestones, and planned features. Anything with a question mark is a potential feature that may or may not be implemented.

## Goals (in descending order of priority)
- Correct production of expected HTML
- Preservation of non-HTML state
- Performance

## Milestones

### 0.8.0
- [x] Remove AMD dist target
- [x] Remove CommonJS dist target https://github.com/bigskysoftware/idiomorph/issues/122
- [x] Warn if duplicate ids are detected in the new content https://github.com/bigskysoftware/idiomorph/issues/141
- [x] Publish TypeScript declarations https://github.com/bigskysoftware/idiomorph/issues/152

### 0.9.0
- [ ] Plugin system? https://github.com/bigskysoftware/idiomorph/issues/109
- [ ] Settle input value semantics, and the subtree-skipping speedup they unblock https://github.com/bigskysoftware/idiomorph/issues/144
- [ ] Restore or preserve scroll state? https://github.com/bigskysoftware/idiomorph/issues/26
- [ ] Improve anonymous node matching, perhaps using Merkle trees, or fuzzy synthetic ids? https://github.com/bigskysoftware/idiomorph/issues/143
- [ ] Move idiomorph/htmx.js out of tree into an htmx extension? https://github.com/bigskysoftware/idiomorph/issues/111
- [ ] Narrow support for `newContent` types? https://github.com/bigskysoftware/idiomorph/issues/103
- [ ] Natively preserve focus, selection, scroll state by morphing around currently focused element https://github.com/bigskysoftware/idiomorph/pull/85
- [ ] Can we improve the iframe morphing situation without `moveBefore`?

### 1.0.0 (when `Element#moveBefore` is widely available)
- [ ] Remove all pre-`moveBefore` workarounds

