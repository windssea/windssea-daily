# Final Northeast Trip Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize the Harbin/Northeast family itinerary page with `C:\Users\windssea\Downloads\2026东北亲子游_长白山2晚_最终优化版(1).md` without changing the existing React architecture or weather API.

**Architecture:** Keep all trip content in the existing typed constants inside `HarbinTripPage.tsx`; keep rendering, accordion behavior, navigation, and weather fallback logic intact. Update only the data and small presentation rules needed for the revised two-night Changbaishan stay, August 19 transfer options, new August 20 Shenyang day, and related reservation/hotel/tips summaries.

**Tech Stack:** React 19, TypeScript, Vite, CSS Modules, existing Hono weather API.

## Global Constraints

- Follow the latest Markdown itinerary as the content source of truth.
- Preserve the D0–D9 structure, current interactive timeline, sticky date navigation, hotel map links, and weather fallback behavior.
- Keep `G142` as the August 19 first choice and `G8136` as the fallback; do not show obsolete `G3554` content.
- Reflect that Changbaishan has no complete backup day: D4 is the sole core scenic-area day and D5 transfers to Shenyang.
- Do not add dependencies or modify unrelated untracked user files.

### Task 1: Replace itinerary data with the final document timeline

**Files:**
- Modify: `src/client/pages/HarbinTripPage.tsx:149-318`

**Interfaces:**
- Consume: existing `DayData`, `TimelineEntry`, `WeatherFallback`, `DecisionTone`, and `DAYS` types.
- Produce: a D0–D9 `ITINERARY` whose dates, titles, times, transport, decisions, and sights match the final Markdown.

- [ ] Update `DAYS` labels so D5 is `转沈阳` and D6 is `沈飞/北陵`.
- [ ] Align D0–D4 entries with the final times, including D1's separate transfer/check-in window, D2's early departure, D3's 08:05 checkout and 20:00 hotel transfer, and D4's 06:30 start plus 08:20 scenic-area handoff.
- [ ] Replace D5's weather-backup itinerary with `二道白河→沈阳`, adding G142/G8136 branch details and a decision card explaining the single-choice ticket strategy.
- [ ] Replace the old D6 G3554 transfer with D6 `沈飞航空博览园＋北陵公园`, including both places as expandable sights and making Qing Zhaoling optional by stamina.
- [ ] Update D7–D9 titles, times, optional activities, and return-journey copy to the final document.
- [ ] Set D4's decision copy to the only core Changbaishan weather-sensitive day and remove the obsolete D5 re-entry/backup-day decision.

### Task 2: Synchronize overview, reservations, hotels, and practical tips

**Files:**
- Modify: `src/client/pages/HarbinTripPage.tsx:320-345`
- Modify: `src/client/pages/HarbinTripPage.tsx:506-523`

**Interfaces:**
- Consume: existing `ReservationItem`, `HotelData`, `TIPS`, hero and overview renderers.
- Produce: summary cards that expose the final document's ticket and booking checkpoints without stale `G3554`, three-night Changbaishan lodging, or `天气备用日` wording.

- [ ] Replace the G3554 reservation item with `G142 / G8136`, dated August 5 at 16:30, with G142 first choice and G8136 fallback.
- [ ] Change the return reservation summary to `G98` and add the most important Shenyang venue booking checkpoint without overcrowding the rail.
- [ ] Change hotels to D3–D4 in Erdao Baihe and D5–D8 in Shenyang; update descriptions for the revised checkout and station access.
- [ ] Update the hero alert, fourth statistic, and final tips to say D4 is the only core scenic day and D5 has a transfer-risk tradeoff rather than a full weather backup day.
- [ ] Keep the existing actual booked status for Z366/D552 unless the final document explicitly contradicts it; use “参考/首选/保底” for the not-yet-confirmed trains.

### Task 3: Make the revised content resilient in the existing layout

**Files:**
- Modify: `src/client/pages/HarbinTripPage.module.css` only if verification shows new transport labels or sight details overflow at 320px–760px.

**Interfaces:**
- Consume: existing CSS Modules class names and responsive breakpoints.
- Produce: no horizontal overflow, readable multi-line transport metadata, and intact 44px touch targets.

- [ ] First verify the new data with the current CSS at desktop and mobile widths.
- [ ] If needed, adjust only wrapping/spacing rules for `.dayMeta`, `.reservationCard`, `.heroStat`, or timeline text; do not redesign the page or add a new layout system.
- [ ] Preserve reduced-motion behavior and focus/hover states.

### Task 4: Verify the implementation before handoff

**Files:**
- Verify: `src/client/pages/HarbinTripPage.tsx`
- Verify: `src/client/pages/HarbinTripPage.module.css`

**Interfaces:**
- Consume: final source data and rendered local route `http://127.0.0.1:5173/#harbin`.
- Produce: compiler/build evidence and a visual/interactive checklist.

- [ ] Run `node node_modules/typescript/bin/tsc --noEmit` and confirm exit code 0.
- [ ] Run `node node_modules/vite/bin/vite.js build` and confirm exit code 0.
- [ ] Open/reload `http://127.0.0.1:5173/#harbin` and confirm the hero, D5 G142/G8136 card, D6 aircraft/Northern Tomb cards, D4 weather decision, and D9 return timeline are visible.
- [ ] Check one revised expandable sight card and one bottom navigation jump; inspect console logs for errors.
- [ ] Review the diff and confirm no unrelated files were modified.
