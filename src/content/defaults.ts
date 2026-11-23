// Single source of truth for Meriem's content (offline fallback + SQL seed via scripts/gen-seed.ts).
// Facts come from Meriem_Jaballah_CV.pdf / _V2.pdf only. Phone and email are not in the CV: left empty, editable in the CMS.
export type Lang = 'en' | 'fr' | 'ar' | 'tr'
export const LANGS: Lang[] = ['en', 'fr', 'ar', 'tr']
export type ML = Record<Lang, string>
export type MLList = Record<Lang, string[]>

export type Category = 'kids-sports' | 'baby-gym' | 'kids-basketball' | 'animation' | 'dance' | 'led' | 'heels' | 'events'
export const CATEGORIES: Category[] = ['kids-sports', 'baby-gym', 'kids-basketball', 'animation', 'dance', 'led', 'heels', 'events']

export interface Settings {
  siteUrl: string; name: string; email: string; phone: string; whatsapp: string; instagram: string; qrUrl: string; qrLabel: ML
}
export interface Stat { value: number; suffix: string; label: ML }
export interface Sections {
  hero: { kicker: ML; headline: ML; intro: ML }
  about: { title: ML; body: ML; location: ML; nationality: ML; relocation: ML; stats: Stat[] }
  dance: { intro: ML }
  contact: { intro: ML }
}
export interface Experience { id: string; role: ML; company: ML; location: ML; period: string; bullets: MLList; sort_order: number; visible: boolean }
export interface Education { id: string; title: ML; institution: ML; period: string; kind: 'degree' | 'certification'; sort_order: number; visible: boolean }
export interface Service { id: string; title: ML; description: ML; tags: MLList; image: string; sort_order: number; visible: boolean }
export interface Certificate { id: string; title: ML; organization: ML; period: string; description: ML; file_url: string | null; sort_order: number; visible: boolean }
export interface Skill { id: string; name: ML; category: 'kids' | 'performance' | 'qualities'; sort_order: number; visible: boolean }
export interface Language { id: string; name: ML; level: ML; sort_order: number; visible: boolean }
export interface SocialLink { id: string; platform: string; url: string; label: ML; sort_order: number; visible: boolean }
export interface PortfolioItem {
  id: string; kind: 'image' | 'video'; src: string; poster: string | null; thumb: string | null
  title: ML; description: ML; caption: ML; category: Category; sort_order: number; featured: boolean; visible: boolean; is_illustration: boolean
}

const m = (en: string, fr: string, ar: string, tr: string): ML => ({ en, fr, ar, tr })
const empty = m('', '', '', '')

export const SITE_URL_FALLBACK = 'https://portefilomariemproject.netlify.app'

export const settings: Settings = {
  siteUrl: import.meta.env?.VITE_PUBLIC_SITE_URL || SITE_URL_FALLBACK,
  name: 'Meriem Jaballah', email: '', phone: '', whatsapp: '', instagram: '', qrUrl: '',
  qrLabel: m('Scan to Explore', 'Scannez pour découvrir', 'امسح الرمز للاكتشاف', 'Keşfetmek için tarayın'),
}

