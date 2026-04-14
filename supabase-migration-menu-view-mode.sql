-- =====================================================================
-- Migration: Restaurant-level menu view mode preference
-- Date: 2026-04-14
-- Run from Supabase Dashboard → SQL Editor
-- =====================================================================

-- Valid values: 'categories' (default), 'grid', 'list'
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS menu_view_mode TEXT DEFAULT 'categories';
