-- =====================================================================
-- Migration: Admin panel theme preference
-- Date: 2026-04-14
-- Run from Supabase Dashboard → SQL Editor
-- =====================================================================

-- Valid values: 'light' (default), 'dark'
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS admin_theme TEXT DEFAULT 'light';