export const sections: Sections = {
  hero: {
    kicker: m('Kids Animation • Children’s Sports • Dance Performance', 'Animation enfants • Sport pour enfants • Danse de scène', 'تنشيط الأطفال • رياضة الأطفال • عروض الرقص', 'Çocuk Animasyonu • Çocuk Sporları • Dans Gösterisi'),
    headline: m('Little Steps. Big Confidence. Unforgettable Moments.', 'Petits pas. Grande confiance. Des moments inoubliables.', 'خطوات صغيرة. ثقة كبيرة. لحظات لا تُنسى.', 'Küçük Adımlar. Büyük Özgüven. Unutulmaz Anlar.'),
    intro: m(
      'Creating joyful experiences through Kids Animation, Children’s Sports and Dance Performance.',
      'Je crée des expériences joyeuses grâce à l’animation enfants, au sport pour enfants et à la danse de scène.',
      'أصنع تجارب مليئة بالفرح من خلال تنشيط الأطفال ورياضة الأطفال وعروض الرقص.',
      'Çocuk animasyonu, çocuk sporları ve dans gösterileriyle neşe dolu deneyimler yaratıyorum.',
    ),
  },
  about: {
    title: m('About Meriem', 'À propos de Meriem', 'نبذة عن مريم', 'Meriem Hakkında'),
    body: m(
      'Energetic and caring professional with 6 years of experience in children’s animation, kids’ sports coaching and stage performance. Specialised in baby gymnastics, baby basketball and kids’ gymnastics, delivering safe and engaging sessions that develop motor skills, confidence and team spirit. Since 2024, performing LED and high-heels dance shows for international audiences in hotels and events. Patient, creative and reliable, communicating with children, parents and colleagues in Arabic, French and English.',
      'Professionnelle énergique et bienveillante, avec 6 ans d’expérience en animation enfants, en coaching sportif pour enfants et en spectacle. Spécialisée en baby gym, baby basket et gymnastique enfants, j’anime des séances sûres et ludiques qui développent la motricité, la confiance et l’esprit d’équipe. Depuis 2024, je me produis dans des spectacles de danse LED et high heels devant un public international, dans des hôtels et des événements. Patiente, créative et fiable, je communique avec les enfants, les parents et mes collègues en arabe, en français et en anglais.',
      'محترفة مفعمة بالطاقة والحنان، بخبرة 6 سنوات في تنشيط الأطفال وتدريب الرياضة للأطفال والعروض الفنية. متخصصة في جمباز الصغار وكرة السلة للصغار وجمباز الأطفال، أقدّم حصصًا آمنة وممتعة تنمّي المهارات الحركية والثقة وروح الفريق. منذ 2024 أقدّم عروض رقص LED والكعب العالي لجمهور دولي في الفنادق والفعاليات. صبورة ومبدعة وموثوقة، أتواصل مع الأطفال والأولياء والزملاء بالعربية والفرنسية والإنجليزية.',
      'Çocuk animasyonu, çocuk spor koçluğu ve sahne performansında 6 yıllık deneyime sahip, enerjik ve şefkatli bir profesyonelim. Bebek jimnastiği, bebek basketbolu ve çocuk jimnastiğinde uzmanlaşarak motor becerileri, özgüveni ve takım ruhunu geliştiren güvenli ve eğlenceli dersler veriyorum. 2024’ten beri otellerde ve etkinliklerde uluslararası izleyicilere LED ve topuklu dans gösterileri sunuyorum. Sabırlı, yaratıcı ve güvenilirim; çocuklar, ebeveynler ve meslektaşlarla Arapça, Fransızca ve İngilizce iletişim kuruyorum.',
    ),
    location: m('Tunisia', 'Tunisie', 'تونس', 'Tunus'),
    nationality: m('Tunisian', 'Tunisienne', 'تونسية', 'Tunuslu'),
    relocation: m('Hotels • Resorts • Kids clubs • Events', 'Hôtels • Resorts • Clubs enfants • Événements', 'فنادق • منتجعات • نوادي أطفال • فعاليات', 'Oteller • Tatil köyleri • Çocuk kulüpleri • Etkinlikler'),
    stats: [
      { value: 6, suffix: '+', label: m('Years Experience', 'Ans d’expérience', 'سنوات خبرة', 'Yıllık Deneyim') },
      { value: 4, suffix: '', label: m('Languages', 'Langues', 'لغات', 'Dil') },
      { value: 3, suffix: '', label: m('Kids’ Sports', 'Sports enfants', 'رياضات للأطفال', 'Çocuk Sporu') },
    ],
  },
  dance: {
    intro: m(
      'LED, high-heels and themed dance shows for international guests in hotels and private events — synchronized routines, quick costume changes and strong stage presence.',
      'Spectacles de danse LED, high heels et à thème pour une clientèle internationale, dans des hôtels et des événements privés : chorégraphies synchronisées, changements de costume rapides et forte présence scénique.',
      'عروض رقص LED والكعب العالي وعروض بطابع خاص لضيوف دوليين في الفنادق والفعاليات الخاصة — رقصات متناسقة وتبديل سريع للأزياء وحضور قوي على المسرح.',
      'Otellerde ve özel etkinliklerde uluslararası misafirler için LED, topuklu ve temalı dans gösterileri — senkronize koreografiler, hızlı kostüm değişimleri ve güçlü sahne varlığı.',
    ),
  },
  contact: {
    intro: m(
      'Hotels, resorts, kids clubs, sports academies or event organisers: let’s create joyful moments together.',
      'Hôtels, resorts, clubs enfants, académies sportives ou organisateurs d’événements : créons ensemble des moments joyeux.',
      'فنادق ومنتجعات ونوادي أطفال وأكاديميات رياضية ومنظمو فعاليات: لنصنع معًا لحظات مليئة بالفرح.',
      'Oteller, tatil köyleri, çocuk kulüpleri, spor akademileri veya etkinlik organizatörleri: birlikte neşeli anlar yaratalım.',
    ),
  },
}

