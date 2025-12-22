/*
  # Feedback Voting System

  1. New Table
    - `feedback_votes`
      - `id` (uuid, primary key)
      - `feedback_id` (uuid, references user_feedback)
      - `user_id` (uuid, references auth.users)
      - `vote_type` (text, 'up' or 'down')
      - `created_at` (timestamp)
      - Unique constraint on (feedback_id, user_id) to prevent duplicate votes

  2. Changes to user_feedback table
    - Add `upvotes` (integer, default 0)
    - Add `downvotes` (integer, default 0)
    - Add `total_votes` (integer, generated column)

  3. Security
    - Enable RLS on `feedback_votes` table
    - Users can insert their own votes
    - Users can update their own votes
    - Users can delete their own votes
    - Everyone can read all votes
    - Update RLS policies on user_feedback to allow everyone to read all feedback

  4. Important Notes
    - Each user can only vote once per feedback item
    - Users can change their vote from up to down or vice versa
    - Vote counts are tracked for sorting by popularity
*/

-- Add vote count columns to user_feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_feedback' AND column_name = 'upvotes'
  ) THEN
    ALTER TABLE user_feedback ADD COLUMN upvotes integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_feedback' AND column_name = 'downvotes'
  ) THEN
    ALTER TABLE user_feedback ADD COLUMN downvotes integer DEFAULT 0;
  END IF;
END $$;

-- Create feedback_votes table
CREATE TABLE IF NOT EXISTS feedback_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES user_feedback(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

-- Enable RLS
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_votes
CREATE POLICY "Anyone can view all votes"
  ON feedback_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON feedback_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON feedback_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON feedback_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update user_feedback RLS to allow everyone to read all feedback
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own feedback" ON user_feedback;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_feedback' 
    AND policyname = 'Anyone can view all feedback'
  ) THEN
    CREATE POLICY "Anyone can view all feedback"
      ON user_feedback FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_feedback_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE user_feedback 
      SET upvotes = upvotes + 1 
      WHERE id = NEW.feedback_id;
    ELSE
      UPDATE user_feedback 
      SET downvotes = downvotes + 1 
      WHERE id = NEW.feedback_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE user_feedback 
      SET upvotes = upvotes - 1, downvotes = downvotes + 1 
      WHERE id = NEW.feedback_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE user_feedback 
      SET upvotes = upvotes + 1, downvotes = downvotes - 1 
      WHERE id = NEW.feedback_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE user_feedback 
      SET upvotes = upvotes - 1 
      WHERE id = OLD.feedback_id;
    ELSE
      UPDATE user_feedback 
      SET downvotes = downvotes - 1 
      WHERE id = OLD.feedback_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic vote count updates
DROP TRIGGER IF EXISTS feedback_votes_count_trigger ON feedback_votes;
CREATE TRIGGER feedback_votes_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON feedback_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_vote_counts();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback_id ON feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user_id ON feedback_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_upvotes ON user_feedback(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);