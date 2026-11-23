import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, Baby, CalendarDays, Cake, Check, Download, Dumbbell, Eye, FileText, Globe2, Mail, Medal, Music, Phone,
  Send, Sparkles, Star, Trophy, Users, Volleyball,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Crown, LangMenu, NAV } from '../components/chrome'
import { Lightbox, QRCard, VideoPlayer } from '../components/media'
import { Icon, PressButton, Reveal, ScrambleText } from '../components/ui'
import { CATEGORIES, SITE_URL_FALLBACK, type Category, type Stat } from '../content/defaults'
import type { SiteData } from '../content/useSiteData'
import { useI18n } from '../i18n/I18n'
import type { Key } from '../i18n/dict'
import { dur, ease } from '../lib/motion'
import { supabase } from '../lib/supabase'
import { validateContact, type ContactErrors } from './validate'

const wrap = 'mx-auto max-w-[88rem] px-4 md:px-8'
const panel = 'rounded-[1.75rem] bg-ink-2/80 ring-1 ring-cream/10 shadow-[0_24px_60px_-30px_rgb(0_0_0/.6)]'
const btnTeal = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-magenta px-6 text-sm font-bold text-ink shadow-[0_10px_30px_-8px_rgb(8_198_197/.7)] transition-[transform,filter] duration-[var(--dur-fast)] hover:brightness-110 active:scale-[.97]'
const btnOutline = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-cream/80 px-6 text-sm font-bold text-cream transition-colors duration-[var(--dur-fast)] hover:bg-cream hover:text-ink active:scale-[.97]'

function IllusTag() {
  const { t } = useI18n()
  return <span className="pointer-events-none absolute bottom-2 end-2 z-10 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-cream/75 backdrop-blur">{t('illus.label')}</span>
}

/** Section heading: icon + serif title, optional yellow brush underline (mockup style). */
function Heading({ id, icon, children, brush = false }: { id?: string; icon?: React.ReactNode; children: React.ReactNode; brush?: boolean }) {
  return (
    <div className="mb-6">
      <h2 id={id} className="flex items-center gap-3 font-display text-3xl font-bold leading-tight md:text-4xl">{icon}{children}</h2>
      {brush && <svg aria-hidden viewBox="0 0 120 12" className="mt-1 w-28 text-gold"><path d="M2 9C30 3 70 2 118 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" /></svg>}
    </div>
  )
}
const StarIcon = () => <Star className="size-7 shrink-0 fill-gold text-gold" aria-hidden />

function Counter({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [v, setV] = useState(reduce ? stat.value : 0)
  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(0, stat.value, { duration: 1.4, ease: ease.out, onUpdate: (x) => setV(Math.round(x)) })
    return () => c.stop()
  }, [inView, reduce, stat.value])
  return <span ref={ref} className="tabular-nums">{v}{stat.suffix}</span>
}

export function resolveSiteUrl(s: SiteData['settings']) {
  const u = s.qrUrl || s.siteUrl || SITE_URL_FALLBACK
  return /localhost|127\.0\.0\.1/.test(u) ? SITE_URL_FALLBACK : u // a QR must never point to a dev machine
}

/** Contact channels that are actually configured (the CV has none: the admin fills them in). */
function channels(s: SiteData['settings'], socials: SiteData['socials'], t: (k: Key) => string) {
  const list: { icon: string; label: string; value: string; href: string }[] = []
  if (s.email) list.push({ icon: 'mail', label: t('contact.email'), value: s.email, href: `mailto:${s.email}` })
  if (s.phone) list.push({ icon: 'phone', label: t('contact.phone'), value: s.phone, href: `tel:${s.phone.replace(/\s/g, '')}` })
  if (s.whatsapp) list.push({ icon: 'whatsapp', label: t('contact.whatsapp'), value: s.phone || 'WhatsApp', href: s.whatsapp })
  if (s.instagram) list.push({ icon: 'instagram', label: t('contact.instagram'), value: '@' + s.instagram.replace(/\/$/, '').split('/').pop(), href: s.instagram })
  for (const l of socials) if (!list.some((x) => x.href === l.url)) list.push({ icon: l.platform, label: l.platform, value: l.platform, href: l.url })
  return list
}