export const experiences: Experience[] = [
  {
    id: 'kids-animator', period: '2020 – Mar 2024', sort_order: 1, visible: true,
    role: m('Kids Animator & Baby Sports Coach', 'Animatrice enfants & coach baby sport', 'منشّطة أطفال ومدربة رياضة للصغار', 'Çocuk Animatörü ve Bebek Sporları Koçu'),
    company: m('Baby Gymnastics • Baby Basketball • Kids Animation', 'Baby gym • Baby basket • Animation enfants', 'جمباز الصغار • كرة السلة للصغار • تنشيط الأطفال', 'Bebek Jimnastiği • Bebek Basketbolu • Çocuk Animasyonu'),
    location: m('Tunisia', 'Tunisie', 'تونس', 'Tunus'),
    bullets: {
      en: ['Designed and ran fun activities, games and themed events for children of different ages', 'Coached baby gymnastics and baby basketball, developing motor skills, rhythm and teamwork', 'Ensured children’s safety and wellbeing, supervising groups with patience and positive discipline', 'Animated birthdays, parties and celebrations with music, dance and games', 'Kept parents informed and reassured'],
      fr: ['Conception et animation d’activités, de jeux et d’événements à thème pour des enfants de tous âges', 'Coaching en baby gym et baby basket pour développer la motricité, le rythme et l’esprit d’équipe', 'Sécurité et bien-être des enfants, encadrement des groupes avec patience et discipline positive', 'Animation d’anniversaires, de fêtes et de célébrations avec musique, danse et jeux', 'Communication régulière et rassurante avec les parents'],
      ar: ['تصميم وتنشيط أنشطة وألعاب وفعاليات بطابع خاص لأطفال من مختلف الأعمار', 'تدريب جمباز الصغار وكرة السلة للصغار لتنمية المهارات الحركية والإيقاع والعمل الجماعي', 'ضمان سلامة الأطفال وراحتهم والإشراف على المجموعات بصبر وانضباط إيجابي', 'تنشيط أعياد الميلاد والحفلات والاحتفالات بالموسيقى والرقص والألعاب', 'إبقاء الأولياء على اطلاع وطمأنتهم'],
      tr: ['Farklı yaşlardaki çocuklar için eğlenceli aktiviteler, oyunlar ve temalı etkinlikler tasarladı ve yürüttü', 'Bebek jimnastiği ve bebek basketbolu koçluğuyla motor becerileri, ritmi ve takım çalışmasını geliştirdi', 'Grupları sabır ve pozitif disiplinle yöneterek çocukların güvenliğini ve iyiliğini sağladı', 'Doğum günlerini, partileri ve kutlamaları müzik, dans ve oyunlarla canlandırdı', 'Ebeveynleri bilgilendirdi ve güven verdi'],
    },
  },
  {
    id: 'bouabdeli', period: '2023 – Mar 2024', sort_order: 2, visible: true,
    role: m('Kids Gymnastics Coach', 'Coach de gymnastique enfants', 'مدربة جمباز للأطفال', 'Çocuk Jimnastiği Koçu'),
    company: m('Bouabdeli', 'Bouabdeli', 'بوعبدلي', 'Bouabdeli'),
    location: m('Tunisia', 'Tunisie', 'تونس', 'Tunus'),
    bullets: {
      en: ['Planned and led kids’ gymnastics classes focused on balance, flexibility, coordination and strength', 'Taught age-appropriate techniques step by step', 'Applied safe spotting and correct use of mats and equipment', 'Tracked each child’s progress and adapted exercises to individual levels', 'Prepared children for demonstrations and end-of-year shows, building their confidence'],
      fr: ['Préparation et animation de cours de gymnastique enfants axés sur l’équilibre, la souplesse, la coordination et la force', 'Enseignement progressif de techniques adaptées à l’âge', 'Parade sécurisée et bon usage des tapis et du matériel', 'Suivi des progrès de chaque enfant et adaptation des exercices à son niveau', 'Préparation aux démonstrations et galas de fin d’année pour renforcer leur confiance'],
      ar: ['تخطيط وتقديم حصص جمباز للأطفال تركّز على التوازن والمرونة والتناسق والقوة', 'تعليم تقنيات مناسبة للعمر خطوة بخطوة', 'تطبيق المساندة الآمنة والاستخدام الصحيح للحُصُر والمعدات', 'متابعة تقدّم كل طفل وتكييف التمارين مع مستواه', 'تحضير الأطفال للعروض واحتفالات نهاية السنة لتعزيز ثقتهم'],
      tr: ['Denge, esneklik, koordinasyon ve güce odaklanan çocuk jimnastiği derslerini planladı ve yönetti', 'Yaşa uygun teknikleri adım adım öğretti', 'Güvenli spotlama yaptı, minder ve ekipmanların doğru kullanımını sağladı', 'Her çocuğun gelişimini takip ederek egzersizleri seviyesine göre uyarladı', 'Çocukları gösterilere ve yıl sonu şovlarına hazırlayarak özgüvenlerini geliştirdi'],
    },
  },
  {
    id: 'dance-performer', period: '2024 – 2026', sort_order: 3, visible: true,
    role: m('Dance Performer — LED & High-Heels Shows', 'Danseuse — spectacles LED & high heels', 'راقصة — عروض LED والكعب العالي', 'Dansçı — LED ve Topuklu Dans Gösterileri'),
    company: m('Hotels, Events & Entertainment Shows', 'Hôtels, événements & spectacles', 'فنادق وفعاليات وعروض ترفيهية', 'Oteller, Etkinlikler ve Eğlence Gösterileri'),
    location: m('International audiences', 'Public international', 'جمهور دولي', 'Uluslararası izleyici'),
    bullets: {
      en: ['Performed LED, high-heels and themed dance shows for international guests in hotels and private events', 'Learned and mastered new choreographies quickly', 'Delivered synchronized routines within a professional team', 'Handled LED costumes and props carefully, with quick changes between show segments', 'Maintained strong stage presence, punctuality and professional presentation'],
      fr: ['Spectacles de danse LED, high heels et à thème pour une clientèle internationale, en hôtel et lors d’événements privés', 'Apprentissage et maîtrise rapides de nouvelles chorégraphies', 'Routines synchronisées au sein d’une équipe professionnelle', 'Soin des costumes et accessoires LED, changements rapides entre les tableaux', 'Forte présence scénique, ponctualité et présentation professionnelle'],
      ar: ['تقديم عروض رقص LED والكعب العالي وعروض بطابع خاص لضيوف دوليين في الفنادق والفعاليات الخاصة', 'تعلّم الرقصات الجديدة وإتقانها بسرعة', 'أداء رقصات متناسقة ضمن فريق محترف', 'العناية بأزياء وأكسسوارات LED وتبديل الأزياء بسرعة بين فقرات العرض', 'حضور قوي على المسرح والتزام بالمواعيد ومظهر مهني'],
      tr: ['Otellerde ve özel etkinliklerde uluslararası misafirler için LED, topuklu ve temalı dans gösterileri sundu', 'Yeni koreografileri hızla öğrenip ustalaştı', 'Profesyonel bir ekip içinde senkronize rutinler sergiledi', 'LED kostüm ve aksesuarları özenle kullandı, bölümler arasında hızlı kostüm değişimleri yaptı', 'Güçlü sahne varlığı, dakiklik ve profesyonel görünüm sergiledi'],
    },
  },
]

