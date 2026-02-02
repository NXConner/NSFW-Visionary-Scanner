# NSFW Completion Plan & Status
**Last updated**: 2026-02-02  
**Owner**: autonomous agent  
**Scope**: All NSFW/adult features, pipelines, and store-safety separation.

## Status Legend
- **Not Started**
- **In Progress**
- **Blocked**
- **Done**

## Execution Rules (always-on)
1. **SFW build must exclude all NSFW assets, strings, routes, and bundles.**
2. **NSFW data access only via entitlements + RLS + signed URLs.**
3. **No mock/fake data in dev/prod. Use licensed or user-provided content.**
4. **Feature flags on all new NSFW surfaces.**
5. **Atomic commits per phase + pre-test push.**

---

## Phase Roadmap (structured, efficient)
| Phase | Goal | Dependencies | Status | Key Deliverables |
| --- | --- | --- | --- | --- |
| P0 | Store-safety separation + gating | None | Done | Build-time gating tests, no NSFW bundles in SFW, entitlement checks |
| P1 | Media storage + upload foundation | P0 | Done | NSFW buckets, signed URLs, upload UI, content lifecycle rules |
| P2 | Video pipeline (record, upload, playback, edit) | P1 | Done | MediaRecorder, chunk upload, merge, player, editing backend |
| P3 | Seductive AI chat backend | P0 | Done | Edge function, provider integration, prompts, memory, safety, throttling |
| P4 | Advanced NSFW features completion | P1, P2 | Not Started | Multi-cam, screenshots, dates media, positions seed |
| P5 | NSFW content pipelines + admin tools | P1 | Not Started | Topics import, moderation tools, rating tiers |
| P6 | Privacy/consent hardening | P0 | Not Started | Session lock, incognito/redaction, policy block UX |
| P7 | DLC/addon productionization | P0 | Not Started | Registry UI, versioning, catalog validation |
| P8 | Testing + QA + perf | P0-P7 | Not Started | Unit/integration/E2E/perf coverage for NSFW flows |
| P9 | Content production + licensing | P1 | Not Started | Licensed media library, expert content, compliance checks |

---

## P0 — Store-Safety Separation + Gating
**Status**: Done

- [x] Build-time gating: exclude NSFW routes/components from SFW bundles
- [x] Add test to fail if NSFW strings/assets appear in SFW build
- [x] Enforce entitlement checks in all NSFW edge functions
- [x] Ensure NSFW buckets are private + signed URLs only
- [x] Verify SFW build uses store-safe assets only

**Files to update**
- `src/lib/featureFlags.ts`
- `src/lib/buildFlags.ts`
- `docs/guides/deployment/SFW_NSFW_RELEASE_OPTIONS.md`
- `src/lib/visualContentManager.ts`
- `src/lib/__tests__/*` (new gating tests)

---

## P1 — Media Storage + Upload Foundation
**Status**: Done

- [x] Storage buckets: `nsfw-content`, `videos`, `screenshots`, `recordings`
- [x] Signed URL helpers (read/write)
- [x] Upload UI components + progress
- [x] Content lifecycle rules (expiry, revocation, re-signing)
- [x] Access auditing for downloads

**Files to update**
- `supabase/migrations/20251223130000_nsfw_content_storage_bucket.sql`
- `src/lib/mediaUpload.ts`
- `src/lib/nsfwVideoDelivery.ts`
- `src/components/nsfwVideoContent/*`

---

## P2 — Video Pipeline (Record, Upload, Playback, Edit)
**Status**: Done

- [x] MediaRecorder-based recording (web + Capacitor)
- [x] Chunked upload + merge (`merge-video-chunks`)
- [x] Video player with signed URL refresh
- [x] Offline downloads with caps + expiry
- [x] Editing backend (FFmpeg or server-side pipeline)
- [x] Screenshot capture + thumbnailing

**Files to update**
- `src/components/nsfwAdvancedFeatures/tabs/RecordingTab.tsx`
- `supabase/functions/merge-video-chunks/index.ts`
- `supabase/functions/video-editing/index.ts`
- `src/lib/nsfwVideoDownloads.ts`
- `src/lib/nsfwVideoContent.ts`

---

## P3 — Seductive AI Chat Backend
**Status**: Done

- [x] Implement `seductive-ai-chat` edge function
- [x] Provider integration (OpenAI/Anthropic/custom)
- [x] Prompt library by personality + intensity
- [x] Context retrieval + memory window
- [x] Safety filters + abuse throttling

**Files to update**
- `supabase/functions/seductive-ai-chat/index.ts`
- `src/lib/nsfwAdvancedFeatures/seductiveAI.ts`
- `src/components/nsfwAdvancedFeatures/tabs/AIChatTab.tsx`

---

## P4 — Advanced NSFW Features Completion
**Status**: Not Started

