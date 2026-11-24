import { animate, AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, Award, Baby, CalendarDays, Check, ChevronLeft, ChevronRight, Download, Eye, FileText, Globe2, Heart, Medal,
  Music, Phone, Play, Quote, Send, Sparkles, Star, Trophy, Users, Volleyball, Volume2, VolumeX,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Crown, LangMenu, NAV, Signature } from '../components/chrome'
import { Lightbox, QRCard } from '../components/media'
import { Icon, PressButton, Reveal, ScrambleText } from '../components/ui'
import { CATEGORIES, SITE_URL_FALLBACK, type Category, type Stat } from '../content/defaults'
import type { SiteData } from '../content/useSiteData'
import { useI18n } from '../i18n/I18n'
import type { Key } from '../i18n/dict'
import { dur, ease } from '../lib/motion'
import { supabase } from '../lib/supabase'
import { validateContact, type ContactErrors } from './validate'

const wrap = 'mx-auto max-w-[88rem] px-4 md:px-8'
export const btnRed = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-magenta px-6 text-sm font-semibold text-cream shadow-[0_12px_30px_-10px_rgb(154_3_30/.9)] transition-[transform,filter] duration-[var(--dur-fast)] hover:brightness-115 active:scale-[.97]'
const btnLine = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-cream/85 px-6 text-sm font-semibold text-cream transition-colors duration-[var(--dur-fast)] hover:bg-cream hover:text-ink active:scale-[.97]'

function IllusTag({ top = false }: { top?: boolean }) {
  const { t } = useI18n()
  return <span className={`pointer-events-none absolute ${top ? 'top-20 lg:top-auto lg:bottom-2' : 'bottom-2'} end-2 z-10 rounded-full bg-ink/65 px-2 py-0.5 text-[10px] font-semibold text-cream/80 backdrop-blur`}>{t('illus.label')}</span>
}

/** Script heading as in the mockups ("About Meriem", "My Gallery"…). */
function ScriptTitle({ id, children, className = '' }: { id?: string; children: ReactNode; className?: string }) {
  return <h2 id={id} className={`font-script text-5xl leading-none md:text-6xl ${className}`}>{children}</h2>
}

/** Curved section edge: beige ⇄ black wave with light-blue and burgundy ribbons. */
function Wave({ top, bottom, flip = false }: { top: string; bottom: string; flip?: boolean }) {
  return (
    <div aria-hidden className={`relative -my-px h-16 md:h-24 ${flip ? '-scale-x-100' : ''}`} style={{ background: bottom }}>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M0 0h1440v40C1180 120 900 10 620 60S170 110 0 70z" fill={top} />
        <path d="M0 70c170 40 340-10 620-60s560 110 820 30" fill="none" stroke="#add9f4" strokeWidth="6" opacity=".9" />
        <path d="M0 82c200 34 360-8 640-54s540 104 800 28" fill="none" stroke="#9a031e" strokeWidth="5" opacity=".85" />
      </svg>
    </div>
  )
}

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
export function channels(s: SiteData['settings'], socials: SiteData['socials'], t: (k: Key) => string) {
  const list: { icon: string; label: string; value: string; href: string }[] = []
  if (s.email) list.push({ icon: 'mail', label: t('contact.email'), value: s.email, href: `mailto:${s.email}` })
  if (s.phone) list.push({ icon: 'phone', label: t('contact.phone'), value: s.phone, href: `tel:${s.phone.replace(/\s/g, '')}` })
  if (s.whatsapp) list.push({ icon: 'whatsapp', label: t('contact.whatsapp'), value: s.phone || 'WhatsApp', href: s.whatsapp })
  if (s.instagram) list.push({ icon: 'instagram', label: t('contact.instagram'), value: '@' + s.instagram.replace(/\/$/, '').split('/').pop(), href: s.instagram })
  for (const l of socials) if (!list.some((x) => x.href === l.url)) list.push({ icon: l.platform, label: l.platform, value: l.platform, href: l.url })
  return list
}
const ChannelIcon = ({ name }: { name: string }) => (name === 'phone' ? <Phone className="size-5" aria-hidden /> : <Icon name={name} />)