export const education: Education[] = []

const tags = (en: string[], fr: string[], ar: string[], tr: string[]): MLList => ({ en, fr, ar, tr })
export const services: Service[] = [
  {
    id: 'animation', image: '/media/illus/kids-group.webp', sort_order: 1, visible: true,
    title: m('Kids Animation & Entertainment', 'Animation & divertissement enfants', 'تنشيط الأطفال والترفيه', 'Çocuk Animasyonu ve Eğlence'),
    description: m('Themed games, mini-disco, birthdays and celebrations that keep every child engaged and safe.', 'Jeux à thème, mini-disco, anniversaires et fêtes où chaque enfant s’amuse en toute sécurité.', 'ألعاب بطابع خاص وميني ديسكو وأعياد ميلاد واحتفالات يشارك فيها كل طفل بأمان.', 'Her çocuğun güvenle eğlendiği temalı oyunlar, mini disko, doğum günleri ve kutlamalar.'),
    tags: tags(['Activity planning', 'Mini-disco', 'Group management'], ['Planification d’activités', 'Mini-disco', 'Gestion de groupe'], ['تخطيط الأنشطة', 'ميني ديسكو', 'إدارة المجموعات'], ['Aktivite planlama', 'Mini disko', 'Grup yönetimi']),
  },
  {
    id: 'baby-gym', image: '/media/illus/baby-gym.webp', sort_order: 2, visible: true,
    title: m('Baby Gymnastics & Baby Sports', 'Baby gym & baby sport', 'جمباز الصغار ورياضة الصغار', 'Bebek Jimnastiği ve Bebek Sporları'),
    description: m('Playful first movements on safe equipment: motor skills, rhythm and confidence from the very first steps.', 'Premiers mouvements ludiques sur du matériel sécurisé : motricité, rythme et confiance dès les premiers pas.', 'حركات أولى ممتعة على معدات آمنة: مهارات حركية وإيقاع وثقة منذ الخطوات الأولى.', 'Güvenli ekipmanlarla eğlenceli ilk hareketler: ilk adımlardan itibaren motor beceri, ritim ve özgüven.'),
    tags: tags(['Baby gymnastics', 'Baby basketball', 'Child safety'], ['Baby gym', 'Baby basket', 'Sécurité des enfants'], ['جمباز الصغار', 'كرة السلة للصغار', 'سلامة الأطفال'], ['Bebek jimnastiği', 'Bebek basketbolu', 'Çocuk güvenliği']),
  },
  {
    id: 'kids-coaching', image: '/media/illus/kids-gym-group.webp', sort_order: 3, visible: true,
    title: m('Children’s Gymnastics & Sports Coaching', 'Gymnastique & coaching sportif enfants', 'جمباز الأطفال والتدريب الرياضي', 'Çocuk Jimnastiği ve Spor Koçluğu'),
    description: m('Balance, flexibility, coordination and strength, taught step by step with safe spotting.', 'Équilibre, souplesse, coordination et force, enseignés pas à pas avec une parade sécurisée.', 'التوازن والمرونة والتناسق والقوة، تُعلَّم خطوة بخطوة مع مساندة آمنة.', 'Denge, esneklik, koordinasyon ve güç; güvenli spotlama ile adım adım öğretilir.'),
    tags: tags(['Kids gymnastics', 'Progress tracking', 'Shows & demos'], ['Gymnastique enfants', 'Suivi des progrès', 'Galas & démonstrations'], ['جمباز الأطفال', 'متابعة التقدّم', 'عروض واستعراضات'], ['Çocuk jimnastiği', 'Gelişim takibi', 'Gösteriler']),
  },
  {
    id: 'dance', image: '/media/illus/stage-led.webp', sort_order: 4, visible: true,
    title: m('Dance & LED Performance', 'Danse & spectacles LED', 'الرقص وعروض LED', 'Dans ve LED Gösterileri'),
    description: m('LED, high-heels and themed shows for hotels and events, with fast choreography learning and stage presence.', 'Spectacles LED, high heels et à thème pour hôtels et événements, avec apprentissage rapide et présence scénique.', 'عروض LED والكعب العالي وعروض بطابع خاص للفنادق والفعاليات، مع تعلّم سريع للرقصات وحضور مسرحي.', 'Oteller ve etkinlikler için LED, topuklu ve temalı gösteriler; hızlı koreografi öğrenimi ve sahne varlığı.'),
    tags: tags(['LED shows', 'High-heels', 'Choreography'], ['Spectacles LED', 'High heels', 'Chorégraphie'], ['عروض LED', 'الكعب العالي', 'تصميم الرقصات'], ['LED gösterileri', 'Topuklu dans', 'Koreografi']),
  },
]

