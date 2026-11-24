-- Reels (short videos), visitor reactions/comments/views, and moderated testimonials.
-- Idempotent and additive: creates new tables only, touches no existing data.
-- Visitor identity for likes/comments = Supabase anonymous auth (Authentication → Sign In / Providers → "Allow anonymous sign-ins").

-- ── Reels ───────────────────────────────────────────────────────────
create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  title text not null default '' check (char_length(title) <= 120),
  caption text not null default '' check (char_length(caption) <= 2200),
  hashtags text[] not null default '{}',
  category text not null default 'dance' check (category in ('kids-sports', 'baby-gym', 'kids-basketball', 'animation', 'dance', 'led', 'heels', 'events')),
  language text not null default 'en' check (language in ('en', 'fr', 'ar', 'tr')),
  video_url text not null,
  cover_url text,
  duration numeric,
  display_order int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists reels_status_order on public.reels (status, display_order);

create table if not exists public.reel_reactions (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction_type text not null default 'like' check (reaction_type = 'like'),
  created_at timestamptz not null default now(),
  unique (reel_id, user_id)                         -- one reaction per visitor per reel
);
create index if not exists reel_reactions_reel on public.reel_reactions (reel_id);

create table if not exists public.reel_comments (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  content text not null check (char_length(btrim(content)) between 2 and 600),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected', 'hidden')),
  admin_reply text check (char_length(admin_reply) <= 600),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists reel_comments_reel_status on public.reel_comments (reel_id, moderation_status);

-- One view per browser per reel (visitor key is a random id kept in the browser)
create table if not exists public.reel_views (
  reel_id uuid not null references public.reels (id) on delete cascade,
  visitor text not null check (char_length(visitor) between 8 and 64),
  created_at timestamptz not null default now(),
  primary key (reel_id, visitor)
);

-- ── Testimonials ────────────────────────────────────────────────────
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  reviewer_name text not null check (char_length(btrim(reviewer_name)) between 1 and 80),
  reviewer_role text not null default '' check (char_length(reviewer_role) <= 80),
  organization text not null default '' check (char_length(organization) <= 120),
  content text not null check (char_length(btrim(content)) between 10 and 1500),
  content_i18n jsonb not null default '{}',          -- optional admin translations {en,fr,ar,tr}
  rating int check (rating between 1 and 5),
  avatar_url text,
  language text not null default 'en' check (language in ('en', 'fr', 'ar', 'tr')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected', 'hidden')),
  is_featured boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists testimonials_status_order on public.testimonials (moderation_status, display_order);

-- Private data of public submissions (never readable by visitors)
create table if not exists public.testimonial_private (
  testimonial_id uuid primary key references public.testimonials (id) on delete cascade,
  email text check (email is null or (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200)),
  ip_hash text,
  created_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['reels','reel_comments','testimonials'] loop
    execute format('drop trigger if exists touch on public.%I', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ── Comment safety: strip markup, force moderation, rate limit ──────
create or replace function public.reel_comment_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.display_name := btrim(regexp_replace(new.display_name, '<[^>]*>', '', 'g'));
  new.content := btrim(regexp_replace(new.content, '<[^>]*>', '', 'g'));
  if not public.is_admin() then
    new.moderation_status := 'pending';
    new.admin_reply := null;
    new.user_id := auth.uid();
    if (select count(*) from public.reel_comments c where c.user_id = auth.uid() and c.created_at > now() - interval '10 minutes') >= 3 then
      raise exception 'Too many comments, please wait a few minutes' using errcode = 'P0429';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard on public.reel_comments;
create trigger guard before insert on public.reel_comments for each row execute function public.reel_comment_guard();

-- ── RLS ─────────────────────────────────────────────────────────────
alter table public.reels enable row level security;
drop policy if exists "public read published" on public.reels;
create policy "public read published" on public.reels for select to anon, authenticated using (status = 'published' or public.is_admin());
drop policy if exists "admin write" on public.reels;
create policy "admin write" on public.reels for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.reel_reactions enable row level security;
drop policy if exists "own reactions read" on public.reel_reactions;
create policy "own reactions read" on public.reel_reactions for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own reaction add" on public.reel_reactions;
create policy "own reaction add" on public.reel_reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.reels r where r.id = reel_id and r.status = 'published'));
drop policy if exists "own reaction remove" on public.reel_reactions;
create policy "own reaction remove" on public.reel_reactions for delete to authenticated using (user_id = auth.uid() or public.is_admin());

alter table public.reel_comments enable row level security;
drop policy if exists "public read approved" on public.reel_comments;
create policy "public read approved" on public.reel_comments for select to anon, authenticated
  using ((moderation_status = 'approved' and exists (select 1 from public.reels r where r.id = reel_id and r.status = 'published')) or public.is_admin());
drop policy if exists "visitor comment" on public.reel_comments;
create policy "visitor comment" on public.reel_comments for insert to authenticated
  with check (auth.uid() is not null and exists (select 1 from public.reels r where r.id = reel_id and r.status = 'published'));
drop policy if exists "admin moderate" on public.reel_comments;
create policy "admin moderate" on public.reel_comments for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete" on public.reel_comments;
create policy "admin delete" on public.reel_comments for delete to authenticated using (public.is_admin());

alter table public.reel_views enable row level security;
drop policy if exists "admin read" on public.reel_views;
create policy "admin read" on public.reel_views for select to authenticated using (public.is_admin());
-- no insert policy: views go through record_reel_view()

alter table public.testimonials enable row level security;
drop policy if exists "public read approved" on public.testimonials;
create policy "public read approved" on public.testimonials for select to anon, authenticated using (moderation_status = 'approved' or public.is_admin());
drop policy if exists "admin write" on public.testimonials;
create policy "admin write" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- no public insert policy: submissions go through submit_testimonial()

alter table public.testimonial_private enable row level security;
drop policy if exists "admin only" on public.testimonial_private;
create policy "admin only" on public.testimonial_private for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Public functions (validated, rate limited) ──────────────────────
create or replace function public.reel_stats() returns table (reel_id uuid, likes bigint, comments bigint, views bigint)
language sql stable security definer set search_path = '' as $$
  select r.id,
    (select count(*) from public.reel_reactions x where x.reel_id = r.id),
    (select count(*) from public.reel_comments c where c.reel_id = r.id and c.moderation_status = 'approved'),
    (select count(*) from public.reel_views v where v.reel_id = r.id)
  from public.reels r where r.status = 'published' or public.is_admin();
$$;

create or replace function public.record_reel_view(p_reel uuid, p_visitor text) returns void
language sql security definer set search_path = '' as $$
  insert into public.reel_views (reel_id, visitor)
  select p_reel, p_visitor where exists (select 1 from public.reels r where r.id = p_reel and r.status = 'published')
  on conflict do nothing;
$$;

create or replace function public.submit_testimonial(p_name text, p_email text, p_role text, p_org text, p_rating int, p_content text, p_lang text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_ip text := md5(coalesce(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), 'unknown'));
  v_id uuid;
begin
  if (select count(*) from public.testimonial_private p where p.ip_hash = v_ip and p.created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.testimonials t where t.moderation_status = 'pending' and t.created_at > now() - interval '1 day') >= 50 then
    raise exception 'Too many reviews submitted, please try again later' using errcode = 'P0429';
  end if;
  insert into public.testimonials (reviewer_name, reviewer_role, organization, content, rating, language)
  values (btrim(regexp_replace(p_name, '<[^>]*>', '', 'g')), btrim(regexp_replace(coalesce(p_role, ''), '<[^>]*>', '', 'g')),
          btrim(regexp_replace(coalesce(p_org, ''), '<[^>]*>', '', 'g')), btrim(regexp_replace(p_content, '<[^>]*>', '', 'g')),
          p_rating, case when p_lang in ('en', 'fr', 'ar', 'tr') then p_lang else 'en' end)
  returning id into v_id;   -- moderation_status defaults to 'pending', is_featured to false
  insert into public.testimonial_private (testimonial_id, email, ip_hash) values (v_id, nullif(btrim(p_email), ''), v_ip);
  return v_id;
end $$;

revoke all on function public.reel_stats() from public;
revoke all on function public.record_reel_view(uuid, text) from public;
revoke all on function public.submit_testimonial(text, text, text, text, int, text, text) from public;
grant execute on function public.reel_stats() to anon, authenticated;
grant execute on function public.record_reel_view(uuid, text) to anon, authenticated;
grant execute on function public.submit_testimonial(text, text, text, text, int, text, text) to anon, authenticated;

-- ── v2 visuals (mockup 2.0): new gallery illustrations + service images, only where untouched ──
insert into public.portfolio_items (id, kind, src, thumb, title, description, caption, category, sort_order, visible, is_illustration) values ('stage-group', 'image', '/media/illus/stage-group.webp', '/media/illus/stage-group-sm.webp', '{"en": "Group dance show", "fr": "Spectacle de danse en groupe", "ar": "عرض رقص جماعي", "tr": "Grup dans gösterisi"}'::jsonb, '{"en":"","fr":"","ar":"","tr":""}'::jsonb, '{"en": "Group dance show", "fr": "Spectacle de danse en groupe", "ar": "عرض رقص جماعي", "tr": "Grup dans gösterisi"}'::jsonb, 'dance', 9, true, true) on conflict (id) do nothing;
insert into public.portfolio_items (id, kind, src, thumb, title, description, caption, category, sort_order, visible, is_illustration) values ('studio-coach', 'image', '/media/illus/studio-coach.webp', '/media/illus/studio-coach-sm.webp', '{"en": "Studio session with kids", "fr": "Séance en studio avec les enfants", "ar": "حصة مع الأطفال في الاستوديو", "tr": "Çocuklarla stüdyo dersi"}'::jsonb, '{"en":"","fr":"","ar":"","tr":""}'::jsonb, '{"en": "Studio session with kids", "fr": "Séance en studio avec les enfants", "ar": "حصة مع الأطفال في الاستوديو", "tr": "Çocuklarla stüdyo dersi"}'::jsonb, 'kids-sports', 10, true, true) on conflict (id) do nothing;
insert into public.portfolio_items (id, kind, src, thumb, title, description, caption, category, sort_order, visible, is_illustration) values ('stage-dance', 'image', '/media/illus/stage-dance.webp', '/media/illus/stage-dance-sm.webp', '{"en": "Stage lights", "fr": "Sous les projecteurs", "ar": "تحت الأضواء", "tr": "Sahne ışıkları"}'::jsonb, '{"en":"","fr":"","ar":"","tr":""}'::jsonb, '{"en": "Stage lights", "fr": "Sous les projecteurs", "ar": "تحت الأضواء", "tr": "Sahne ışıkları"}'::jsonb, 'led', 11, true, true) on conflict (id) do nothing;
insert into public.portfolio_items (id, kind, src, thumb, title, description, caption, category, sort_order, visible, is_illustration) values ('kids-line', 'image', '/media/illus/kids-line.webp', '/media/illus/kids-line-sm.webp', '{"en": "Kids line-up", "fr": "Les enfants en ligne", "ar": "الأطفال في صف", "tr": "Sıraya dizilen çocuklar"}'::jsonb, '{"en":"","fr":"","ar":"","tr":""}'::jsonb, '{"en": "Kids line-up", "fr": "Les enfants en ligne", "ar": "الأطفال في صف", "tr": "Sıraya dizilen çocuklar"}'::jsonb, 'animation', 12, true, true) on conflict (id) do nothing;
insert into public.portfolio_items (id, kind, src, thumb, title, description, caption, category, sort_order, visible, is_illustration) values ('floor-stretch', 'image', '/media/illus/floor-stretch.webp', '/media/illus/floor-stretch-sm.webp', '{"en": "Warm-up and stretching", "fr": "Échauffement et étirements", "ar": "الإحماء والتمدد", "tr": "Isınma ve esneme"}'::jsonb, '{"en":"","fr":"","ar":"","tr":""}'::jsonb, '{"en": "Warm-up and stretching", "fr": "Échauffement et étirements", "ar": "الإحماء والتمدد", "tr": "Isınma ve esneme"}'::jsonb, 'kids-sports', 13, true, true) on conflict (id) do nothing;
insert into public.portfolio_items (id, kind, src, thumb, title, description, caption, category, sort_order, visible, is_illustration) values ('coach-kids', 'image', '/media/illus/coach-kids.webp', '/media/illus/coach-kids-sm.webp', '{"en": "Dance with the kids", "fr": "Danser avec les enfants", "ar": "الرقص مع الأطفال", "tr": "Çocuklarla dans"}'::jsonb, '{"en":"","fr":"","ar":"","tr":""}'::jsonb, '{"en": "Dance with the kids", "fr": "Danser avec les enfants", "ar": "الرقص مع الأطفال", "tr": "Çocuklarla dans"}'::jsonb, 'animation', 14, true, true) on conflict (id) do nothing;
update public.services set image = '/media/illus/kids-line.webp' where id = 'animation' and image = '/media/illus/kids-group.webp';
update public.services set image = '/media/illus/baby-gym-mat.webp' where id = 'baby-gym' and image = '/media/illus/baby-gym.webp';
update public.services set image = '/media/illus/kids-basketball.webp' where id = 'kids-coaching' and image = '/media/illus/kids-gym-group.webp';
update public.services set image = '/media/illus/stage-dance.webp' where id = 'dance' and image = '/media/illus/stage-led.webp';