/** Motion-design logo intro (MJ, 10 s): muted loop by default, sound on demand. */
function IntroVideo() {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const v = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const toggle = () => {
    const el = v.current; if (!el) return
    el.muted = !muted; setMuted(!muted)
    if (muted) { el.currentTime = 0; void el.play() }
  }
  return (
    <div className="absolute start-3 top-3 z-10 w-24 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-cream/25 sm:w-28 lg:start-[-8%] lg:top-auto lg:bottom-[16%] lg:w-36">
      <video ref={v} src="/media/intro/mj-intro.mp4" poster="/media/intro/mj-intro-poster.webp" autoPlay={!reduce} muted={muted} loop playsInline preload="metadata"
        aria-label={t('hero.intro')} className="aspect-[9/16] w-full bg-ink object-cover" />
      <button type="button" onClick={toggle} aria-pressed={!muted} aria-label={muted ? t('hero.soundOn') : t('hero.soundOff')}
        className="absolute bottom-1.5 end-1.5 grid size-9 place-items-center rounded-full bg-ink/70 text-cream backdrop-blur transition hover:bg-magenta focus-visible:outline-2 focus-visible:outline-lime">
        {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
      </button>
    </div>
  )
}

export function Hero({ data }: { data: SiteData }) {
  const { ml, t } = useI18n()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08])
  const icons = [<Trophy key="t" className="size-8" />, <Globe2 key="g" className="size-8" />, <Medal key="m" className="size-8" />]
  return (
    <section ref={ref} id="top" aria-labelledby="hero-title" className="smoke relative isolate overflow-hidden pt-16 md:pt-20">
      <div aria-hidden className="stars absolute inset-0 -z-10 opacity-40" />
      <motion.figure style={{ y: imgY, scale: imgScale }} className="relative mx-auto h-[52svh] max-h-[30rem] lg:absolute lg:inset-y-0 lg:end-[4%] lg:h-auto lg:max-h-none lg:w-[44%]">
        <img src="/media/illus/dancer-hero.webp" alt={t('illus.alt')} fetchPriority="high"
          className="h-full w-full object-cover object-[50%_20%] [mask-image:linear-gradient(to_bottom,#000_70%,transparent)] lg:[mask-image:linear-gradient(to_right,transparent,#000_25%,#000_85%,transparent),linear-gradient(to_bottom,#000_75%,transparent)] lg:[mask-composite:intersect]" />
        <IllusTag top />
        <IntroVideo />
      </motion.figure>
      <div className={`${wrap} relative -mt-36 grid pb-10 lg:mt-0 lg:min-h-[44rem] lg:items-center lg:pb-16`}>
        <div className="relative z-10 lg:max-w-[52%]">
          <Crown className="ms-[38%] mb-1 w-14 text-cream lg:w-20" />
          <h1 id="hero-title">
            <Signature stacked className="text-[5.2rem] max-[359px]:text-[4.4rem] sm:text-[6.5rem] lg:hidden" />
            <Signature className="hidden text-[clamp(6rem,9vw,9.5rem)] lg:flex" />
          </h1>
          <p className="mt-3 text-sm font-medium text-cream/90 md:text-base">{t('hero.roles')}</p>
          <p className="mt-2 font-script text-[2.6rem] leading-tight max-[359px]:text-4xl md:text-6xl">
            <span className="text-cream">{t('hero.tag1')} </span><span className="text-magenta [text-shadow:0_0_18px_rgb(154_3_30/.5)]">{t('hero.tag2')}</span>
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#journey" className={btnRed}><ScrambleText text={t('hero.ctaJourney')} /><ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></a>
            <Link to="/reels" className={btnLine}><Play className="size-4 fill-current" aria-hidden />{t('hero.watch')}</Link>
          </div>
          <ul className="mt-10 grid max-w-xl grid-cols-3 gap-2 sm:divide-x sm:divide-cream/15 rtl:sm:divide-x-reverse">
            {data.sections.about.stats.map((st, i) => (
              <li key={i} className="flex flex-col items-center gap-1.5 rounded-2xl bg-cream/5 p-3 text-center ring-1 ring-cream/10 sm:flex-row sm:gap-3 sm:rounded-none sm:bg-transparent sm:p-0 sm:px-4 sm:text-start sm:ring-0">
                <span aria-hidden className="text-lime">{icons[i] ?? <Star className="size-8" />}</span>
                <span><span className="block text-2xl font-semibold leading-none"><Counter stat={st} /></span><span className="block text-xs text-cream/75">{ml(st.label)}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Wave top="transparent" bottom="transparent" />
    </section>
  )
}

export function AboutJourney({ data }: { data: SiteData }) {
  const { ml, t, lang } = useI18n()
  const [open, setOpen] = useState<string | null>(null)
  const icons = [<CalendarDays key="a" />, <Trophy key="b" />, <Star key="c" />]
  return (
    <div className="paper relative">
      <div className={`${wrap} grid gap-10 py-14 lg:grid-cols-[1.15fr_1fr] lg:py-20`}>
        <section id="about" aria-labelledby="about-title" className="grid items-center gap-6 sm:grid-cols-[1fr_.8fr]">
          <Reveal>
            <ScriptTitle id="about-title">{ml(data.sections.about.title)}</ScriptTitle>
            <p className="mt-4 text-[15px] leading-relaxed text-ink/80">{ml(data.sections.about.body)}</p>
            <dl className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <div className="rounded-full bg-ink/5 px-3 py-1.5"><dt className="sr-only">{t('about.based')}</dt><dd>{t('about.based')} {ml(data.sections.about.location)}</dd></div>
              <div className="rounded-full bg-ink/5 px-3 py-1.5"><dt className="sr-only">{t('about.works')}</dt><dd>{ml(data.sections.about.relocation)}</dd></div>
            </dl>
            <a href="#activities" className={`${btnRed} mt-6 !min-h-11 !px-5`}>{t('about.more')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></a>
          </Reveal>
          <Reveal delay={0.1} className="relative mx-auto w-full max-w-xs">
            <span aria-hidden className="absolute -inset-4 -z-0 rounded-[45%_55%_50%_50%] bg-lime/70 blur-[2px]" />
            <figure className="relative overflow-hidden rounded-[42%_58%_48%_52%/55%_45%_55%_45%] ring-4 ring-cream">
              <motion.img initial={{ scale: 1.15 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: ease.out }}
                src="/media/illus/dancer-portrait.webp" alt={t('illus.alt')} loading="lazy" className="aspect-square w-full object-cover" />
              <IllusTag />
            </figure>
          </Reveal>
        </section>

        <section id="journey" aria-labelledby="journey-title" className="lg:border-s lg:border-ink/15 lg:ps-10">
          <ScriptTitle id="journey-title" className="!text-4xl md:!text-5xl">{t('journey.title')}</ScriptTitle>
          <ol className="relative mt-8 grid gap-6 md:grid-cols-3 md:gap-3">
            <span aria-hidden className="absolute start-5 top-5 hidden h-0.5 w-[calc(100%-2.5rem)] bg-ink/70 md:block" />
            <span aria-hidden className="absolute inset-y-5 start-5 w-0.5 bg-ink/70 md:hidden" />
            {data.experiences.map((e, i) => {
              const isOpen = open === e.id
              return (
                <motion.li key={e.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: dur.slow, ease: ease.out }}
                  className="relative ps-14 md:ps-0 md:text-center">
                  <span aria-hidden className="absolute start-0 top-0 grid size-10 place-items-center rounded-full bg-cream text-ink ring-2 ring-ink md:relative md:mx-auto md:mb-3 [&>svg]:size-5">{icons[i % 3]}</span>
                  <button type="button" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen} aria-controls={`exp-${e.id}`} className="w-full rounded-xl p-1 text-start hover:bg-ink/5 md:text-center">
                    <span className="block text-base font-bold" dir="ltr">{e.period}</span>
                    <span className="block text-sm font-medium leading-snug">{ml(e.role)}</span>
                    <span className="block text-xs text-ink/60">{ml(e.company)}</span>
                  </button>
                  <motion.div id={`exp-${e.id}`} initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} transition={{ duration: dur.base, ease: ease.out }} className="overflow-hidden text-start">
                    <ul className="space-y-1 pt-2 text-xs text-ink/75">{(e.bullets[lang]?.length ? e.bullets[lang] : e.bullets.en).map((b, j) => <li key={j} className="flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-magenta" aria-hidden />{b}</li>)}</ul>
                  </motion.div>
                </motion.li>
              )
            })}
          </ol>
        </section>
      </div>
    </div>
  )
}