export const certificates: Certificate[] = [
  { id: 'cert-dance', period: '2024 – 2026', sort_order: 1, visible: true, file_url: null, description: empty,
    title: m('Work & Participation Certificate', 'Attestation de travail & de participation', 'شهادة عمل ومشاركة', 'Çalışma ve Katılım Belgesi'),
    organization: m('Dance Performer — LED & High-Heels Shows', 'Danseuse — spectacles LED & high heels', 'راقصة — عروض LED والكعب العالي', 'Dansçı — LED ve Topuklu Dans Gösterileri') },
  { id: 'cert-bouabdeli', period: '2023 – 2024', sort_order: 2, visible: true, file_url: null, description: empty,
    title: m('Work Certificate', 'Attestation de travail', 'شهادة عمل', 'Çalışma Belgesi'),
    organization: m('Kids Gymnastics Coach — Bouabdeli', 'Coach de gymnastique enfants — Bouabdeli', 'مدربة جمباز للأطفال — بوعبدلي', 'Çocuk Jimnastiği Koçu — Bouabdeli') },
  { id: 'cert-animator', period: '2020 – 2024', sort_order: 3, visible: true, file_url: null, description: empty,
    title: m('Work Certificate', 'Attestation de travail', 'شهادة عمل', 'Çalışma Belgesi'),
    organization: m('Kids Animator & Baby Sports Coach', 'Animatrice enfants & coach baby sport', 'منشّطة أطفال ومدربة رياضة للصغار', 'Çocuk Animatörü ve Bebek Sporları Koçu') },
]

