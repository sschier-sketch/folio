/*
  # Fix Feedback Voting Logic

  1. Changes
    - Fix trigger function to return correct value on DELETE
    - Add net_votes column for proper sorting
    - Update trigger to maintain net_votes
    
  2. Notes
    - The trigger was returning NEW on DELETE, which is incorrect
    - Net votes (upvotes - downvotes) should be used for "top" sorting
*/

-- Add net_votes column to user_feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_feedback' AND column_name = 'net_votes'
  ) THEN
    ALTER TABLE user_feedback ADD COLUMN net_votes integer DEFAULT 0;
  END IF;
END $$;

-- Update existing records to calculate net_votes
UPDATE user_feedback
SET net_votes = upvotes - downvotes
WHERE net_votes IS NULL OR net_votes = 0;

-- Fix the trigger function to return correct values and update net_votes
CREATE OR REPLACE FUNCTION update_feedback_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE user_feedback 
      SET upvotes = upvotes + 1,
          net_votes = net_votes + 1
      WHERE id = NEW.feedback_id;
    ELSE
      UPDATE user_feedback 
      SET downvotes = downvotes + 1,
          net_votes = net_votes - 1
      WHERE id = NEW.feedback_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE user_feedback 
      SET upvotes = upvotes - 1, 
          downvotes = downvotes + 1,
          net_votes = net_votes - 2
      WHERE id = NEW.feedback_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE user_feedback 
      SET upvotes = upvotes + 1, 
          downvotes = downvotes - 1,
          net_votes = net_votes + 2
      WHERE id = NEW.feedback_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE user_feedback 
      SET upvotes = upvotes - 1,
          net_votes = net_votes - 1
      WHERE id = OLD.feedback_id;
    ELSE
      UPDATE user_feedback 
      SET downvotes = downvotes - 1,
          net_votes = net_votes + 1
      WHERE id = OLD.feedback_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for net_votes for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_net_votes ON user_feedback(net_votes DESC);
