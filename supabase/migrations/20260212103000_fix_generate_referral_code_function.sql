-- Fix referral code generator SQL lint/runtime issue.
-- Previous function referenced generate_referral_code.code which is invalid in SQL scope.
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  generated_code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code.
    generated_code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || clock_timestamp()::TEXT)
        FROM 1 FOR 8
      )
    );

    -- Check if code exists.
    SELECT EXISTS (
      SELECT 1
      FROM public.referral_codes rc
      WHERE rc.code = generated_code
    )
    INTO exists_check;

    -- Exit loop when code is unique.
    EXIT WHEN NOT exists_check;
  END LOOP;

  RETURN generated_code;
END;
$$ LANGUAGE plpgsql;