const sk = (id: string, category: Skill['category'], sort_order: number, name: ML): Skill => ({ id, category, sort_order, name, visible: true })
export const skills: Skill[] = [
  sk('animation', 'kids', 1, m('Kids animation & entertainment', 'Animation & divertissement enfants', 'تنشيط الأطفال والترفيه', 'Çocuk animasyonu ve eğlence')),
  sk('childcare', 'kids', 2, m('Child care & supervision', 'Garde & encadrement d’enfants', 'رعاية الأطفال والإشراف عليهم', 'Çocuk bakımı ve gözetimi')),
  sk('baby-gym', 'kids', 3, m('Baby gymnastics & kids gymnastics', 'Baby gym & gymnastique enfants', 'جمباز الصغار وجمباز الأطفال', 'Bebek ve çocuk jimnastiği')),
  sk('baby-basket', 'kids', 4, m('Baby basketball & kids sports', 'Baby basket & sports enfants', 'كرة السلة للصغار ورياضة الأطفال', 'Bebek basketbolu ve çocuk sporları')),
  sk('safety', 'kids', 5, m('Child safety awareness', 'Sécurité des enfants', 'الوعي بسلامة الأطفال', 'Çocuk güvenliği bilinci')),
  sk('planning', 'kids', 6, m('Activity & game planning', 'Planification d’activités & de jeux', 'تخطيط الأنشطة والألعاب', 'Aktivite ve oyun planlama')),
  sk('groups', 'kids', 7, m('Group management', 'Gestion de groupe', 'إدارة المجموعات', 'Grup yönetimi')),
  sk('parents', 'kids', 8, m('Parent communication', 'Communication avec les parents', 'التواصل مع الأولياء', 'Ebeveyn iletişimi')),
  sk('dance', 'performance', 9, m('Dance & choreography', 'Danse & chorégraphie', 'الرقص وتصميم الرقصات', 'Dans ve koreografi')),
  sk('led', 'performance', 10, m('LED & high-heels shows', 'Spectacles LED & high heels', 'عروض LED والكعب العالي', 'LED ve topuklu gösteriler')),
  sk('stage', 'performance', 11, m('Stage presence', 'Présence scénique', 'الحضور على المسرح', 'Sahne varlığı')),
  sk('rhythm', 'performance', 12, m('Rhythm & musicality', 'Rythme & musicalité', 'الإيقاع والموسيقية', 'Ritim ve müzikalite')),
  sk('fast-learning', 'performance', 13, m('Fast choreography learning', 'Apprentissage rapide des chorégraphies', 'تعلّم سريع للرقصات', 'Hızlı koreografi öğrenimi')),
  sk('costume', 'performance', 14, m('Quick costume changes', 'Changements de costume rapides', 'تبديل سريع للأزياء', 'Hızlı kostüm değişimi')),
  sk('team-stage', 'performance', 15, m('Teamwork on stage', 'Travail d’équipe sur scène', 'العمل الجماعي على المسرح', 'Sahnede takım çalışması')),
  sk('mini-disco', 'performance', 16, m('Mini-disco', 'Mini-disco', 'ميني ديسكو', 'Mini disko')),
  sk('patient', 'qualities', 17, m('Patient & caring', 'Patiente & bienveillante', 'صبورة وحنونة', 'Sabırlı ve şefkatli')),
  sk('creative', 'qualities', 18, m('Creative & energetic', 'Créative & énergique', 'مبدعة ونشيطة', 'Yaratıcı ve enerjik')),
  sk('reliable', 'qualities', 19, m('Reliable & punctual', 'Fiable & ponctuelle', 'موثوقة ومنضبطة في المواعيد', 'Güvenilir ve dakik')),
  sk('team', 'qualities', 20, m('Adaptable team player', 'Esprit d’équipe & adaptabilité', 'مرنة وتحب العمل الجماعي', 'Uyumlu takım oyuncusu')),
  sk('fit', 'qualities', 21, m('Physically fit', 'En excellente forme physique', 'لياقة بدنية عالية', 'Fiziksel olarak formda')),
  sk('smiling', 'qualities', 22, m('Smiling', 'Souriante', 'مبتسمة دائمًا', 'Güler yüzlü')),
]

