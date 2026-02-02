-- Migration: Seed educational Topics Library content (non-explicit)
-- Purpose:
-- - Provide real, non-explicit educational entries so Topic Packs have usable content immediately.
-- - Content remains 18+ gated by the existing age verification + DLC entitlements.
-- - Idempotent: keyed by source_import_key.

-- Ensure canonical topics exist (safe to re-run; aligns to 20251220120000 migration)
INSERT INTO public.nsfw_topics (topic_id, display_name, description, requires_feature_id, sort_order, is_active, content_rating)
SELECT *
FROM (VALUES
  ('power_dynamics', 'Power Dynamics', 'Consent-focused power dynamics, communication, and safety-first guidance.', 'topic_power_dynamics', 10, true, '18+'),
  ('tantric', 'Tantric & Mindful Intimacy', 'Mindfulness, breathwork, connection, and slow intimacy practices.', 'topic_tantric', 20, true, '18+'),
  ('kama_sutra', 'Classic Texts & Positions', 'Classic position reference and historical context (adult).', 'topic_kama_sutra', 30, true, '18+'),
  ('roleplay', 'Roleplay & Fantasy', 'Communication, boundaries, and scenarios for consensual roleplay.', 'topic_roleplay', 40, true, '18+'),
  ('male_pleasure', 'Male Pleasure & Pelvic Health', 'Adult techniques with anatomy/safety framing; pelvic floor and prostate education.', 'topic_male_pleasure', 50, true, '18+')
) AS t(topic_id, display_name, description, requires_feature_id, sort_order, is_active, content_rating)
WHERE public.is_nsfw_enabled()
ON CONFLICT (topic_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  requires_feature_id = EXCLUDED.requires_feature_id,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  content_rating = EXCLUDED.content_rating,
  updated_at = now();

-- Seed a starter library of educational (non-explicit) items per topic
WITH items AS (
  SELECT * FROM (VALUES
    -- Power dynamics (consent-forward)
    ('power_dynamics', 'Consent & boundaries basics', 'A practical, non-judgmental checklist for negotiating boundaries.', 'Focus: clear consent, boundaries, and aftercare planning. Use it before any power-play scenarios: define limits, safe word/signals, and check-in cadence.', '[{"label":"Planned Parenthood — Consent","url":"https://www.plannedparenthood.org/learn/relationships/sexual-consent"},{"label":"RAINN — Consent","url":"https://www.rainn.org/articles/what-is-consent"}]'::jsonb, ARRAY['consent','boundaries','communication'], 'educational', 'topic_power_dynamics', true, true, 'seed:power_dynamics:consent-basics'),
    ('power_dynamics', 'Aftercare: what it is and why it matters', 'A short guide to aftercare and emotional safety.', 'Aftercare supports emotional regulation and trust. Agree on aftercare needs in advance (water, warmth, quiet time, reassurance) and revisit what worked after.', '[{"label":"Planned Parenthood — Healthy relationships","url":"https://www.plannedparenthood.org/learn/relationships"}]'::jsonb, ARRAY['aftercare','safety','trust'], 'educational', 'topic_power_dynamics', true, true, 'seed:power_dynamics:aftercare'),
    ('power_dynamics', 'Creating a check-in routine', 'How to build a simple pre/during/post check-in structure.', 'Use short check-ins: before (expectations), during (comfort), after (debrief). Track agreed signals and keep them consistent across sessions.', '[]'::jsonb, ARRAY['check-in','communication'], 'educational', 'topic_power_dynamics', true, true, 'seed:power_dynamics:checkins'),

    -- Tantric
    ('tantric', 'Breath & grounding for connection', 'A gentle routine to reduce anxiety and build presence.', 'Practice box breathing (4–4–4–4) for 2–3 minutes, then a body scan. Aim for calm, not performance.', '[{"label":"NHS — Breathing exercises","url":"https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/"}]'::jsonb, ARRAY['breathwork','mindfulness','connection'], 'educational', 'topic_tantric', true, true, 'seed:tantric:breath-grounding'),
    ('tantric', 'Slow touch: communication prompts', 'Non-explicit prompts to help partners communicate preferences.', 'Use “more / less / pause” prompts and ask “how does this feel?” frequently. Agree that pausing is always okay.', '[]'::jsonb, ARRAY['touch','communication','mindful'], 'educational', 'topic_tantric', true, true, 'seed:tantric:touch-prompts'),
    ('tantric', 'Building a distraction-free environment', 'Simple environment setup tips to support focus.', 'Reduce interruptions: lighting, temperature, water nearby, and a do-not-disturb window. Treat it like a calming ritual.', '[]'::jsonb, ARRAY['environment','ritual'], 'educational', 'topic_tantric', true, true, 'seed:tantric:environment'),

    -- Classic texts & positions (contextual, non-explicit)
    ('kama_sutra', 'Classic texts: historical context (overview)', 'A high-level overview of classic intimacy texts and their cultural context.', 'These texts are historical and cultural artifacts. Use them as inspiration for connection and communication; adapt everything to modern consent and comfort.', '[]'::jsonb, ARRAY['history','culture','context'], 'educational', 'topic_kama_sutra', true, true, 'seed:kama_sutra:context'),
    ('kama_sutra', 'Safety basics: comfort and pacing', 'Non-explicit safety basics for physical comfort.', 'Prioritize comfort: slow pacing, hydration, and stopping at discomfort. Talk about what feels supportive and what doesn’t.', '[]'::jsonb, ARRAY['safety','comfort','pacing'], 'educational', 'topic_kama_sutra', true, true, 'seed:kama_sutra:safety-basics'),

    -- Roleplay (consent-forward)
    ('roleplay', 'Consent scripts for roleplay', 'Example consent language to keep scenarios comfortable.', 'Use a quick consent script: “Are you okay with X? What’s off-limits? What’s your stop signal?” Confirm that you can pause anytime.', '[]'::jsonb, ARRAY['roleplay','consent','scripts'], 'educational', 'topic_roleplay', true, true, 'seed:roleplay:consent-scripts'),
    ('roleplay', 'Setting boundaries without killing the vibe', 'How to negotiate boundaries confidently and kindly.', 'Boundaries improve trust. State boundaries in simple language, then focus on what is allowed and desired.', '[]'::jsonb, ARRAY['boundaries','negotiation'], 'educational', 'topic_roleplay', true, true, 'seed:roleplay:boundaries'),
    ('roleplay', 'After-action debrief', 'A short, practical debrief structure.', 'Debrief: what worked, what didn’t, what to repeat, what to avoid. Keep it kind and specific.', '[]'::jsonb, ARRAY['debrief','communication'], 'educational', 'topic_roleplay', true, true, 'seed:roleplay:debrief'),

    -- Male pleasure & pelvic health (educational)
    ('male_pleasure', 'Pelvic floor basics (education)', 'What the pelvic floor is and why it matters for comfort and function.', 'Pelvic floor health supports urinary control, comfort, and sexual function. If you have pain, seek professional medical advice.', '[{"label":"NHS — Pelvic floor exercises","url":"https://www.nhs.uk/common-health-questions/womens-health/what-are-pelvic-floor-exercises/"},{"label":"Cleveland Clinic — Pelvic floor","url":"https://my.clevelandclinic.org/health/body/22283-pelvic-floor"}]'::jsonb, ARRAY['pelvic-floor','education','health'], 'educational', 'topic_male_pleasure', true, true, 'seed:male_pleasure:pelvic-floor'),
    ('male_pleasure', 'When to talk to a clinician', 'Red flags and when to get medical help.', 'Seek medical help for persistent pain, bleeding, urinary symptoms, or sudden dysfunction. This app is not a substitute for professional care.', '[]'::jsonb, ARRAY['health','safety','medical'], 'educational', 'topic_male_pleasure', true, true, 'seed:male_pleasure:clinician'),
    ('male_pleasure', 'Communication: preferences and comfort', 'Non-explicit communication prompts.', 'Use “I like / I don’t like / I’m curious about” language. Comfort-first communication reduces anxiety and increases satisfaction.', '[]'::jsonb, ARRAY['communication','comfort'], 'educational', 'topic_male_pleasure', true, true, 'seed:male_pleasure:communication')
  ) AS t(
    topic_id,
    title,
    summary,
    body,
    resources,
    tags,
    content_rating,
    requires_feature_id,
    requires_dlc,
    is_active,
    source_import_key
  )
)
INSERT INTO public.nsfw_topic_library_items (
  topic_id,
  source_import_key,
  title,
  summary,
  body,
  resources,
  tags,
  content_rating,
  requires_feature_id,
  requires_dlc,
  is_active
)
SELECT
  topic_id,
  source_import_key,
  title,
  summary,
  body,
  resources,
  tags,
  content_rating,
  requires_feature_id,
  requires_dlc,
  is_active
FROM items
WHERE public.is_nsfw_enabled()
ON CONFLICT (source_import_key) WHERE source_import_key IS NOT NULL DO UPDATE SET
  topic_id = EXCLUDED.topic_id,
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  body = EXCLUDED.body,
  resources = EXCLUDED.resources,
  tags = EXCLUDED.tags,
  content_rating = EXCLUDED.content_rating,
  requires_feature_id = EXCLUDED.requires_feature_id,
  requires_dlc = EXCLUDED.requires_dlc,
  is_active = EXCLUDED.is_active,
  updated_at = now();

