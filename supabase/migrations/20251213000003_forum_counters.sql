-- Community Forum counters + reputation maintenance (threads/posts/interactions)
-- Depends on tables from 20251207000010_community_forum.sql
-- Idempotent and safe to re-run.

CREATE OR REPLACE FUNCTION public.forum_reputation_ensure(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO forum_user_reputation (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.forum_reputation_recompute_level(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pts integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(reputation_points, 0) INTO pts
  FROM forum_user_reputation
  WHERE user_id = p_user_id;

  UPDATE forum_user_reputation
  SET level = GREATEST(1, FLOOR(pts / 100.0)::int + 1),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Threads: update category counters + author reputation
CREATE OR REPLACE FUNCTION public.forum_threads_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE forum_categories
  SET thread_count = COALESCE(thread_count, 0) + 1,
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.category_id;

  PERFORM public.forum_reputation_ensure(NEW.user_id);
  UPDATE forum_user_reputation
  SET thread_count = COALESCE(thread_count, 0) + 1,
      reputation_points = COALESCE(reputation_points, 0) + 5,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;

  PERFORM public.forum_reputation_recompute_level(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_threads_after_insert ON forum_threads;
CREATE TRIGGER trg_forum_threads_after_insert
AFTER INSERT ON forum_threads
FOR EACH ROW
EXECUTE FUNCTION public.forum_threads_after_insert();

-- Posts: update thread + category counters + author reputation
CREATE OR REPLACE FUNCTION public.forum_posts_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat_id uuid;
BEGIN
  SELECT category_id INTO cat_id FROM forum_threads WHERE id = NEW.thread_id;

  UPDATE forum_threads
  SET reply_count = COALESCE(reply_count, 0) + 1,
      last_reply_at = NOW(),
      last_reply_by = NEW.user_id,
      updated_at = NOW()
  WHERE id = NEW.thread_id;

  UPDATE forum_categories
  SET post_count = COALESCE(post_count, 0) + 1,
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE id = cat_id;

  PERFORM public.forum_reputation_ensure(NEW.user_id);
  UPDATE forum_user_reputation
  SET post_count = COALESCE(post_count, 0) + 1,
      reputation_points = COALESCE(reputation_points, 0) + 2,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;

  PERFORM public.forum_reputation_recompute_level(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_posts_after_insert ON forum_posts;
CREATE TRIGGER trg_forum_posts_after_insert
AFTER INSERT ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION public.forum_posts_after_insert();

-- Interactions: update like/helpful counts + recipient reputation
CREATE OR REPLACE FUNCTION public.forum_interactions_apply_delta(p_content_type text, p_content_id uuid, p_interaction_type text, p_delta int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
BEGIN
  IF p_delta = 0 THEN
    RETURN;
  END IF;

  IF p_interaction_type = 'like' THEN
    IF p_content_type = 'thread' THEN
      UPDATE forum_threads
      SET like_count = GREATEST(0, COALESCE(like_count, 0) + p_delta),
          updated_at = NOW()
      WHERE id = p_content_id;
    ELSIF p_content_type = 'post' THEN
      UPDATE forum_posts
      SET like_count = GREATEST(0, COALESCE(like_count, 0) + p_delta),
          updated_at = NOW()
      WHERE id = p_content_id;
    END IF;
  ELSIF p_interaction_type = 'helpful' THEN
    IF p_content_type = 'thread' THEN
      UPDATE forum_threads
      SET helpful_count = GREATEST(0, COALESCE(helpful_count, 0) + p_delta),
          updated_at = NOW()
      WHERE id = p_content_id;
      SELECT user_id INTO target_user FROM forum_threads WHERE id = p_content_id;
    ELSIF p_content_type = 'post' THEN
      UPDATE forum_posts
      SET helpful_count = GREATEST(0, COALESCE(helpful_count, 0) + p_delta),
          updated_at = NOW()
      WHERE id = p_content_id;
      SELECT user_id INTO target_user FROM forum_posts WHERE id = p_content_id;
    END IF;

    IF target_user IS NOT NULL THEN
      PERFORM public.forum_reputation_ensure(target_user);
      UPDATE forum_user_reputation
      SET helpful_marks_received = GREATEST(0, COALESCE(helpful_marks_received, 0) + p_delta),
          reputation_points = GREATEST(0, COALESCE(reputation_points, 0) + p_delta),
          updated_at = NOW()
      WHERE user_id = target_user;
      PERFORM public.forum_reputation_recompute_level(target_user);
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.forum_interactions_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.forum_interactions_apply_delta(NEW.content_type, NEW.content_id, NEW.interaction_type, 1);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.forum_interactions_after_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.forum_interactions_apply_delta(OLD.content_type, OLD.content_id, OLD.interaction_type, -1);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_interactions_after_insert ON forum_interactions;
CREATE TRIGGER trg_forum_interactions_after_insert
AFTER INSERT ON forum_interactions
FOR EACH ROW
EXECUTE FUNCTION public.forum_interactions_after_insert();

DROP TRIGGER IF EXISTS trg_forum_interactions_after_delete ON forum_interactions;
CREATE TRIGGER trg_forum_interactions_after_delete
AFTER DELETE ON forum_interactions
FOR EACH ROW
EXECUTE FUNCTION public.forum_interactions_after_delete();

