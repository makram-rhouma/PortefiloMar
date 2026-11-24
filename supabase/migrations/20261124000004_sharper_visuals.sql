-- Replace the blurry, distorted visuals (tiny mockup crops upscaled x4) with crops of the large, sharp visuals.
-- Nothing is deleted: blurry gallery items are only hidden (visible = false) and stay editable in the admin.
update public.services set image = '/media/illus/svc-animation.webp' where id = 'animation';
update public.services set image = '/media/illus/svc-baby-gym.webp' where id = 'baby-gym';
update public.services set image = '/media/illus/svc-coaching.webp' where id = 'kids-coaching';
update public.services set image = '/media/illus/svc-dance.webp' where id = 'dance';

update public.portfolio_items set visible = false
where id in ('kids-basketball', 'baby-gym-mat', 'kids-group', 'stage-heels', 'kids-gym-group', 'baby-gym', 'stage-led',
             'stage-group', 'studio-coach', 'kids-line', 'stage-dance', 'floor-stretch');

insert into public.portfolio_items (id, kind, src, thumb, title, description, caption, category, sort_order, visible, is_illustration) values
 ('g-dancer-hero', 'image', '/media/illus/svc-dance.webp', '/media/illus/svc-dance-sm.webp', '{"en":"Dance performance","fr":"Performance de danse","ar":"عرض رقص","tr":"Dans gösterisi"}', '{"en":"","fr":"","ar":"","tr":""}', '{"en":"Dance performance","fr":"Performance de danse","ar":"عرض رقص","tr":"Dans gösterisi"}', 'dance', 1, true, true),
 ('g-coaching', 'image', '/media/illus/svc-baby-gym.webp', '/media/illus/svc-baby-gym-sm.webp', '{"en":"High five after the exercise","fr":"Bravo après l’exercice","ar":"تشجيع بعد التمرين","tr":"Egzersiz sonrası çak bir beşlik"}', '{"en":"","fr":"","ar":"","tr":""}', '{"en":"High five after the exercise","fr":"Bravo après l’exercice","ar":"تشجيع بعد التمرين","tr":"Egzersiz sonrası çak bir beşlik"}', 'kids-sports', 2, true, true),
 ('g-kids-cheer', 'image', '/media/illus/g-kids-cheer.webp', '/media/illus/g-kids-cheer-sm.webp', '{"en":"Happy kids","fr":"Des enfants heureux","ar":"أطفال سعداء","tr":"Mutlu çocuklar"}', '{"en":"","fr":"","ar":"","tr":""}', '{"en":"Happy kids","fr":"Des enfants heureux","ar":"أطفال سعداء","tr":"Mutlu çocuklar"}', 'animation', 3, true, true),
 ('g-class-dance', 'image', '/media/illus/g-class-dance.webp', '/media/illus/g-class-dance-sm.webp', '{"en":"Dance class with kids","fr":"Cours de danse avec les enfants","ar":"حصة رقص مع الأطفال","tr":"Çocuklarla dans dersi"}', '{"en":"","fr":"","ar":"","tr":""}', '{"en":"Dance class with kids","fr":"Cours de danse avec les enfants","ar":"حصة رقص مع الأطفال","tr":"Çocuklarla dans dersi"}', 'dance', 4, true, true),
 ('g-animation', 'image', '/media/illus/svc-animation.webp', '/media/illus/svc-animation-sm.webp', '{"en":"Group activity","fr":"Activité de groupe","ar":"نشاط جماعي","tr":"Grup etkinliği"}', '{"en":"","fr":"","ar":"","tr":""}', '{"en":"Group activity","fr":"Activité de groupe","ar":"نشاط جماعي","tr":"Grup etkinliği"}', 'animation', 5, true, true),
 ('g-portrait', 'image', '/media/illus/dancer-portrait.webp', '/media/illus/dancer-portrait-sm.webp', '{"en":"Stage smile","fr":"Sourire de scène","ar":"ابتسامة على المسرح","tr":"Sahne gülümsemesi"}', '{"en":"","fr":"","ar":"","tr":""}', '{"en":"Stage smile","fr":"Sourire de scène","ar":"ابتسامة على المسرح","tr":"Sahne gülümsemesi"}', 'events', 6, true, true)
on conflict (id) do nothing;
update public.portfolio_items set sort_order = 7 where id = 'hero-coach';
