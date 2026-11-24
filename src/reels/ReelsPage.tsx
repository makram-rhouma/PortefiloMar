import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Eye, Heart, Loader2, MessageCircle, Play, RotateCcw, Send, Share2, Volume2, VolumeX, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Header, Logo } from '../components/chrome'
import type { Reel } from '../content/defaults'
import { useSiteData, type SiteData } from '../content/useSiteData'
import { I18nProvider, useI18n } from '../i18n/I18n'
import type { Key } from '../i18n/dict'
import { dur, ease } from '../lib/motion'
import { supabase } from '../lib/supabase'

type Stats = Record<string, { likes: number; comments: number; views: number }>
type Comment = { id: string; display_name: string; content: string; created_at: string; admin_reply: string | null }

/** Visitor identity for likes/comments: a Supabase anonymous session (rate limited by Supabase per IP). */
async function visitorId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session.user.id
  const { data: d, error } = await supabase.auth.signInAnonymously()
  if (error || !d.user) throw new Error('identity')
  return d.user.id
}
const browserKey = () => {
  let k = localStorage.getItem('mj-visitor')
  if (!k) { k = crypto.randomUUID(); localStorage.setItem('mj-visitor', k) }
  return k
}
const reelUrl = (id: string) => `${location.origin}/reels/${id}`
const fmt = (n = 0) => new Intl.NumberFormat(document.documentElement.lang, { notation: 'compact' }).format(n)

function useReelsData() {
  const [stats, setStats] = useState<Stats>({})
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const load = useCallback(async () => {
    const { data } = await supabase.rpc('reel_stats')
    setStats(Object.fromEntries(((data ?? []) as { reel_id: string; likes: number; comments: number; views: number }[]).map((r) => [r.reel_id, { likes: Number(r.likes), comments: Number(r.comments), views: Number(r.views) }])))
    const { data: s } = await supabase.auth.getSession()
    if (s.session) {
      const { data: mine } = await supabase.from('reel_reactions').select('reel_id').eq('user_id', s.session.user.id)
      setLiked(new Set((mine ?? []).map((r) => r.reel_id as string)))
    }
  }, [])
  useEffect(() => { void load() }, [load])
  const toggleLike = async (id: string): Promise<string | null> => {
    const was = liked.has(id)
    // optimistic, then confirmed by the database (unique (reel_id, user_id) prevents duplicates)
    setLiked((s) => { const n = new Set(s); if (was) n.delete(id); else n.add(id); return n })
    setStats((s) => ({ ...s, [id]: { ...(s[id] ?? { comments: 0, views: 0, likes: 0 }), likes: Math.max(0, (s[id]?.likes ?? 0) + (was ? -1 : 1)) } }))
    try {
      const uid = await visitorId()
      const { error } = was
        ? await supabase.from('reel_reactions').delete().eq('reel_id', id).eq('user_id', uid)
        : await supabase.from('reel_reactions').upsert({ reel_id: id, user_id: uid }, { onConflict: 'reel_id,user_id', ignoreDuplicates: true })
      if (error) throw error
      return null
    } catch (e) {
      void load() // roll back to the truth
      return (e as Error).message === 'identity' ? 'reels.identityError' : 'reels.error'
    }
  }
  const view = (id: string) => {
    const seen = `mj-viewed-${id}`
    if (sessionStorage.getItem(seen)) return
    sessionStorage.setItem(seen, '1')
    void supabase.rpc('record_reel_view', { p_reel: id, p_visitor: browserKey() })
  }
  return { stats, liked, toggleLike, view }
}

