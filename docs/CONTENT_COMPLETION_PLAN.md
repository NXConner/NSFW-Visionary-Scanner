---
title: Content Completion Plan
project: MorphoScan Pro
updated: 2026-02-02
---

# Content Completion Plan

## Objectives
- Remove all placeholder and mock runtime data from the app UI.
- Populate missing content with real, production-ready data.
- Ensure content is stored in Supabase tables and surfaced by existing UI components.
- Provide a repeatable, auditable workflow for content creation and review.

## Scope (High Priority)
1. Expert Directory and Consultations
2. Learning Courses, Modules, Lessons, and Quizzes
3. AI Chat and Support Guidance
4. Video Capture Sessions (real session records)
5. Webhooks and API configuration examples
6. Product copy for landing, onboarding, and feature descriptions

## Content Sources (Real Data Only)
- Clinical advisory guidelines and evidence-informed education summaries.
- PE safety checklists, pelvic floor routines, and recovery protocols.
- Measurement standards and progress tracking templates.
- Support playbooks for account, privacy, and subscription questions.
- Verified advisory team profiles and published educational resources.

## Data Model Mapping
| Content Area | Supabase Tables | Notes |
| --- | --- | --- |
| Expert Directory | `expert_profiles`, `expert_articles`, `expert_videos` | Publish verified experts only |
| Learning | `learning_courses`, `learning_modules`, `learning_lessons`, `learning_quizzes` | Ensure `is_published = true` |
| Q&A | `expert_questions` | Publish answered questions |
| Research Updates | `expert_articles` | Use categories and tags for filtering |
| Support Guidance | `support_chat_quick_responses` | Non-staff responses only |
| Video Sessions | `multi_camera_sessions`, `video_recordings` | Session data created by user actions |

## Execution Plan

### 1) Inventory and Audit (Day 0)
- Scan UI for "coming soon", placeholder, and mock data.
- Identify components that still render hard-coded arrays or placeholder text.
- Map each placeholder to its target data source and ownership.

### 2) Populate Expert Directory (Day 1)
- Create verified expert profiles (real advisory team members only).
- Add specialties aligned with sexual wellness support:
  - PE safety and recovery
  - Pelvic floor training
  - Progress tracking and measurement
  - Communication and consent guidance
- Publish at least 3 expert profiles and 6 short articles.

### 3) Build the Learning Library (Day 1-2)
- Create a baseline curriculum:
  - Course: "PE Foundations & Safety"
  - Course: "Peyronie's & Curvature Care"
  - Course: "Pelvic Floor & EQ Optimization"
  - Course: "Measurement & Progress Tracking"
- For each course:
  - 3 modules
  - 3 lessons per module
  - At least one quiz per course
- Ensure lessons include safety checklists and recovery guidance.

### 4) AI Guidance and Support (Day 2)
- Curate support chat quick responses for common app issues.
- Align AI prompts with sexual wellness education and safety constraints.
- Validate that AI chat is only enabled where policy allows.

### 5) Replace UI Placeholders (Day 2)
- Remove mock data arrays in UI components.
- Replace "coming soon" empty states with real, actionable content.
- Ensure empty states explain how to publish content (admin guidance only).

### 6) Validation and QA (Day 2-3)
- Verify all content renders without placeholders.
- Run lint and tests for modified files.
- Confirm that content loads from Supabase in dev and prod.

## Acceptance Criteria
- No runtime mock data in UI components.
- No "coming soon" or placeholder text in production views.
- All learning and expert pages display real content from Supabase.
- Empty states provide clear next actions (admin guidance only).
- Content changes are documented and repeatable.

## Content Governance
- Assign content owners for each domain:
  - Learning: Clinical advisory lead
  - Experts: Medical advisory coordinator
  - Support: Customer success
- Require review and approval before publishing.
- Maintain versioned changelog for curriculum updates.