export function Hero({ data }: { data: SiteData }) {
  const { ml, t } = useI18n()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70])
  const h = data.sections.hero
  const [l1, l2, l3] = ml(h.headline).split(/(?<=\.)\s+/)
  const statIcons = [<CalendarDays key="c" className="size-8 text-lilac" />, <Globe2 key="g" className="size-8 text-magenta" />, <Trophy key="t" className="size-8 text-gold" />]
  return (
    <section ref={ref} id="top" aria-labelledby="hero-title" className="hero-bg relative isolate overflow-hidden pt-20 md:pt-24">
      <div className={`${wrap} relative`}>
        <div className={`${panel} relative overflow-hidden`}>
          {/* Illustrative coach visual: right on desktop, top on mobile */}
          <motion.figure style={{ y: imgY }} className="relative h-[46svh] max-h-[28rem] lg:absolute lg:inset-y-0 lg:end-0 lg:h-auto lg:max-h-none lg:w-[62%]">
            <img src="/media/illus/hero-coach.webp" alt={t('illus.alt')} fetchPriority="high" className="h-full w-full object-cover object-[60%_30%]" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-2 via-transparent to-transparent lg:bg-gradient-to-r lg:from-ink-2 lg:via-ink-2/40 lg:to-transparent rtl:lg:bg-gradient-to-l" />
            <IllusTag />
          </motion.figure>
          <span aria-hidden className="brush -start-8 bottom-28 w-56 bg-gradient-to-r from-gold to-gold/0" />
          <span aria-hidden className="brush -start-12 bottom-20 w-72 bg-gradient-to-r from-lilac/90 to-lilac/0" />

          <div className="relative z-10 -mt-24 px-5 pb-8 lg:mt-0 lg:min-h-[33rem] lg:max-w-[52%] lg:px-12 lg:py-16">
            <svg aria-hidden viewBox="0 0 40 40" className="absolute end-6 top-2 hidden w-10 text-gold lg:block"><path d="M8 30 18 10M22 34 30 14M30 36 38 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            <h1 id="hero-title" className="font-script text-[2.6rem] leading-[1.08] drop-shadow-[0_4px_18px_rgb(0_0_0/.5)] max-[359px]:text-[2.2rem] sm:text-5xl lg:-rotate-3 lg:text-[3.6rem] xl:text-[3.9rem]">
              <motion.span className="block text-cream" initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: dur.slow, ease: ease.out }}>{l1}</motion.span>
              <motion.span className="block text-gold" initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: dur.slow, ease: ease.out }}>{l2}</motion.span>
              <motion.span className="block text-cream" initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: dur.slow, ease: ease.out }}>{l3}</motion.span>
            </h1>
            <p className="mt-4 text-[15px] font-medium text-cream/90">{ml(h.kicker)}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-cream/70">{ml(h.intro)}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#journey" className={btnTeal}><ScrambleText text={t('hero.ctaJourney')} /><ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></a>
              <a href="#contact" className={btnOutline}>{t('hero.ctaContact')}<Mail className="size-4" aria-hidden /></a>
            </div>
          </div>

          <ul className="relative z-10 grid grid-cols-3 gap-2 border-t border-cream/10 bg-ink/70 p-3 backdrop-blur md:p-5 lg:divide-x lg:divide-cream/10 rtl:lg:divide-x-reverse">
            {data.sections.about.stats.map((st, i) => (
              <li key={i} className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-ink-3/40 p-3 text-center lg:flex-row lg:gap-4 lg:rounded-none lg:bg-transparent lg:p-2">
                <span aria-hidden>{statIcons[i] ?? <Star className="size-8 text-gold" />}</span>
                <span><span className="block text-2xl font-bold leading-none md:text-3xl"><Counter stat={st} /></span><span className="block text-xs text-cream/75">{ml(st.label)}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function AboutJourney({ data }: { data: SiteData }) {
  const { ml, t, lang } = useI18n()
  const [open, setOpen] = useState<string | null>(null)
  const cards: [string, string, string][] = [['#activities', '/media/illus/baby-gym.webp', t('activities.title')], ['#dance', '/media/illus/stage-led.webp', t('dance.title')]]
  return (
    <div className={`${wrap} mt-6 grid gap-6 xl:grid-cols-[1fr_1.25fr_1.1fr]`}>
      <section id="about" aria-labelledby="about-title" className={`${panel} p-6 md:p-8`}>
        <Reveal>
          <h2 id="about-title" className="font-display text-3xl font-bold md:text-4xl">{ml(data.sections.about.title)}</h2>
          <svg aria-hidden viewBox="0 0 120 12" className="mt-1 w-32 text-gold"><path d="M2 9C30 3 70 2 118 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" /></svg>
          <p className="mt-4 text-[15px] leading-relaxed text-cream/80">{ml(data.sections.about.body)}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-cream/55">{t('about.based')}</dt><dd className="font-semibold">{ml(data.sections.about.location)}</dd></div>
            <div><dt className="text-cream/55">{t('about.nationality')}</dt><dd className="font-semibold">{ml(data.sections.about.nationality)}</dd></div>
            <div className="col-span-2"><dt className="text-cream/55">{t('about.works')}</dt><dd className="font-semibold text-magenta">{ml(data.sections.about.relocation)}</dd></div>
          </dl>
          <a href="#services" className={`${btnTeal} mt-6 !min-h-11 !px-5`}>{t('about.more')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></a>
        </Reveal>
      </section>

      <section id="journey" aria-labelledby="journey-title" className={`${panel} p-6 md:p-8`}>
        <Heading id="journey-title" icon={<StarIcon />}>{t('journey.title')}</Heading>
        <ol className="relative space-y-2 ps-7">
          <span aria-hidden className="absolute inset-y-4 start-[9px] w-0.5 rounded bg-gradient-to-b from-magenta via-magenta/60 to-gold" />
          {data.experiences.map((e, i) => {
            const isOpen = open === e.id
            return (
              <Reveal key={e.id} delay={i * 0.06}>
                <li className="relative">
                  <span aria-hidden className="absolute -start-7 top-4 grid size-5 place-items-center rounded-full bg-magenta/25 ring-2 ring-magenta"><span className="size-2 rounded-full bg-magenta" /></span>
                  <button type="button" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen} aria-controls={`exp-${e.id}`}
                    className="flex w-full flex-wrap items-start justify-between gap-2 rounded-2xl p-2 text-start transition-colors hover:bg-cream/5">
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-snug">{ml(e.role)}</span>
                      <span className="block text-sm text-cream/65">{ml(e.company)}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-magenta/90 px-3 py-1 text-xs font-bold text-ink" dir="ltr">{e.period}</span>
                  </button>
                  <motion.div id={`exp-${e.id}`} initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} transition={{ duration: dur.base, ease: ease.out }} className="overflow-hidden">
                    <ul className="space-y-1.5 pb-3 ps-2 text-sm text-cream/80">
                      {(e.bullets[lang]?.length ? e.bullets[lang] : e.bullets.en).map((b, j) => <li key={j} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-magenta" aria-hidden />{b}</li>)}
                    </ul>
                  </motion.div>
                </li>
              </Reveal>
            )
          })}
        </ol>
      </section>

      <div className="grid grid-cols-2 gap-4 self-start">
        {cards.map(([href, img, label]) => (
          <a key={href} href={href} className="group relative isolate block aspect-[4/5] overflow-hidden rounded-[1.5rem] ring-2 ring-cream/15 transition-shadow hover:shadow-[0_0_30px_rgb(8_198_197/.45)]">
            <img src={img} alt={t('illus.alt')} loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[var(--dur-slow)] group-hover:scale-105" />
            <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
            <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2"><span className="text-lg font-bold leading-tight">{label}</span>
              <span className="grid size-9 shrink-0 place-items-center rounded-full ring-2 ring-cream"><ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></span></span>
            <span className="absolute start-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-cream/75">{t('illus.label')}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export function Services({ data }: { data: SiteData }) {
  const { ml, t, lang } = useI18n()
  const accents = ['from-lilac', 'from-gold', 'from-magenta', 'from-[#8c6bff]']
  return (
    <section id="services" aria-labelledby="services-title" className={`${wrap} py-14 md:py-20`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-[.25em] text-gold">{t('services.eyebrow')}</p>
      <Heading id="services-title" brush>{t('services.title')}</Heading>
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {data.services.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.06}>
            <li className={`${panel} group h-full overflow-hidden transition-transform duration-[var(--dur-base)] hover:-translate-y-1`}>
              <figure className="relative aspect-[4/3] overflow-hidden">
                <img src={s.image} alt={t('illus.alt')} loading="lazy" className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] group-hover:scale-105" />
                <span aria-hidden className={`absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r ${accents[i % 4]} to-transparent`} />
                <IllusTag />
              </figure>
              <div className="p-5">
                <h3 className="text-lg font-bold leading-snug">{ml(s.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/75">{ml(s.description)}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">{(s.tags[lang]?.length ? s.tags[lang] : s.tags.en).map((tg) => <li key={tg} className="rounded-full bg-magenta/12 px-2.5 py-1 text-xs font-medium text-magenta ring-1 ring-magenta/25">{tg}</li>)}</ul>
              </div>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}

export function Activities() {
  const { t } = useI18n()
  const items: [Key, React.ReactNode][] = [
    ['act.babyGym', <Baby key="1" />], ['act.babyBasket', <Volleyball key="2" />], ['act.kidsGym', <Dumbbell key="3" />], ['act.games', <Sparkles key="4" />],
    ['act.groups', <Users key="5" />], ['act.miniDisco', <Music key="6" />], ['act.birthdays', <Cake key="7" />], ['act.coaching', <Medal key="8" />],
  ]
  const mosaic = ['/media/illus/kids-gym-group.webp', '/media/illus/kids-basketball.webp', '/media/illus/baby-gym-mat.webp', '/media/illus/kids-group.webp']
  return (
    <section id="activities" aria-labelledby="activities-title" className="relative overflow-hidden bg-gradient-to-b from-ink-3/60 to-ink py-14 md:py-20">
      <div className={`${wrap} grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]`}>
        <div>
          <Heading id="activities-title" icon={<StarIcon />} brush>{t('activities.title')}</Heading>
          <p className="max-w-lg text-cream/80">{t('activities.intro')}</p>
          <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {items.map(([k, icon], i) => (
              <Reveal key={k} delay={i * 0.04}>
                <li className="flex h-full flex-col items-center gap-2 rounded-2xl bg-ink-2/80 p-4 text-center ring-1 ring-cream/10 transition-colors hover:ring-magenta/50">
                  <span className={`grid size-11 place-items-center rounded-full [&>svg]:size-5 ${['bg-magenta/15 text-magenta', 'bg-gold/15 text-gold', 'bg-lilac/15 text-lilac'][i % 3]}`}>{icon}</span>
                  <span className="text-sm font-semibold leading-tight">{t(k)}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {mosaic.map((src, i) => (
            <Reveal key={src} delay={i * 0.08} className={i % 2 ? 'translate-y-6' : ''}>
              <figure className="relative overflow-hidden rounded-[1.5rem] ring-2 ring-cream/10">
                <img src={src} alt={t('illus.alt')} loading="lazy" className="aspect-[4/3] w-full object-cover" /><IllusTag />
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Dance({ data }: { data: SiteData }) {
  const { ml, t } = useI18n()
  const videos = data.portfolio.filter((p) => p.kind === 'video')
  const chips: Key[] = ['dance.led', 'dance.heels', 'dance.choreo', 'dance.stage', 'dance.themed', 'act.miniDisco']
  return (
    <section id="dance" aria-labelledby="dance-title" className="stage-bg relative overflow-hidden py-14 md:py-20">
      <div aria-hidden className="stars absolute inset-0 opacity-60" />
      <div className={`${wrap} relative grid gap-10 lg:grid-cols-[1fr_1fr]`}>
        <div>
          <Heading id="dance-title" icon={<Sparkles className="size-7 text-gold" aria-hidden />} brush>{t('dance.title')}</Heading>
          <p className="max-w-lg text-cream/80">{ml(data.sections.dance.intro)}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {chips.map((k, i) => <li key={k} className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${['bg-magenta/15 text-magenta ring-magenta/30', 'bg-gold/15 text-gold ring-gold/30', 'bg-lilac/15 text-lilac ring-lilac/30', 'bg-[#8c6bff]/15 text-[#b9a4ff] ring-[#8c6bff]/30'][i % 4]}`}>{t(k)}</li>)}
          </ul>
          <h3 className="mb-4 mt-10 text-xl font-bold">{t('videos.title')}</h3>
          {videos.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {videos.map((v) => <VideoPlayer key={v.id} src={v.src} poster={v.poster} title={ml(v.title)} className="aspect-[9/16] max-h-[70dvh] w-full ring-1 ring-magenta/40" />)}
            </div>
          ) : <p className="rounded-2xl border border-dashed border-cream/20 p-6 text-sm text-cream/60">{t('videos.empty')}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4 self-start">
          {['/media/illus/stage-led.webp', '/media/illus/stage-heels.webp'].map((src, i) => (
            <Reveal key={src} delay={i * 0.1} className={i ? 'mt-10' : ''}>
              <figure className="relative overflow-hidden rounded-[1.5rem] ring-2 ring-[#8c6bff]/40 shadow-[0_0_40px_-10px_#8c6bff]">
                <img src={src} alt={t('illus.alt')} loading="lazy" className="aspect-[3/4] w-full object-cover" /><IllusTag />
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function GalleryBlock({ data }: { data: SiteData }) {
  const { ml, t } = useI18n()
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [all, setAll] = useState(false)
  const [index, setIndex] = useState<number | null>(null)
  const items = useMemo(() => data.portfolio.filter((p) => filter === 'all' || p.category === filter), [data.portfolio, filter])
  const shown = all ? items : items.slice(0, 5)
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Heading id="gallery-title" icon={<StarIcon />}>{t('gallery.title')}</Heading>
        {items.length > 5 && <button type="button" onClick={() => setAll(!all)} aria-expanded={all} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-magenta">
          {all ? t('gallery.viewLess') : t('gallery.viewAll')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></button>}
      </div>
      <div role="group" aria-label={t('gallery.filters')} className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {(['all', ...CATEGORIES] as const).map((c) => (
          <button key={c} type="button" onClick={() => { setFilter(c); setAll(false) }} aria-pressed={filter === c}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-[var(--dur-fast)] ${filter === c ? 'bg-magenta text-ink shadow-[0_0_18px_rgb(8_198_197/.5)]' : 'bg-cream/5 text-cream/85 ring-1 ring-cream/15 hover:ring-cream/40'}`}>
            {t(`gallery.${c}` as Key)}
          </button>
        ))}
      </div>
      {items.length === 0 ? <p className="rounded-3xl border border-dashed border-cream/20 p-10 text-center text-cream/60">{t('gallery.empty')}</p> : (
        <motion.ul layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((p, i) => (
            <motion.li layout key={p.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: dur.base }}>
              <button type="button" onClick={() => setIndex(i)} aria-label={`${t('gallery.open')}: ${ml(p.title)}`}
                className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-cream/10 transition-shadow hover:shadow-[0_0_24px_rgb(8_198_197/.45)] max-sm:aspect-[4/5]">
                <img src={p.thumb || p.poster || p.src} alt={p.is_illustration ? t('illus.alt') : ml(p.caption) || ml(p.title)} loading="lazy" decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink/85 to-transparent p-2.5 pt-8 text-xs font-semibold">
                  <span className="truncate">{ml(p.title)}</span>
                  {p.kind === 'video' && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cream text-ink"><Icon name="play" className="size-3" /></span>}
                </span>
                {p.is_illustration && <span className="absolute start-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold backdrop-blur">{t('illus.label')}</span>}
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}
      <Lightbox items={shown} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </>
  )
}

export function GallerySkills({ data }: { data: SiteData }) {
  const { ml, t } = useI18n()
  const flags: Record<string, string> = { ar: '🇹🇳', fr: '🇫🇷', en: '🇬🇧', tr: '🇹🇷' }
  const groups = ['kids', 'performance', 'qualities'] as const
  return (
    <div className={`${wrap} grid items-start gap-6 py-6 xl:grid-cols-[1.7fr_1fr]`}>
      <section id="gallery" aria-labelledby="gallery-title" className={`${panel} min-w-0 p-5 md:p-7`}><GalleryBlock data={data} /></section>
      <section id="skills" aria-labelledby="skills-title" className={`${panel} grid gap-6 p-5 sm:grid-cols-[1.4fr_1fr] md:p-7 xl:grid-cols-1`}>
        <div>
          <h2 id="skills-title" className="mb-4 font-display text-2xl font-bold"><span className="border-b-4 border-gold/80">{t('skills.title')}</span></h2>
          {groups.map((g) => (
            <div key={g} className="mb-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-cream/55">{t(`skills.${g}` as Key)}</h3>
              <ul className="flex flex-wrap gap-1.5">{data.skills.filter((s) => s.category === g).map((s) => (
                <li key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-ink/50 px-2.5 py-1 text-xs ring-1 ring-cream/10"><Check className="size-3.5 shrink-0 text-magenta" aria-hidden />{ml(s.name)}</li>
              ))}</ul>
            </div>
          ))}
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl font-bold"><span className="border-b-4 border-gold/80">{t('skills.languages')}</span></h2>
          <ul className="space-y-3">{data.languages.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl bg-ink/50 px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2 font-semibold"><span aria-hidden>{flags[l.id] ?? '🌐'}</span>{ml(l.name)}</span>
              <span className="rounded-full bg-magenta/12 px-2.5 py-0.5 text-xs font-semibold text-magenta">{ml(l.level)}</span>
            </li>
          ))}</ul>
        </div>
      </section>
    </div>
  )
}

export function Certificates({ data }: { data: SiteData }) {
  const { ml, t } = useI18n()
  return (
    <section id="certificates" aria-labelledby="certificates-title" className={`${wrap} py-10 md:py-14`}>
      <Heading id="certificates-title" icon={<Trophy className="size-7 text-gold" aria-hidden />}>{t('cert.title')}</Heading>
      <ul className="grid gap-4 md:grid-cols-3">
        {data.certificates.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.06}>
            <li className={`${panel} flex h-full flex-col p-5`}>
              <span className="mb-3 inline-flex w-fit rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold" dir="ltr">{c.period}</span>
              <h3 className="text-lg font-bold">{ml(c.title)}</h3>
              <p className="mt-1 text-sm text-cream/75">{ml(c.organization)}</p>
              {ml(c.description) && <p className="mt-2 text-sm text-cream/65">{ml(c.description)}</p>}
              <div className="mt-auto flex gap-2 pt-4">
                {c.file_url ? <>
                  <a href={c.file_url} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-magenta/15 px-4 text-sm font-semibold text-magenta"><Eye className="size-4" aria-hidden />{t('cert.view')}</a>
                  <a href={c.file_url} download className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-cream/20"><Download className="size-4" aria-hidden />{t('cert.download')}</a>
                </> : <span className="inline-flex items-center gap-2 text-xs text-cream/55"><FileText className="size-4" aria-hidden />{t('cert.pending')}</span>}
              </div>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}

export function Contact({ data }: { data: SiteData }) {
  const { ml, t, lang } = useI18n()
  const s = data.settings
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [errors, setErrors] = useState<ContactErrors>({})
  const links = channels(s, data.socials, t)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    if (fd.get('bot-field')) return // honeypot
    const v = { name: String(fd.get('name') ?? '').trim(), email: String(fd.get('email') ?? '').trim(), subject: String(fd.get('subject') ?? '').trim(), message: String(fd.get('message') ?? '').trim() }
    const errs = validateContact(v)
    setErrors(errs)
    if (Object.keys(errs).length) { form.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus(); return }
    setState('sending')
    const { error } = await supabase.from('contact_messages').insert({ ...v, lang })
    if (error) { setState('error'); return }
    // Netlify Forms copy → email notification (best effort; the message is already stored)
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ 'form-name': 'contact', ...v }).toString() }).catch(() => {})
    form.reset(); setState('ok')
  }
  const field = 'mt-2 block w-full rounded-2xl border bg-ink px-4 py-3 text-base text-cream placeholder:text-cream/30 focus:border-magenta focus:outline-none'
  const fieldsList = ['name', 'email', 'subject', 'message'] as const
  return (
    <section id="contact" aria-labelledby="contact-title" className={`${wrap} pb-10`}>
      <div className={`${panel} grid gap-8 p-5 md:p-8 lg:grid-cols-[.9fr_1.3fr_1fr]`}>
        <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-start">
          <h2 className="font-display text-2xl font-bold">{ml(s.qrLabel) || t('qr.title')}</h2>
          <p className="text-sm text-cream/70">{t('qr.sub')}</p>
          <div className="w-full max-w-[15rem]"><QRCard url={resolveSiteUrl(s)} label="" /></div>
        </div>
        <form name="contact" noValidate onSubmit={submit}>
          <Heading id="contact-title" icon={<Send className="size-6 text-lilac" aria-hidden />}>{t('contact.title')}</Heading>
          <p className="-mt-3 mb-4 text-sm text-cream/75">{ml(data.sections.contact.intro)}</p>
          <p hidden><label>Bot <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {fieldsList.map((f) => (
              <div key={f} className={`mb-4 ${f === 'message' || f === 'subject' ? 'sm:col-span-2' : ''}`}>
                <label htmlFor={`c-${f}`} className="text-sm font-semibold">{t(`contact.${f}` as Key)}</label>
                {f === 'message'
                  ? <textarea id={`c-${f}`} name={f} rows={4} maxLength={4000} aria-invalid={!!errors[f]} aria-describedby={errors[f] ? `e-${f}` : undefined} className={`${field} ${errors[f] ? 'border-lilac' : 'border-cream/15'}`} />
                  : <input id={`c-${f}`} name={f} type={f === 'email' ? 'email' : 'text'} autoComplete={f === 'subject' ? 'off' : f} maxLength={f === 'email' ? 200 : 150} dir={f === 'email' ? 'ltr' : undefined}
                      aria-invalid={!!errors[f]} aria-describedby={errors[f] ? `e-${f}` : undefined} className={`${field} ${errors[f] ? 'border-lilac' : 'border-cream/15'}`} />}
                {errors[f] && <p id={`e-${f}`} className="mt-1.5 text-sm text-lilac">{t(errors[f])}</p>}
              </div>
            ))}
          </div>
          <PressButton type="submit" disabled={state === 'sending'} className="w-full !bg-magenta !text-ink !shadow-[0_4px_0_0_var(--color-ink-3)]">
            {state === 'sending' ? t('contact.sending') : t('contact.send')}<Send className="size-4 rtl:-scale-x-100" aria-hidden /></PressButton>
          <p role="status" aria-live="polite" className={`mt-3 text-sm ${state === 'error' ? 'text-lilac' : 'text-magenta'}`}>
            {state === 'ok' ? t('contact.success') : state === 'error' ? t('contact.error') : ''}
          </p>
        </form>
        <div className="flex flex-col justify-between gap-6">
          {links.length > 0 && (
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.href}><a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  className="flex min-h-14 items-center gap-3 rounded-2xl bg-ink/50 px-3 ring-1 ring-cream/10 hover:ring-magenta/50">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-magenta/15 text-magenta">{l.icon === 'phone' ? <Phone className="size-5" /> : <Icon name={l.icon} />}</span>
                  <span className="min-w-0"><span className="block text-xs text-cream/55">{l.label}</span><span className="block truncate text-sm font-semibold" dir="ltr">{l.value}</span></span>
                </a></li>
              ))}
            </ul>
          )}
          <p className="font-script text-4xl text-cream lg:text-5xl" dir="ltr">Meriem Jaballah <span className="text-lilac">♡</span></p>
        </div>
      </div>
    </section>
  )
}

export function Footer({ data }: { data: SiteData }) {
  const { t } = useI18n()
  const links = channels(data.settings, data.socials, t)
  return (
    <footer className="relative overflow-hidden border-t border-cream/10 bg-ink pb-8 pt-10">
      <span aria-hidden className="brush bottom-14 -end-16 w-[26rem] bg-gradient-to-l from-gold to-gold/0" />
      <span aria-hidden className="brush bottom-6 -end-10 w-[20rem] bg-gradient-to-l from-magenta to-magenta/0" />
      <div className={`${wrap} relative flex flex-wrap items-center justify-between gap-6`}>
        <p dir="ltr" className="flex items-center gap-2 font-bold uppercase tracking-wide"><Crown className="w-5" />Meriem Jaballah</p>
        <nav aria-label={t('footer.nav')}><ul className="flex flex-wrap gap-x-4">
          {NAV.map((n) => <li key={n.id}><a href={`#${n.id}`} className="inline-flex min-h-11 min-w-11 items-center text-sm text-cream/80 hover:text-cream">{t(n.key)}</a></li>)}
        </ul></nav>
        {links.length > 0 && <ul className="flex gap-2">{links.map((l) => (
          <li key={l.href}><a href={l.href} aria-label={l.label} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
            className="grid size-11 place-items-center rounded-full ring-1 ring-cream/20 hover:ring-magenta">{l.icon === 'phone' ? <Phone className="size-5" /> : <Icon name={l.icon} />}</a></li>
        ))}</ul>}
        <div className="flex items-center gap-3">
          <LangMenu up />
          <a href="#top" aria-label={t('footer.top')} className="grid size-12 place-items-center rounded-full ring-2 ring-cream/50 hover:ring-cream"><Icon name="up" /></a>
        </div>
      </div>
      <p className={`${wrap} relative mt-6 text-center text-xs text-cream/55`}>© {new Date().getFullYear()} Meriem Jaballah. {t('footer.rights')}</p>
    </footer>
  )
}

