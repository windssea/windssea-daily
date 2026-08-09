# 哈尔滨行程票务预约同步实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将哈尔滨行程页面同步为最新的返程车票和哈工大预约状态。

**Architecture:** 保持现有 React 页面与行程数据常量结构，只修改 `HarbinTripPage.tsx` 中与 G89 和哈工大预约相关的行程、预约卡片、摘要和规则文案；不改动天气接口、交互或样式。

**Tech Stack:** React、TypeScript、Vite、CSS Modules。

## Global Constraints

- 既有行程日期、景点顺序、已购 Z366/D552/G142 状态和页面交互保持不变。
- G89 标记为已购票，路线为沈阳北→南京；不要保留 G98/G99 作为本次返程主方案。
- 哈工大预约标记为已完成，预约时段明确写为 12:00—14:30。
- 不修改无关的用户工作区文件。

---

### Task 1: 同步哈尔滨页面的车票与预约信息

**Files:**
- Modify: `src/client/pages/HarbinTripPage.tsx`

**Interfaces:**
- Consume: 现有 `ITINERARY`、`RESERVATIONS`、`TIPS`、hero 摘要和全程规则文案。
- Produce: 页面中 G89 和哈工大预约状态的一致展示。

- [ ] 更新 D8 返程行程为沈阳北到南京的 G89 已购票信息，并保留票面复核提醒。
- [ ] 更新预约栏中的 G89 卡片为已购票状态，并移除过时的 G98/G99 待抢票表述。
- [ ] 更新 D2 哈工大校园/航天馆安排，明确预约已完成、时段为 12:00—14:30。
- [ ] 更新哈工大预约卡片、首页提示、规则和证件清单中的状态文案。

### Task 2: 验证并推送

**Files:**
- Verify: `src/client/pages/HarbinTripPage.tsx`
- Verify: `docs/superpowers/plans/2026-08-09-harbin-booking-sync.md`

- [ ] 运行 TypeScript 检查和 Vite 构建。
- [ ] 检查 diff，确认只包含本次计划与哈尔滨页面更新，不覆盖既有用户改动。
- [ ] 提交并推送到当前 `main` 分支。