- [ ] Multi-camera recording backend + partner sync
- [ ] Video screenshots UI + storage
- [ ] Intimate dates: voice recording + media upload
- [ ] Positions library: seed data + media + search + detail view

**Files to update**
- `src/lib/nsfwAdvancedFeatures/multiCamera.ts`
- `src/lib/nsfwAdvancedFeatures/dateProposals.ts`
- `src/components/nsfwAdvancedFeatures/*`
- `src/data/nsfwPositions/*`

---

## P5 — NSFW Content Pipelines + Admin Tools
**Status**: Not Started

- [ ] Topics import: dry-run, validation, rollback
- [ ] Rating tiers (`educational`, `demonstrative`, `explicit`)
- [ ] Forum moderation tools + queues
- [ ] Creator verification + takedown flow

**Files to update**
- `src/components/dlc/admin/DLCContentImport.tsx`
- `src/components/admin/nsfw/*`
- `supabase/functions/admin-import-dlc-content/index.ts`

---

## P6 — Privacy/Consent Hardening
**Status**: Not Started

- [ ] Session lock: inactivity, background lock
- [ ] Biometric enforcement if available
- [ ] Incognito/redaction across all NSFW surfaces
- [ ] Policy block UX + audit log entry
- [ ] Panic exit + safe notifications

**Files to update**
- `src/lib/nsfwSessionLock.ts`
- `src/components/nsfw/NsfwSessionGate.tsx`
- `src/components/settings/panels/NsfwPrivacyControlsCard.tsx`
- `src/components/nsfwDashboard/NSFWDashboard.tsx`
- `supabase/functions/send-email/index.ts`
- `supabase/functions/send-push-notification/index.ts`

---

## P7 — DLC/Add-on Productionization
**Status**: Not Started

- [ ] Addon manifest versioning + compatibility matrix
- [ ] Admin registry UI for addon status
- [ ] DB vs code registry validation script

**Files to update**
- `src/addons/*`
- `src/pages/AdminDLC.tsx`
- `scripts/validate-dlc-catalog.ts`
- `scripts/validate-dlc-import.ts`

---

## P8 — Testing + QA + Performance
**Status**: Not Started

- [ ] Unit tests for NSFW privacy + gating
- [ ] Integration tests for signed URL flows
- [ ] E2E tests for NSFW gating + session lock
- [ ] Perf/load tests for media endpoints

**Files to update**
- `src/components/__tests__/*`
- `e2e/*`
- `performance-tests/load-test.js`

---

## P9 — Content Production + Licensing
**Status**: Not Started

- [ ] Licensed NSFW video library (rights cleared)
- [ ] Positions media library (rights cleared)
- [ ] Expert content: profiles, articles, videos
- [ ] Topics library with tiered ratings
- [ ] Compliance review for all content

**Note**: No placeholder content in dev/prod. Use licensed or user-provided assets only.

---

## Open Decisions (compare approaches)

### NSFW On-device Classifier
| Option | Pros | Cons | Status |
| --- | --- | --- | --- |
| A: Known-good npm model | Quick, local inference | Bundle size, model quality | Not Started |
| B: Bundled weights | Offline, deterministic | App size, maintenance | Not Started |
| C: Server-side inference | Smaller client, centralized updates | Privacy + latency | Not Started |

### Video Processing
| Option | Pros | Cons | Status |
| --- | --- | --- | --- |
| Client-side only | Minimal infra | Device limits, inconsistent | Not Started |
| Edge function (FFmpeg) | Standardized outputs | Compute cost, cold starts | Not Started |
| Hybrid (client + server) | Best UX | More complexity | Not Started |

### AI Provider
| Option | Pros | Cons | Status |
| --- | --- | --- | --- |
| OpenAI | Strong quality | Cost + policy constraints | Not Started |
| Anthropic | Strong safety | Cost + latency | Not Started |
| Custom model | Control | High ops burden | Not Started |

---

## Content Backlog (creation required)
| Content Type | Source | Status | Notes |
| --- | --- | --- | --- |
| NSFW video library | Licensed partners | Not Started | Must include model releases |
| Positions media | Licensed sets | Not Started | Match `sex_positions_library` IDs |
| Expert articles | Contracted experts | Not Started | Review by legal/compliance |
| Expert videos | Contracted experts | Not Started | Caption + transcript required |
| Topics library | Curated editorial | Not Started | Tiered ratings required |

---

## Status Update Log
- 2026-02-02: Plan created. All phases Not Started.
- 2026-02-02: P0 completed (gating + SFW bundle verification + entitlements).
- 2026-02-02: P1 completed (signed URLs, storage, auditing, upload UI).
- 2026-02-02: P2 completed (recording/upload/playback/edit pipeline).
- 2026-02-02: P3 completed (provider integration, prompts, memory, safety, throttling).
