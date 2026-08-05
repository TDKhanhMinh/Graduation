-- Memoria UI V2 event experience settings.
-- Keep legacy theme_key/cover_path intact so existing events remain compatible.
ALTER TABLE public.events
  ADD COLUMN experience_preset text NOT NULL DEFAULT 'minimal'
    CHECK (experience_preset IN ('minimal', 'elegant', 'romantic', 'graduation', 'celebration', 'galaxy')),
  ADD COLUMN effect_intensity text NOT NULL DEFAULT 'low'
    CHECK (effect_intensity IN ('off', 'low', 'medium', 'high')),
  ADD COLUMN effect_quality text NOT NULL DEFAULT 'auto'
    CHECK (effect_quality IN ('auto', 'low', 'medium', 'high')),
  ADD COLUMN wall_layout text NOT NULL DEFAULT 'spotlight'
    CHECK (wall_layout IN ('spotlight', 'grid', 'photo-focus')),
  ADD COLUMN qr_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN qr_cta text NOT NULL DEFAULT 'Send a wish'
    CHECK (char_length(qr_cta) BETWEEN 1 AND 80),
  ADD COLUMN animation_speed text NOT NULL DEFAULT 'normal'
    CHECK (animation_speed IN ('slow', 'normal', 'fast'));