const lg = (id: string, sort_order: number, name: ML, level: ML): Language => ({ id, sort_order, name, level, visible: true })
export const languages: Language[] = [
  lg('ar', 1, m('Arabic', 'Arabe', 'العربية', 'Arapça'), m('Native', 'Langue maternelle', 'اللغة الأم', 'Ana dil')),
  lg('fr', 2, m('French', 'Français', 'الفرنسية', 'Fransızca'), m('Advanced', 'Avancé', 'متقدّم', 'İleri')),
  lg('en', 3, m('English', 'Anglais', 'الإنجليزية', 'İngilizce'), m('Advanced', 'Avancé', 'متقدّم', 'İleri')),
  lg('tr', 4, m('Turkish', 'Turc', 'التركية', 'Türkçe'), m('Basic', 'Notions', 'مبتدئ', 'Temel')),
]

export const socials: SocialLink[] = [] // none in the CV: added by the admin

const visual = (id: string, category: Category, sort_order: number, title: ML): PortfolioItem => ({
  id, kind: 'image', src: `/media/illus/${id}.webp`, thumb: `/media/illus/${id}-sm.webp`, poster: null, title,
  description: empty, caption: title, category, sort_order, featured: false, visible: true, is_illustration: true,
})
export const portfolio: PortfolioItem[] = [
  visual('kids-basketball', 'kids-basketball', 1, m('Baby basketball', 'Baby basket', 'كرة السلة للصغار', 'Bebek basketbolu')),
  visual('baby-gym-mat', 'baby-gym', 2, m('Baby gymnastics', 'Baby gym', 'جمباز الصغار', 'Bebek jimnastiği')),
  visual('kids-group', 'animation', 3, m('Group activity', 'Activité de groupe', 'نشاط جماعي', 'Grup etkinliği')),
  visual('stage-heels', 'heels', 4, m('High-heels performance', 'Performance high heels', 'عرض الكعب العالي', 'Topuklu dans gösterisi')),
  visual('kids-gym-group', 'kids-sports', 5, m('Kids gymnastics group', 'Groupe de gymnastique enfants', 'مجموعة جمباز الأطفال', 'Çocuk jimnastiği grubu')),
  visual('baby-gym', 'baby-gym', 6, m('First movements', 'Premiers mouvements', 'الحركات الأولى', 'İlk hareketler')),
  visual('stage-led', 'led', 7, m('LED stage show', 'Spectacle LED', 'عرض LED على المسرح', 'LED sahne gösterisi')),
  visual('hero-coach', 'kids-sports', 8, m('Coaching with a high five', 'Coaching et encouragements', 'التدريب والتشجيع', 'Çak bir beşlik: koçluk')),
]
