-- Extend feedback table to support 'bildir' (notify/report) entries:
-- - rating becomes nullable so non-rating messages can be stored alongside ratings
-- - source distinguishes 'rating' (existing star feedback) from 'bildir' (minimal contact form)
-- - customer_phone added for optional callback contact

-- 1) Allow NULL ratings (for bildir entries)
ALTER TABLE feedback ALTER COLUMN rating DROP NOT NULL;

-- 2) Replace rating range CHECK to allow NULL
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_rating_check;
ALTER TABLE feedback
  ADD CONSTRAINT feedback_rating_check
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- 3) Add source column ('rating' for existing FeedbackModal, 'bildir' for the minimal form)
ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'rating';

ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_source_check;
ALTER TABLE feedback
  ADD CONSTRAINT feedback_source_check
  CHECK (source IN ('rating', 'bildir'));

-- 4) Add customer_phone column (optional contact for bildir entries)
ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';

COMMENT ON COLUMN feedback.source IS
  'Origin of the feedback entry: ''rating'' (5-star FeedbackModal) or ''bildir'' (minimal report form, no rating).';
COMMENT ON COLUMN feedback.customer_phone IS
  'Optional phone number for callback. Populated by bildir form; rating form leaves empty.';
