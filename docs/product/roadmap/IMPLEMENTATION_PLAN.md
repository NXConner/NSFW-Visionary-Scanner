# IMPLEMENTATION PLAN (Canonical)

This repository historically accumulated multiple overlapping plans/trackers.  
To avoid drift, the **canonical merged plan** now lives at:

- `docs/product/roadmap/implementation_plan.md`

## Supporting canonical docs

- **Master**: `docs/tracking/CONSOLIDATED_DOCS_MASTER.md`
- **Roadmap**: `docs/product/roadmap/PHASE_1_ANALYSIS_STRATEGIC_ROADMAP.md`
- **NSFW/DLC hardening**: `docs/archive/nsfw/NSFW_DLC_P2_CHECKLIST.md`, `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`
- **Release QA**: `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md`

## What to do right now (execution order)

1. Populate Positions DB via **Admin → DLC → Content Import → Positions → Auto import** (start with **Dry-run ON**)
2. Verify Settings → Visual Effects by capturing a scan with a filter enabled
3. Verify navigation to **Growers vs Showers** at `/growers-vs-showers`

### Code Quality

- [ ] Add comprehensive unit tests for scanner pipeline
- [ ] Implement E2E tests with Playwright
- [ ] Document API contracts for edge functions
- [ ] Refactor large components (ScannerSection.tsx is 673 lines)

### Architecture

- [ ] Consider extracting scanner to web worker
- [ ] Evaluate React Query for server state
- [ ] Implement proper error boundaries per feature
- [ ] Add retry logic for network failures

---

## Estimated Timeline

| Phase      | Duration       | Dependencies |
| ---------- | -------------- | ------------ |
| Web Polish | 1-2 weeks      | None         |
| Android    | 2-3 weeks      | Phase 1      |
| iOS        | 2-3 weeks      | Phase 1      |
| Production | 1 week         | Phase 2 & 3  |
| **Total**  | **7-10 weeks** |              |

---

## Resources Needed

### Accounts

- Google Play Console ($25 one-time)
- Apple Developer Program ($99/year)
- App Store hosting for privacy policy

### Assets

- App icons (all platform sizes)
- Store screenshots (multiple devices)
- Feature graphics (1024x500 for Play)
- Demo videos (optional)

### Testing Devices

- Android phones (Samsung, Pixel, budget devices)
- iOS devices (iPhone, iPad)
- Various screen sizes and OS versions

---

_Last Updated: 2025-12-28_
