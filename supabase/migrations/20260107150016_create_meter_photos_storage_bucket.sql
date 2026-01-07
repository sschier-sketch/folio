/*
  # Storage Bucket für Zählerfotos

  1. Neuer Bucket
    - `meter-photos` - Bucket für Zählerstand-Fotos
  
  2. Sicherheit
    - Benutzer können eigene Fotos hochladen
    - Benutzer können eigene Fotos lesen
    - Benutzer können eigene Fotos löschen
*/

-- Create storage bucket for meter photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meter-photos', 'meter-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for meter-photos bucket
CREATE POLICY "Users can upload meter photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'meter-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view meter photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'meter-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete meter photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'meter-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view meter photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'meter-photos');