export function Activities({ data }: { data: SiteData }) {
  const { ml, t, lang } = useI18n()
  const chips: [Key, ReactNode][] = [['dance.title', <Music key="1" />], ['act.babyGym', <Baby key="2" />], ['act.babyBasket', <Volleyball key="3" />], ['act.miniDisco', <Sparkles key="4" />], ['act.groups', <Users key="5" />]]
  return (
    <section id="activities" aria-labelledby="activities-title" className="paper relative overflow-hidden pb-16">
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <figure className="relative h-48 overflow-hidden lg:h-72 lg:[clip-path:polygon(0_0,100%_8%,92%_100%,0_92%)]">
          <img src="/media/illus/class-dance.webp" alt={t('illus.alt')} loading="lazy" className="h-full w-full object-cover" /><IllusTag />
        </figure>
        <div className="px-4 text-center">
          <ScriptTitle id="activities-title" className="!text-5xl">{t('activities.heading')}</ScriptTitle>
          <p className="mt-2 text-sm font-semibold tracking-wide text-ink/70">{t('activities.tagline')}</p>
          <ul className="mt-5 flex flex-wrap justify-center gap-3">
            {chips.map(([k, icon]) => (
              <li key={k} className="flex w-20 flex-col items-center gap-1.5 text-xs font-medium">
                <span className="grid size-14 place-items-center rounded-full bg-ink text-cream ring-4 ring-lime/50 transition-transform hover:-translate-y-1 [&>svg]:size-6">{icon}</span>{t(k)}
              </li>
            ))}
          </ul>
        </div>
        <figure className="relative h-48 overflow-hidden lg:h-72 lg:[clip-path:polygon(8%_8%,100%_0,100%_92%,0_100%)]">
          <img src="/media/illus/kids-cheer.webp" alt={t('illus.alt')} loading="lazy" className="h-full w-full object-cover" /><IllusTag />
        </figure>
      </div>
      <div id="services" className={`${wrap} mt-10`}>
        <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {data.services.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.07}>
              <li className="group relative isolate h-full overflow-hidden rounded-3xl bg-ink text-cream shadow-[0_20px_40px_-20px_rgb(7_7_7/.7)]">
                <img src={s.image} alt={t('illus.alt')} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-[var(--dur-slow)] group-hover:scale-105" />
                <span aria-hidden className="absolute inset-x-0 top-0 aspect-[4/3] bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                <div className="relative -mt-10 p-4">
                  <h3 className="text-base font-semibold leading-snug md:text-lg">{ml(s.title)}</h3>
                  <p className="mt-1.5 hidden text-sm text-cream/75 sm:block">{ml(s.description)}</p>
                  <ul className="mt-3 hidden flex-wrap gap-1.5 md:flex">{(s.tags[lang]?.length ? s.tags[lang] : s.tags.en).map((tg) => <li key={tg} className="rounded-full bg-lime/15 px-2 py-0.5 text-[11px] text-lime">{tg}</li>)}</ul>
                </div>
                <span className="absolute start-2 top-2 rounded-full bg-ink/65 px-2 py-0.5 text-[10px] font-semibold text-cream/80">{t('illus.label')}</span>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function ReelsStrip({ data }: { data: SiteData }) {
  const { t } = useI18n()
  const reels = data.reels.slice(0, 6)
  return (
    <section id="reels" aria-labelledby="reels-title" className="stage-bg relative overflow-hidden py-14 md:py-20">
      <div className={wrap}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div><ScriptTitle id="reels-title">{t('reels.title')}</ScriptTitle><p className="mt-1 text-sm text-cream/70">{t('reels.subtitle')}</p></div>
          <Link to="/reels" className={`${btnLine} !min-h-11`}>{t('reels.viewAll')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></Link>
        </div>
        {reels.length === 0 ? <p className="rounded-3xl border border-dashed border-cream/25 p-8 text-center text-cream/70">{t('reels.empty')}</p> : (
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-6">
            {reels.map((r, i) => (
              <motion.li key={r.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: dur.slow, ease: ease.out }} className="w-40 shrink-0 snap-start md:w-auto">
                <Link to={`/reels/${r.id}`} className="group relative block aspect-[9/16] overflow-hidden rounded-2xl ring-1 ring-cream/15">
                  {r.cover_url ? <img src={r.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] group-hover:scale-105" /> : <span className="block h-full w-full bg-ink-3" />}
                  <span className="absolute inset-0 grid place-items-center"><span className="grid size-12 place-items-center rounded-full bg-cream/90 text-ink transition-transform group-hover:scale-110"><Play className="size-5 fill-current" aria-hidden /></span></span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-2.5 pt-10 text-xs font-medium">{r.title || r.caption.slice(0, 50)}</span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
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
  const shown = all ? items : items.slice(0, 6)
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ScriptTitle id="gallery-title">{t('gallery.title')}</ScriptTitle>
        {items.length > 6 && <button type="button" onClick={() => setAll(!all)} aria-expanded={all} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cream hover:text-lime">
          {all ? t('gallery.viewLess') : t('gallery.viewAll')}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></button>}
      </div>
      <div role="group" aria-label={t('gallery.filters')} className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {(['all', ...CATEGORIES] as const).map((c) => (
          <button key={c} type="button" onClick={() => { setFilter(c); setAll(false) }} aria-pressed={filter === c}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-[var(--dur-fast)] ${filter === c ? 'bg-magenta text-cream ring-2 ring-cream/80' : 'text-cream/85 hover:text-cream'}`}>
            {t(`gallery.${c}` as Key)}
          </button>
        ))}
      </div>
      {items.length === 0 ? <p className="rounded-3xl border border-dashed border-cream/20 p-10 text-center text-cream/60">{t('gallery.empty')}</p> : (
        <motion.ul layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shown.map((p, i) => (
            <motion.li layout key={p.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: dur.base }}>
              <button type="button" onClick={() => setIndex(i)} aria-label={`${t('gallery.open')}: ${ml(p.title)}`}
                className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-cream/15 transition-shadow hover:shadow-[0_0_28px_rgb(173_217_244/.35)] max-sm:aspect-[4/5]">
                <img src={p.thumb || p.poster || p.src} alt={p.is_illustration ? t('illus.alt') : ml(p.caption) || ml(p.title)} loading="lazy" decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink/85 to-transparent p-2.5 pt-8 text-xs font-medium">
                  <span className="truncate">{ml(p.title)}</span>
                  {p.kind === 'video' && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cream text-ink"><Icon name="play" className="size-3" /></span>}
                </span>
                {p.is_illustration && <span className="absolute start-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-lime backdrop-blur">{t('illus.label')}</span>}
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}
      <Lightbox items={shown} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </>
  )
}

export function Gallery({ data }: { data: SiteData }) {
  return (
    <section id="gallery" aria-labelledby="gallery-title" className="bg-ink py-14 md:py-20">
      <div className={wrap}><GalleryBlock data={data} /></div>
    </section>
  )
}

export function SkillsCertificates({ data }: { data: SiteData }) {
  const { ml, t } = useI18n()
  const flags: Record<string, string> = { ar: '🇹🇳', fr: '🇫🇷', en: '🇬🇧', tr: '🇹🇷' }
  const groups = ['kids', 'performance', 'qualities'] as const
  return (
    <div className="paper">
      <div className={`${wrap} grid gap-10 py-14 md:py-20 lg:grid-cols-[1.4fr_.8fr_1fr]`}>
        <section id="skills" aria-labelledby="skills-title">
          <ScriptTitle id="skills-title" className="!text-4xl md:!text-5xl">{t('skills.title')}</ScriptTitle>
          <div className="mt-6 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {groups.map((g) => (
              <div key={g}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-ink/55">{t(`skills.${g}` as Key)}</h3>
                <ul className="flex flex-wrap gap-1.5">{data.skills.filter((s) => s.category === g).map((s) => (
                  <li key={s.id} className="rounded-full bg-cream px-2.5 py-1 text-xs ring-1 ring-ink/15 shadow-[0_2px_0_rgb(7_7_7/.06)]">{ml(s.name)}</li>
                ))}</ul>
              </div>
            ))}
          </div>
        </section>
        <section aria-labelledby="languages-title" className="lg:border-s lg:border-ink/15 lg:ps-8">
          <h2 id="languages-title" className="font-script text-4xl">{t('skills.languages')}</h2>
          <ul className="mt-5 space-y-2.5">{data.languages.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 border-b border-ink/10 pb-2 text-sm">
              <span className="flex items-center gap-2 font-medium"><span aria-hidden>{flags[l.id] ?? '🌐'}</span>{ml(l.name)}</span>
              <span className="text-xs text-ink/60">{ml(l.level)}</span>
            </li>
          ))}</ul>
        </section>
        <section id="certificates" aria-labelledby="certificates-title" className="lg:border-s lg:border-ink/15 lg:ps-8">
          <h2 id="certificates-title" className="flex items-center gap-2 font-display text-xl font-bold italic"><Award className="size-6 text-magenta" aria-hidden />{t('cert.title')}</h2>
          <ul className="mt-5 space-y-3">
            {data.certificates.map((c) => (
              <li key={c.id} className="rounded-2xl bg-cream p-3 ring-1 ring-ink/10">
                <p className="flex items-start gap-2 text-sm font-semibold"><Check className="mt-0.5 size-4 shrink-0 rounded-sm bg-magenta p-0.5 text-cream" aria-hidden />{ml(c.title)}</p>
                <p className="ms-6 text-xs text-ink/65">{ml(c.organization)} · <span dir="ltr">{c.period}</span></p>
                <div className="ms-6 mt-2 flex gap-2">
                  {c.file_url ? <>
                    <a href={c.file_url} target="_blank" rel="noopener" className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-magenta px-3 text-xs font-semibold text-cream"><Eye className="size-3.5" aria-hidden />{t('cert.view')}</a>
                    <a href={c.file_url} download className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 ring-ink/25"><Download className="size-3.5" aria-hidden />{t('cert.download')}</a>
                  </> : <span className="inline-flex items-center gap-1.5 text-[11px] text-ink/55"><FileText className="size-3.5" aria-hidden />{t('cert.pending')}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export function Reviews({ data }: { data: SiteData }) {
  const { t, lang } = useI18n()
  const reduce = useReducedMotion()
  const list = data.testimonials
  const [i, setI] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const cur = list[i]
  const go = (d: number) => setI((x) => (x + d + list.length) % list.length)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('website')) return // honeypot
    const name = String(f.get('name') ?? '').trim(), content = String(f.get('content') ?? '').trim()
    if (!name || content.length < 10) { setState('error'); return }
    setState('sending')
    const rating = Number(f.get('rating')) || null
    const { error } = await supabase.rpc('submit_testimonial', {
      p_name: name, p_email: String(f.get('email') ?? ''), p_role: String(f.get('role') ?? ''), p_org: String(f.get('org') ?? ''), p_rating: rating, p_content: content, p_lang: lang,
    })
    setState(error ? 'error' : 'ok')
    if (!error) e.currentTarget.reset()
  }
  const field = 'mt-1 block w-full rounded-xl border border-ink/15 bg-cream px-3 py-2.5 text-base text-ink focus:border-magenta focus:outline-none'
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="paper relative overflow-hidden py-14 md:py-20">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[1.3fr_1fr]`}>
        <div>
          <ScriptTitle id="reviews-title">{t('reviews.title')}</ScriptTitle>
          {cur ? (
            <div className="relative mt-8">
              <Quote aria-hidden className="absolute -start-2 -top-6 size-16 text-magenta/20" />
              <AnimatePresence mode="wait">
                <motion.figure key={cur.id} initial={reduce ? false : { opacity: 0, x: 40, filter: 'blur(6px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -40 }} transition={{ duration: dur.slow, ease: ease.out }}>
                  {cur.rating && <p aria-label={`${cur.rating}/5`} className="mb-3 flex gap-1 text-magenta">{Array.from({ length: 5 }, (_, k) => <Star key={k} className={`size-5 ${k < cur.rating! ? 'fill-current' : 'opacity-25'}`} aria-hidden />)}</p>}
                  <blockquote className="font-display text-xl leading-relaxed md:text-2xl">“{cur.content_i18n?.[lang] || cur.content}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    {cur.avatar_url ? <img src={cur.avatar_url} alt="" className="size-12 rounded-full object-cover" /> : <span className="grid size-12 place-items-center rounded-full bg-ink font-script text-2xl text-cream">{cur.reviewer_name[0]}</span>}
                    <span><span className="block font-semibold">{cur.reviewer_name}</span><span className="block text-sm text-ink/65">{[cur.reviewer_role, cur.organization].filter(Boolean).join(' · ')}</span></span>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
              {list.length > 1 && <div className="mt-6 flex gap-2">
                <button type="button" onClick={() => go(-1)} aria-label={t('reviews.prev')} className="grid size-12 place-items-center rounded-full ring-1 ring-ink/25 hover:bg-ink hover:text-cream"><ChevronLeft className="rtl:rotate-180" aria-hidden /></button>
                <button type="button" onClick={() => go(1)} aria-label={t('reviews.next')} className="grid size-12 place-items-center rounded-full bg-magenta text-cream"><ChevronRight className="rtl:rotate-180" aria-hidden /></button>
                <span className="ms-2 self-center text-sm text-ink/60">{i + 1} / {list.length}</span>
              </div>}
            </div>
          ) : <p className="mt-6 rounded-3xl border border-dashed border-ink/25 p-8 text-ink/70">{t('reviews.empty')}</p>}
        </div>
        <div className="rounded-[2rem] bg-ink p-6 text-cream md:p-8">
          <button type="button" onClick={() => setFormOpen(!formOpen)} aria-expanded={formOpen} className="flex w-full items-center justify-between gap-3 text-start">
            <span className="font-script text-4xl">{t('reviews.leave')}</span><Heart className={`size-6 text-magenta transition-transform ${formOpen ? 'scale-125 fill-current' : ''}`} aria-hidden />
          </button>
          <motion.div initial={false} animate={{ height: formOpen ? 'auto' : 0, opacity: formOpen ? 1 : 0 }} className="overflow-hidden">
            <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
              <p hidden><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></p>
              <label className="text-sm font-medium text-cream">{t('reviews.name')}<input name="name" required maxLength={80} className={field} /></label>
              <label className="text-sm font-medium text-cream">{t('reviews.email')}<input name="email" type="email" maxLength={200} dir="ltr" className={field} /></label>
              <label className="text-sm font-medium text-cream">{t('reviews.role')}<input name="role" maxLength={80} className={field} /></label>
              <label className="text-sm font-medium text-cream">{t('reviews.org')}<input name="org" maxLength={120} className={field} /></label>
              <label className="text-sm font-medium text-cream sm:col-span-2">{t('reviews.rating')}
                <select name="rating" className={field} defaultValue=""><option value="">—</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}</select></label>
              <label className="text-sm font-medium text-cream sm:col-span-2">{t('reviews.text')}<textarea name="content" required minLength={10} maxLength={1500} rows={4} className={field} /></label>
              <button className={`${btnRed} sm:col-span-2`} disabled={state === 'sending'}>{state === 'sending' ? t('contact.sending') : t('reviews.submit')}<Send className="size-4 rtl:-scale-x-100" aria-hidden /></button>
              <p role="status" aria-live="polite" className={`text-sm sm:col-span-2 ${state === 'error' ? 'text-[#ff8a9e]' : 'text-lime'}`}>
                {state === 'ok' ? t('reviews.pending') : state === 'error' ? t('reviews.error') : ''}
              </p>
            </form>
          </motion.div>
        </div>
      </div>
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
  const field = 'mt-2 block w-full rounded-2xl border bg-ink-2 px-4 py-3 text-base text-cream placeholder:text-cream/30 focus:border-lime focus:outline-none'
  const fieldsList = ['name', 'email', 'subject', 'message'] as const
  return (
    <section id="contact" aria-labelledby="contact-title" className="smoke relative overflow-hidden py-14 md:py-20">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[1.2fr_1fr]`}>
        <form name="contact" noValidate onSubmit={submit}>
          <ScriptTitle id="contact-title">{t('contact.title')}</ScriptTitle>
          <p className="mb-6 mt-2 text-sm text-cream/75">{ml(data.sections.contact.intro)}</p>
          <p hidden><label>Bot <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {fieldsList.map((f) => (
              <div key={f} className={`mb-4 ${f === 'message' || f === 'subject' ? 'sm:col-span-2' : ''}`}>
                <label htmlFor={`c-${f}`} className="text-sm font-medium">{t(`contact.${f}` as Key)}</label>
                {f === 'message'
                  ? <textarea id={`c-${f}`} name={f} rows={4} maxLength={4000} aria-invalid={!!errors[f]} aria-describedby={errors[f] ? `e-${f}` : undefined} className={`${field} ${errors[f] ? 'border-[#ff8a9e]' : 'border-cream/15'}`} />
                  : <input id={`c-${f}`} name={f} type={f === 'email' ? 'email' : 'text'} autoComplete={f === 'subject' ? 'off' : f} maxLength={f === 'email' ? 200 : 150} dir={f === 'email' ? 'ltr' : undefined}
                      aria-invalid={!!errors[f]} aria-describedby={errors[f] ? `e-${f}` : undefined} className={`${field} ${errors[f] ? 'border-[#ff8a9e]' : 'border-cream/15'}`} />}
                {errors[f] && <p id={`e-${f}`} className="mt-1.5 text-sm text-[#ff8a9e]">{t(errors[f])}</p>}
              </div>
            ))}
          </div>
          <PressButton type="submit" disabled={state === 'sending'} className="w-full !bg-magenta !text-cream">
            {state === 'sending' ? t('contact.sending') : t('contact.send')}<Send className="size-4 rtl:-scale-x-100" aria-hidden /></PressButton>
          <p role="status" aria-live="polite" className={`mt-3 text-sm ${state === 'error' ? 'text-[#ff8a9e]' : 'text-lime'}`}>
            {state === 'ok' ? t('contact.success') : state === 'error' ? t('contact.error') : ''}
          </p>
        </form>
        <div className="flex flex-col items-center gap-6 rounded-[2.5rem] bg-ink/60 p-6 text-center ring-1 ring-cream/10 lg:items-start lg:text-start">
          <p className="font-script text-5xl leading-none">{ml(s.qrLabel) || t('qr.title')}</p>
          <p className="text-sm text-cream/70">{t('qr.sub')}</p>
          <div className="w-full max-w-[15rem]"><QRCard url={resolveSiteUrl(s)} label="" /></div>
          {links.length > 0 && <ul className="flex flex-wrap gap-2">{links.map((l) => (
            <li key={l.href}><a href={l.href} aria-label={l.label} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
              className="grid size-12 place-items-center rounded-full ring-2 ring-cream/70 hover:bg-cream hover:text-ink"><ChannelIcon name={l.icon} /></a></li>
          ))}</ul>}
        </div>
      </div>
    </section>
  )
}

export function Footer({ data }: { data: SiteData }) {
  const { t } = useI18n()
  const links = channels(data.settings, data.socials, t)
  return (
    <footer className="relative overflow-hidden bg-ink pb-8 pt-10">
      <span aria-hidden className="brush bottom-16 -end-16 w-[26rem] bg-gradient-to-l from-magenta to-magenta/0" />
      <span aria-hidden className="brush bottom-8 -end-10 w-[20rem] bg-gradient-to-l from-lime to-lime/0" />
      <div className={`${wrap} relative flex flex-wrap items-center justify-between gap-6`}>
        <p dir="ltr" className="font-script text-5xl">Meriem Jaballah <Heart className="inline size-6 text-cream" aria-hidden /></p>
        <nav aria-label={t('footer.nav')}><ul className="flex flex-wrap gap-x-4">
          {NAV.map((n) => <li key={n.id}><a href={`/#${n.id}`} className="inline-flex min-h-11 min-w-11 items-center text-sm text-cream/80 hover:text-cream">{t(n.key)}</a></li>)}
        </ul></nav>
        {links.length > 0 && <ul className="flex gap-2">{links.map((l) => (
          <li key={l.href}><a href={l.href} aria-label={l.label} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
            className="grid size-11 place-items-center rounded-full ring-1 ring-cream/30 hover:ring-lime"><ChannelIcon name={l.icon} /></a></li>
        ))}</ul>}
        <div className="flex items-center gap-3">
          <LangMenu up />
          <a href="#top" aria-label={t('footer.top')} className="grid size-12 place-items-center rounded-full bg-magenta text-cream shadow-[0_8px_24px_-8px_rgb(154_3_30/.9)]"><Icon name="up" /></a>
        </div>
      </div>
      <p className={`${wrap} relative mt-6 text-center text-xs text-cream/55`}>© {new Date().getFullYear()} Meriem Jaballah. {t('footer.rights')}</p>
    </footer>
  )
}

