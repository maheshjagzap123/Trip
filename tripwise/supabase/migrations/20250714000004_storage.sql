-- ============================================================
-- Storage Buckets and Policies
-- ============================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('avatars', 'avatars', true, 5242880),           -- 5MB, public read
  ('trip-covers', 'trip-covers', true, 10485760),  -- 10MB, public read
  ('trip-media', 'trip-media', false, 52428800),   -- 50MB, private
  ('documents', 'documents', false, 20971520),     -- 20MB, private
  ('receipts', 'receipts', false, 10485760)        -- 10MB, private
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- AVATARS (public read, owner write)
-- ============================================================

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- TRIP COVERS (public read, trip members write)
-- ============================================================

CREATE POLICY "Anyone can view trip covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-covers');

CREATE POLICY "Trip members can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-covers'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- TRIP MEDIA (trip members only)
-- ============================================================

CREATE POLICY "Trip members can view media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'trip-media'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Trip members can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-media'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete their own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'trip-media'
    AND owner_id = auth.uid()::text
  );

-- ============================================================
-- DOCUMENTS (trip members only)
-- ============================================================

CREATE POLICY "Trip members can view documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Trip members can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================
-- RECEIPTS (trip members only)
-- ============================================================

CREATE POLICY "Trip members can view receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Trip members can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT trip_id FROM public.trip_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
