-- =============================================================================
-- R'SPACE — badge images for the profile Basic editor
-- =============================================================================

alter table public.badges add column image_url text not null default '';

update public.badges set image_url = 'https://placehold.co/200x200/FF4F00/111111?text=OG' where name = 'OG Badge';
update public.badges set image_url = 'https://placehold.co/200x200/111111/FDFBF7?text=SUP' where name = 'Supporter Badge';
update public.badges set image_url = 'https://placehold.co/200x200/2563EB/FFFFFF?text=VP' where name = 'Verified Producer';
