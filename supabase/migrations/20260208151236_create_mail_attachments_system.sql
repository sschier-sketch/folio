/*
  # Create mail attachments system

  1. New Tables
    - `mail_attachments`
      - `id` (uuid, primary key)
      - `message_id` (uuid, FK to mail_messages) - the message this attachment belongs to
      - `user_id` (uuid, FK to auth.users) - the mailbox owner
      - `filename` (text) - original filename
      - `content_type` (text) - MIME type (e.g. image/png, application/pdf)
      - `file_size` (integer) - size in bytes
      - `storage_path` (text) - path in Supabase Storage bucket
      - `resend_attachment_id` (text) - original Resend attachment ID
      - `created_at` (timestamptz)

  2. New Storage Bucket
    - `mail-attachments` - private bucket for storing email attachments

  3. Security
    - Enable RLS on `mail_attachments` table
    - Users can only read their own attachments
    - Only service role can insert (via edge function)
    - Storage policies: users can read their own files

  4. Indexes
    - Index on `message_id` for fast lookups when loading a thread
    - Index on `user_id` for RLS performance
*/

CREATE TABLE IF NOT EXISTS mail_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES mail_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL DEFAULT '',
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  file_size integer NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  resend_attachment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mail_attachments_message_id ON mail_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_mail_attachments_user_id ON mail_attachments(user_id);

ALTER TABLE mail_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attachments"
  ON mail_attachments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('mail-attachments', 'mail-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own mail attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'mail-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