function Comments({ reel, onClose, inline = false }: { reel: Reel; onClose?: () => void; inline?: boolean }) {
  const { t } = useI18n()
  const [list, setList] = useState<Comment[] | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: Key } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    void supabase.from('reel_comments').select('id,display_name,content,created_at,admin_reply').eq('reel_id', reel.id).eq('moderation_status', 'approved').order('created_at')
      .then(({ data }) => setList((data ?? []) as Comment[]))
  }, [reel.id])
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const display_name = String(f.get('name') ?? '').trim(), content = String(f.get('content') ?? '').trim()
    if (!display_name || content.length < 2) return
    setBusy(true); setMsg(null)
    try {
      const user_id = await visitorId()
      const { error } = await supabase.from('reel_comments').insert({ reel_id: reel.id, user_id, display_name, content })
      if (error) setMsg({ ok: false, text: error.code === 'P0429' ? 'reels.tooMany' : 'reels.error' })
      else { setMsg({ ok: true, text: 'reels.pending' }); form.reset() }
    } catch { setMsg({ ok: false, text: 'reels.identityError' }) }
    setBusy(false)
  }
  const field = 'block w-full rounded-xl border border-cream/15 bg-ink-2 px-3 py-2.5 text-base text-cream placeholder:text-cream/40 focus:border-lime focus:outline-none'
  return (
    <div className={`flex min-h-0 flex-col ${inline ? 'h-full' : 'max-h-[75dvh]'}`}>
      <div className="flex items-center justify-between border-b border-cream/10 p-4">
        <h2 className="font-semibold">{t('reels.comments')}</h2>
        {onClose && <button type="button" onClick={onClose} aria-label={t('reels.close')} className="grid size-11 place-items-center rounded-full hover:bg-cream/10"><X aria-hidden /></button>}
      </div>
      <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {list === null ? <li className="text-sm text-cream/60">…</li> : list.length === 0 ? <li className="text-sm text-cream/60">{t('reels.noComments')}</li> : list.map((c) => (
          <li key={c.id} className="text-sm">
            <p><span className="font-semibold">{c.display_name}</span> <time className="ms-1 text-xs text-cream/50">{new Date(c.created_at).toLocaleDateString()}</time></p>
            <p className="mt-0.5 whitespace-pre-wrap text-cream/85">{c.content}</p>
            {c.admin_reply && <p className="mt-2 border-s-2 border-magenta ps-3 text-cream/80"><span className="block text-xs font-semibold text-lime">↳ {t('reels.reply')}</span>{c.admin_reply}</p>}
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="grid gap-2 border-t border-cream/10 p-4">
        <input name="name" required maxLength={60} placeholder={t('reels.displayName')} aria-label={t('reels.displayName')} className={field} />
        <div className="flex gap-2">
          <input name="content" required minLength={2} maxLength={600} placeholder={t('reels.writeComment')} aria-label={t('reels.writeComment')} className={field} />
          <button disabled={busy} aria-label={t('reels.send')} className="grid size-12 shrink-0 place-items-center rounded-xl bg-magenta text-cream disabled:opacity-50">{busy ? <Loader2 className="animate-spin" /> : <Send className="size-5 rtl:-scale-x-100" />}</button>
        </div>
        {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-lime' : 'text-[#ff8a9e]'}`}>{t(msg.text)}</p>}
      </form>
    </div>
  )
}

function Actions({ reel, stats, liked, onLike, onComments, vertical = true }: { reel: Reel; stats?: Stats[string]; liked: boolean; onLike: () => void; onComments: () => void; vertical?: boolean }) {
  const { t } = useI18n()
  const [toast, setToast] = useState('')
  const share = async () => {
    const url = reelUrl(reel.id)
    if (navigator.share) { try { await navigator.share({ url, title: reel.title || 'Meriem Jaballah' }); return } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(url); setToast(t('reels.copied')); setTimeout(() => setToast(''), 1600)
  }
  const btn = 'flex flex-col items-center gap-1 text-xs font-semibold [&>span:first-child]:grid [&>span:first-child]:size-12 [&>span:first-child]:place-items-center [&>span:first-child]:rounded-full [&>span:first-child]:bg-ink/45 [&>span:first-child]:backdrop-blur active:scale-90 transition-transform'
  return (
    <div className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center gap-4`}>
      <button type="button" onClick={onLike} aria-pressed={liked} aria-label={liked ? t('reels.unlike') : t('reels.like')} className={btn}>
        <span><motion.span key={String(liked)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
          <Heart className={`size-7 ${liked ? 'fill-magenta text-magenta' : ''}`} aria-hidden /></motion.span></span>{fmt(stats?.likes)}
      </button>
      <button type="button" onClick={onComments} aria-label={t('reels.comments')} className={btn}><span><MessageCircle className="size-7" aria-hidden /></span>{fmt(stats?.comments)}</button>
      <button type="button" onClick={share} aria-label={t('reels.share')} className={btn}><span><Share2 className="size-6" aria-hidden /></span>{t('reels.share')}</button>
      <span className="flex flex-col items-center gap-1 text-xs font-semibold" title={t('reels.views')}><Eye className="size-6" aria-hidden />{fmt(stats?.views)}</span>
      {toast && <span role="status" className="absolute bottom-24 start-1/2 -translate-x-1/2 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink">{toast}</span>}
    </div>
  )
}

/** One reel in the mobile feed: plays only while active; only the active one and its neighbours load. */
function FeedItem({ reel, active, near, muted, setMuted, data }: { reel: Reel; active: boolean; near: boolean; muted: boolean; setMuted: (m: boolean) => void; data: ReturnType<typeof useReelsData> }) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const v = useRef<HTMLVideoElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'playing' | 'paused' | 'ended' | 'error'>('loading')
  const [drawer, setDrawer] = useState(false)
  const [burst, setBurst] = useState(0)
  const [err, setErr] = useState('')
  useEffect(() => {
    const el = v.current
    if (!el) return
    if (active && !reduce) { el.play().then(() => data.view(reel.id)).catch(() => setState('paused')) } // autoplay may be refused: show play
    else el.pause()
  }, [active, reduce, reel.id, data])
  const toggle = () => { const el = v.current!; if (el.paused) { void el.play(); data.view(reel.id) } else el.pause() }
  const like = async (fromTap = false) => {
    if (fromTap && data.liked.has(reel.id)) { setBurst((b) => b + 1); return }
    setBurst((b) => b + 1)
    const e = await data.toggleLike(reel.id)
    if (e) { setErr(t(e as Key)); setTimeout(() => setErr(''), 2500) }
  }
  return (
    <section aria-label={reel.title || reel.caption.slice(0, 40)} className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-ink">
      <video ref={v} className="h-full w-full object-cover" playsInline muted={muted} preload={active ? 'auto' : 'metadata'}
        src={near ? reel.video_url : undefined} poster={reel.cover_url ?? undefined}
        onClick={toggle} onDoubleClick={() => like(true)}
        onWaiting={() => setState('loading')} onPlaying={() => setState('playing')} onPause={() => setState((s) => (s === 'ended' ? s : 'paused'))}
        onEnded={() => setState('ended')} onError={() => near && setState('error')} onLoadedData={() => setState((s) => (s === 'loading' ? 'paused' : s))}
        onTimeUpdate={(e) => { if (bar.current) bar.current.style.transform = `scaleX(${e.currentTarget.currentTime / (e.currentTarget.duration || 1)})` }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-ink/80" />
      {state === 'loading' && active && <Loader2 role="status" aria-label={t('reels.loading')} className="absolute start-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 animate-spin text-cream" />}
      {state === 'paused' && <button type="button" onClick={toggle} aria-label={t('video.play')} className="absolute start-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink/50 backdrop-blur"><Play className="size-9 fill-cream text-cream" /></button>}
      {state === 'ended' && <button type="button" onClick={() => { v.current!.currentTime = 0; void v.current!.play() }} className="absolute start-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-3xl bg-ink/60 px-6 py-4 backdrop-blur"><RotateCcw className="size-8" />{t('reels.replay')}</button>}
      {state === 'error' && <p role="alert" className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-2xl bg-ink/80 p-4 text-center">{t('reels.error')}</p>}
      <AnimatePresence>{burst > 0 && <motion.span key={burst} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 0], scale: [0.4, 1.3, 1.6] }} transition={{ duration: 0.8 }} aria-hidden className="pointer-events-none absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><Heart className="size-28 fill-magenta text-magenta drop-shadow-xl" /></motion.span>}</AnimatePresence>

      <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-3 z-10"><Actions reel={reel} stats={data.stats[reel.id]} liked={data.liked.has(reel.id)} onLike={() => like()} onComments={() => setDrawer(true)} /></div>
      <div className="absolute inset-x-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 me-20">
        <p className="flex items-center gap-2 text-sm font-semibold"><span className="grid size-9 place-items-center rounded-full bg-cream font-script text-xl text-ink">MJ</span>Meriem Jaballah</p>
        {reel.title && <p className="mt-2 font-semibold">{reel.title}</p>}
        <p className="mt-1 line-clamp-3 text-sm text-cream/90">{reel.caption}</p>
        {reel.hashtags.length > 0 && <p className="mt-1 text-sm text-lime">{reel.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}</p>}
        <p className="mt-2 flex items-center gap-2 text-xs text-cream/70"><span className="rounded-full bg-magenta px-2 py-0.5 text-cream">{t(`gallery.${reel.category}` as Key)}</span>{reel.published_at && new Date(reel.published_at).toLocaleDateString()}</p>
      </div>
      <button type="button" onClick={() => setMuted(!muted)} aria-label={muted ? t('video.unmute') : t('video.mute')} className="absolute end-3 top-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] z-10 grid size-11 place-items-center rounded-full bg-ink/45 backdrop-blur">{muted ? <VolumeX /> : <Volume2 />}</button>
      <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-cream/20"><div ref={bar} className="h-full origin-left bg-cream rtl:origin-right" style={{ transform: 'scaleX(0)' }} /></div>
      {err && <p role="status" className="absolute inset-x-6 top-24 z-20 rounded-xl bg-ink/85 p-3 text-center text-sm">{err}</p>}
      <AnimatePresence>
        {drawer && (
          <motion.div className="absolute inset-0 z-30 flex items-end bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && setDrawer(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label={t('reels.comments')} className="w-full rounded-t-3xl bg-ink pb-[env(safe-area-inset-bottom)]"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: dur.base, ease: ease.out }}>
              <Comments reel={reel} onClose={() => setDrawer(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function MobileFeed({ reels, startId, data }: { reels: Reel[]; startId?: string; data: ReturnType<typeof useReelsData> }) {
  const { t } = useI18n()
  const box = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(Math.max(0, reels.findIndex((r) => r.id === startId)))
  const [muted, setMuted] = useState(true) // browsers only autoplay muted video
  useEffect(() => {
    const el = box.current
    if (!el) return
    if (startId) el.children[active]?.scrollIntoView({ behavior: 'instant' as ScrollBehavior })
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) {
        const i = [...el.children].indexOf(e.target)
        setActive(i)
        history.replaceState(null, '', `/reels/${reels[i].id}`)
      }
    }, { root: el, threshold: 0.6 })
    for (const c of el.children) io.observe(c)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reels])
  return (
    <div className="fixed inset-0 z-40 bg-ink lg:hidden">
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-ink/70 to-transparent p-3 pt-[max(.75rem,env(safe-area-inset-top))]">
        <Link to="/#reels" aria-label={t('reels.back')} className="grid size-11 place-items-center rounded-full bg-ink/45 backdrop-blur"><ArrowLeft className="rtl:rotate-180" /></Link>
        <h1 className="font-script text-4xl">{t('reels.title')}</h1><span className="size-11" />
      </div>
      <div ref={box} className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none]">
        {reels.map((r, i) => <FeedItem key={r.id} reel={r} active={i === active} near={Math.abs(i - active) <= 1} muted={muted} setMuted={setMuted} data={data} />)}
      </div>
    </div>
  )
}

function DesktopGrid({ reels, openId, data }: { reels: Reel[]; openId?: string; data: ReturnType<typeof useReelsData> }) {
  const { t } = useI18n()
  const nav = useNavigate()
  const open = reels.find((r) => r.id === openId)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!open) return
    data.view(open.id)
    const k = (e: KeyboardEvent) => e.key === 'Escape' && nav('/reels')
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [open, nav, data])
  const [featured, ...rest] = reels
  const card = (r: Reel, big = false) => (
    <Link key={r.id} to={`/reels/${r.id}`} className={`group relative block overflow-hidden rounded-3xl ring-1 ring-cream/10 ${big ? 'row-span-2 aspect-[9/16]' : 'aspect-[9/16]'}`}>
      {r.cover_url ? <img src={r.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] group-hover:scale-105" /> : <span className="block h-full w-full bg-ink-3" />}
      <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent" />
      <span className="absolute start-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cream/90 text-ink opacity-0 transition-opacity group-hover:opacity-100"><Play className="size-6 fill-current" /></span>
      {big && <span className="absolute start-3 top-3 rounded-full bg-magenta px-3 py-1 text-xs font-semibold">{t('reels.featured')}</span>}
      <span className="absolute inset-x-3 bottom-3">
        <span className="block font-semibold">{r.title}</span>
        <span className="mt-1 flex gap-3 text-xs text-cream/80"><span className="inline-flex items-center gap-1"><Heart className="size-3.5" />{fmt(data.stats[r.id]?.likes)}</span><span className="inline-flex items-center gap-1"><Eye className="size-3.5" />{fmt(data.stats[r.id]?.views)}</span></span>
      </span>
    </Link>
  )
  return (
    <div className="hidden lg:block">
      <div className="mx-auto max-w-[88rem] px-8 pb-20 pt-28">
        <h1 className="font-script text-7xl">{t('reels.title')}</h1>
        <p className="mt-1 text-cream/70">{t('reels.subtitle')}</p>
        <div className="mt-8 grid grid-cols-4 gap-5">{featured && card(featured, true)}{rest.map((r) => card(r))}</div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-ink/90 p-6 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && nav('/reels')}>
            <motion.div role="dialog" aria-modal="true" aria-label={open.title || t('reels.title')} initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ duration: dur.base, ease: ease.out }}
              className="relative grid h-[88vh] w-full max-w-5xl grid-cols-[auto_1fr] overflow-hidden rounded-3xl bg-ink ring-1 ring-cream/10">
              <video key={open.id} src={open.video_url} poster={open.cover_url ?? undefined} controls autoPlay muted playsInline className="h-full aspect-[9/16] bg-black object-contain" />
              <div className="flex min-h-0 flex-col">
                <div className="flex items-start justify-between gap-3 border-b border-cream/10 p-5">
                  <div><Logo /><p className="mt-3 font-semibold">{open.title}</p><p className="mt-1 text-sm text-cream/80">{open.caption}</p>
                    {open.hashtags.length > 0 && <p className="mt-1 text-sm text-lime">{open.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}</p>}</div>
                  <button type="button" onClick={() => nav('/reels')} aria-label={t('reels.close')} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-cream/10"><X /></button>
                </div>
                <div className="relative border-b border-cream/10 p-4">
                  <Actions reel={open} vertical={false} stats={data.stats[open.id]} liked={data.liked.has(open.id)} onComments={() => document.getElementById('reel-comment-input')?.focus()}
                    onLike={async () => { const e = await data.toggleLike(open.id); if (e) { setErr(t(e as Key)); setTimeout(() => setErr(''), 2500) } }} />
                  {err && <p role="status" className="mt-2 text-sm text-[#ff8a9e]">{err}</p>}
                </div>
                <div className="min-h-0 flex-1"><Comments reel={open} inline /></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ReelsInner({ site }: { site: SiteData }) {
  const { t } = useI18n()
  const { id } = useParams()
  const data = useReelsData()
  const reels = site.reels
  useEffect(() => { document.title = `${t('reels.title')} | Meriem Jaballah` }, [t])
  return (
    <>
      <div className="hidden lg:block"><Header email={site.settings.email} instagram={site.settings.instagram} whatsapp={site.settings.whatsapp} /></div>
      <main className="smoke min-h-dvh">
        {reels.length === 0 ? (
          <div className="grid min-h-dvh place-items-center p-6 text-center">
            <div><h1 className="font-script text-6xl">{t('reels.title')}</h1><p className="mt-3 text-cream/75">{t('reels.empty')}</p>
              <Link to="/" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-magenta px-6 font-semibold"><ArrowLeft className="size-4 rtl:rotate-180" />{t('reels.back')}</Link></div>
          </div>
        ) : <>
          <MobileFeed reels={reels} startId={id} data={data} />
          <DesktopGrid reels={reels} openId={id} data={data} />
        </>}
      </main>
    </>
  )
}

export default function ReelsPage() {
  const site = useSiteData()
  return <I18nProvider overrides={site.translations}><ReelsInner site={site} /></I18nProvider>
}
