import { Camera, Check, EyeOff, Image as ImageIcon, MessageCircle, Plus, Star, Trash2, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CATEGORIES, LANGS, type Lang, type ML, type Reel } from '../content/defaults'
import { useI18n } from '../i18n/I18n'
import type { Key } from '../i18n/dict'
import { supabase } from '../lib/supabase'
import { btnDanger, btnGhost, btnPrimary, FieldEditor, Status, useDirty } from './fields'
import { card, Page, removeStored, storeMedia, uploadFile } from './pages'

type Stats = Record<string, { likes: number; comments: number; views: number }>
const input = 'mt-1 block w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-base text-[#070707] focus:border-[#9a031e] focus:outline-none'
const statusTone: Record<string, string> = { published: 'bg-[#e7f8ee] text-[#15803d]', approved: 'bg-[#e7f8ee] text-[#15803d]', draft: 'bg-black/5 text-[#696d7d]', pending: 'bg-[#fff6dd] text-[#8a6100]', hidden: 'bg-[#eef1f6] text-[#696d7d]', rejected: 'bg-[#fde8eb] text-[#9a031e]' }
const Pill = ({ s, children }: { s: string; children: ReactNode }) => <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone[s] ?? ''}`}>{children}</span>

function Tabs<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="mb-5 flex gap-2 overflow-x-auto pb-1">
      {options.map(([v, l]) => <button key={v} role="tab" aria-selected={v === value} onClick={() => onChange(v)} className={`${v === value ? btnPrimary : btnGhost} shrink-0`}>{l}</button>)}
    </div>
  )
}

// ── Reels Studio ────────────────────────────────────────────────────
type Draft = Partial<Reel> & { hashtagsText?: string }

/** Capture the frame currently shown by a <video> (local file or CORS-enabled storage URL). */
function grabFrame(v: HTMLVideoElement): Promise<Blob | null> {
  const c = document.createElement('canvas')
  c.width = v.videoWidth; c.height = v.videoHeight
  c.getContext('2d')?.drawImage(v, 0, 0)
  return new Promise((r) => { try { c.toBlob(r, 'image/webp', 0.85) } catch { r(null) } })
}

function ReelEditor({ reel, onDone }: { reel: Reel | null; onDone: () => void }) {
  const { t } = useI18n()
  const [d, setD] = useState<Draft>(() => reel ? { ...reel, hashtagsText: reel.hashtags.join(', ') } : { title: '', caption: '', category: 'dance', language: 'en', display_order: 0, hashtagsText: '' })
  const [file, setFile] = useState<File | null>(null)
  const [cover, setCover] = useState<Blob | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const [time, setTime] = useState(0)
  const vid = useRef<HTMLVideoElement>(null)
  const localUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  const coverUrl = useMemo(() => (cover ? URL.createObjectURL(cover) : d.cover_url ?? null), [cover, d.cover_url])
  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl) }, [localUrl])
  useDirty('reel-editor', !!file || !!cover)
  const set = (k: keyof Draft, v: unknown) => setD((x) => ({ ...x, [k]: v }))

  const save = async (status: Reel['status']) => {
    setMsg('')
    if (!file && !d.video_url) { setMsg(t('admin.noVideo')); return }
    try {
      setProgress(0)
      const oldFiles: unknown[] = []
      let video_url = d.video_url, cover_url = d.cover_url ?? null
      if (file) {
        const m = await storeMedia(file, (p) => setProgress(p * 0.85), ['video/mp4', 'video/quicktime', 'video/webm'])
        if (d.video_url) oldFiles.push(d.video_url)
        video_url = m.src
        if (!cover) { if (cover_url) oldFiles.push(cover_url); cover_url = m.poster }
        else if (m.poster) oldFiles.push(m.poster)
      }
      if (cover) {
        if (cover_url && !oldFiles.includes(cover_url)) oldFiles.push(cover_url)
        cover_url = await uploadFile(cover, `reels/${crypto.randomUUID()}.webp`, 'image/webp', (p) => setProgress(0.85 + p * 0.15))
      }
      const row = {
        title: d.title ?? '', caption: d.caption ?? '', category: d.category, language: d.language, display_order: Number(d.display_order) || 0,
        hashtags: (d.hashtagsText ?? '').split(',').map((h) => h.trim().replace(/^#/, '')).filter(Boolean).slice(0, 15),
        video_url, cover_url, duration: vid.current?.duration && isFinite(vid.current.duration) ? Math.round(vid.current.duration) : d.duration ?? null,
        status, published_at: status === 'published' ? d.published_at ?? new Date().toISOString() : d.published_at ?? null,
      }
      const q = d.id ? supabase.from('reels').update(row).eq('id', d.id) : supabase.from('reels').insert(row)
      const { error } = await q
      if (error) throw error
      await removeStored(oldFiles) // replaced files go only after the new ones are saved
      setFile(null); setCover(null)
      onDone()
    } catch (e) {
      const m = (e as Error).message
      setMsg(m.startsWith('admin.') ? t(m as Key) : `${t('admin.error')} ${m}`)
    }
    setProgress(null)
  }
  const del = async () => {
    if (!d.id || !confirm(t('admin.confirmDelete'))) return
    const { error } = await supabase.from('reels').delete().eq('id', d.id)
    if (error) { setMsg(error.message); return }
    await removeStored([d.video_url, d.cover_url]).catch(() => {})
    onDone()
  }
  const src = localUrl ?? d.video_url

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
      <div className="space-y-3">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[20rem] overflow-hidden rounded-3xl bg-[#070707]">
          {src ? <video ref={vid} key={src} src={src} crossOrigin="anonymous" playsInline controls preload="metadata" className="h-full w-full object-contain"
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} /> :
            <label className="grid h-full cursor-pointer place-items-center p-6 text-center text-sm text-white/80">
              <span><Upload className="mx-auto mb-2 size-8" />{t('admin.video')}<br /><span className="text-xs text-white/60">{t('admin.reelHint')}</span></span>
              <input type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`${btnGhost} cursor-pointer`}><Upload className="size-4" />{src ? t('admin.replace') : t('admin.upload')}
            <input type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = '' }} /></label>
          <label className={`${btnGhost} cursor-pointer`}><Camera className="size-4" />{t('admin.camera')}
            <input type="file" accept="video/*" capture="environment" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = '' }} /></label>
        </div>
      </div>

      <div className="space-y-4">
        <section className={`${card} p-4`}>
          <h3 className="mb-3 font-semibold">{t('admin.cover')}</h3>
          <div className="flex flex-wrap items-start gap-4">
            {coverUrl ? <img src={coverUrl} alt="" className="aspect-[9/16] w-24 rounded-xl object-cover" /> : <span className="grid aspect-[9/16] w-24 place-items-center rounded-xl bg-black/5"><ImageIcon className="text-black/30" /></span>}
            <div className="flex flex-col gap-2">
              <button type="button" className={btnGhost} disabled={!src} onClick={async () => { if (vid.current) setCover(await grabFrame(vid.current)) }}>
                <Camera className="size-4" />{t('admin.useFrame')} <span className="text-xs text-[#696d7d]">({time.toFixed(1)}s)</span></button>
              <label className={`${btnGhost} cursor-pointer`}><ImageIcon className="size-4" />{t('admin.uploadCover')}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setCover(f); e.target.value = '' }} /></label>
            </div>
          </div>
        </section>
        <section className={`${card} grid gap-3 p-4 sm:grid-cols-2`}>
          <label className="text-sm font-semibold sm:col-span-2">{t('admin.titleField')}<input className={input} maxLength={120} value={d.title ?? ''} onChange={(e) => set('title', e.target.value)} /></label>
          <label className="text-sm font-semibold sm:col-span-2">{t('admin.caption')}<textarea className={input} rows={4} maxLength={2200} value={d.caption ?? ''} onChange={(e) => set('caption', e.target.value)} /></label>
          <label className="text-sm font-semibold sm:col-span-2">{t('admin.hashtags')}<input className={input} value={d.hashtagsText ?? ''} onChange={(e) => set('hashtagsText', e.target.value)} placeholder="dance, kids, led" /></label>
          <label className="text-sm font-semibold">{t('admin.category')}<select className={input} value={d.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(`gallery.${c}` as Key)}</option>)}</select></label>
          <label className="text-sm font-semibold">{t('admin.language')}<select className={input} value={d.language} onChange={(e) => set('language', e.target.value)}>{LANGS.map((l) => <option key={l}>{l}</option>)}</select></label>
          <label className="text-sm font-semibold">{t('admin.order')}<input type="number" className={input} value={d.display_order ?? 0} onChange={(e) => set('display_order', e.target.value)} /></label>
        </section>
        {progress !== null && <div role="status"><p className="mb-1 text-sm">{t('admin.uploading')} {Math.round(progress * 100)}%</p><div className="h-2 overflow-hidden rounded-full bg-black/5"><div className="h-full bg-[#9a031e] transition-[width]" style={{ width: `${progress * 100}%` }} /></div></div>}
        {msg && <p role="alert" className="text-sm text-[#9a031e]">{msg}</p>}
        <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex flex-wrap gap-2 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur lg:bottom-4">
          <button className={btnGhost} disabled={progress !== null} onClick={() => save('draft')}>{t('admin.saveDraft')}</button>
          <button className={btnPrimary} disabled={progress !== null} onClick={() => save('published')}>{t('admin.publish')}</button>
          {d.status === 'published' && <button className={btnGhost} disabled={progress !== null} onClick={() => save('hidden')}><EyeOff className="size-4" />{t('admin.unpublish')}</button>}
          {d.id && <button className={btnDanger} onClick={del}><Trash2 className="size-4" />{t('admin.delete')}</button>}
          <button className={btnGhost} onClick={onDone}>{t('admin.cancel')}</button>
        </div>
      </div>
    </div>
  )
}

export function ReelsStudio() {
  const { t } = useI18n()
  const [rows, setRows] = useState<Reel[] | null>(null)
  const [stats, setStats] = useState<Stats>({})
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Reel | null | 'new'>(null)
  const [tab, setTab] = useState<'all' | Reel['status']>('all')
  const load = useCallback(async () => {
    const [r, s] = await Promise.all([supabase.from('reels').select('*').order('display_order').order('created_at', { ascending: false }), supabase.rpc('reel_stats')])
    if (r.error) { setError(r.error.message); return }
    setRows(r.data as Reel[])
    setStats(Object.fromEntries(((s.data ?? []) as { reel_id: string; likes: number; comments: number; views: number }[]).map((x) => [x.reel_id, { likes: Number(x.likes), comments: Number(x.comments), views: Number(x.views) }])))
  }, [])
  useEffect(() => { void load() }, [load])
  if (editing) return <Page title={t('admin.reels')}><ReelEditor reel={editing === 'new' ? null : editing} onDone={() => { setEditing(null); void load() }} /></Page>
  const shown = (rows ?? []).filter((r) => tab === 'all' || r.status === tab)
  const total = Object.values(stats).reduce((a, s) => ({ views: a.views + s.views, likes: a.likes + s.likes, comments: a.comments + s.comments }), { views: 0, likes: 0, comments: 0 })
  return (
    <Page title={t('admin.reels')} action={<button className={btnPrimary} onClick={() => setEditing('new')}><Plus className="size-4" />{t('admin.createReel')}</button>}>
      <ul className="mb-5 grid grid-cols-3 gap-3">
        {([['admin.views', total.views], ['admin.likes', total.likes], ['admin.comments', total.comments]] as [Key, number][]).map(([k, v]) => (
          <li key={k} className={`${card} p-4 text-center`}><p className="text-2xl font-bold text-[#9a031e]">{v}</p><p className="text-xs text-[#696d7d]">{t(k)}</p></li>
        ))}
      </ul>
      <Tabs label={t('admin.status')} value={tab} onChange={setTab} options={[['all', t('gallery.all')], ['published', t('admin.live')], ['draft', t('admin.draft')], ['hidden', t('admin.hidden')]]} />
      <Status loading={!rows && !error} error={error} empty={rows !== null && shown.length === 0} retry={load}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {shown.map((r) => (
            <li key={r.id}><button type="button" onClick={() => setEditing(r)} className={`${card} block w-full overflow-hidden text-start`}>
              <span className="relative block aspect-[9/16] bg-black">{r.cover_url && <img src={r.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
                <span className="absolute start-2 top-2"><Pill s={r.status}>{r.status === 'published' ? t('admin.live') : t(`admin.${r.status}` as Key)}</Pill></span></span>
              <span className="block p-3"><span className="block truncate font-semibold">{r.title || r.caption || '—'}</span>
                <span className="mt-1 block text-xs text-[#696d7d]">{stats[r.id]?.views ?? 0} {t('reels.views')} · {stats[r.id]?.likes ?? 0} ♥ · {stats[r.id]?.comments ?? 0} 💬</span></span>
            </button></li>
          ))}
        </ul>
      </Status>
    </Page>
  )
}

// ── Comment moderation ──────────────────────────────────────────────
type C = { id: string; reel_id: string; display_name: string; content: string; moderation_status: string; admin_reply: string | null; created_at: string; reels: { title: string } | null }
export function CommentsPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState<C[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    setRows(null)
    const { data, error } = await supabase.from('reel_comments').select('*, reels(title)').eq('moderation_status', tab).order('created_at', { ascending: false })
    if (error) setError(error.message); else setRows(data as C[])
  }, [tab])
  useEffect(() => { void load() }, [load])
  const patch = async (c: C, v: Partial<C>) => {
    const { error } = await supabase.from('reel_comments').update(v).eq('id', c.id)
    if (error) setError(error.message); else void load()
  }
  return (
    <Page title={t('admin.comments')}>
      <Tabs label={t('admin.status')} value={tab} onChange={setTab} options={(['pending', 'approved', 'rejected', 'hidden'] as const).map((s) => [s, t(`admin.${s}` as Key)])} />
      <Status loading={!rows && !error} error={error} empty={rows?.length === 0} retry={load}>
        <ul className="space-y-3">
          {rows?.map((c) => (
            <li key={c.id} className={`${card} p-4`}>
              <p className="text-xs text-[#696d7d]"><MessageCircle className="me-1 inline size-3.5" />{c.reels?.title || c.reel_id.slice(0, 8)} · {new Date(c.created_at).toLocaleString()}</p>
              <p className="mt-1 font-semibold">{c.display_name}</p>
              <p className="whitespace-pre-wrap">{c.content}</p>
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void patch(c, { admin_reply: String(new FormData(e.currentTarget).get('reply') || '') || null }) }}>
                <input name="reply" defaultValue={c.admin_reply ?? ''} placeholder={t('admin.reply')} aria-label={t('admin.reply')} maxLength={600} className={input + ' !mt-0'} />
                <button className={btnGhost}>{t('admin.save')}</button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.moderation_status !== 'approved' && <button className={btnPrimary} onClick={() => patch(c, { moderation_status: 'approved' })}><Check className="size-4" />{t('admin.approve')}</button>}
                {c.moderation_status !== 'rejected' && <button className={btnGhost} onClick={() => patch(c, { moderation_status: 'rejected' })}><X className="size-4" />{t('admin.reject')}</button>}
                {c.moderation_status !== 'hidden' && <button className={btnGhost} onClick={() => patch(c, { moderation_status: 'hidden' })}><EyeOff className="size-4" />{t('admin.hide')}</button>}
                <button className={btnDanger} onClick={async () => { if (!confirm(t('admin.confirmDelete'))) return; const { error } = await supabase.from('reel_comments').delete().eq('id', c.id); if (error) setError(error.message); else void load() }}><Trash2 className="size-4" />{t('admin.delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      </Status>
    </Page>
  )
}

// ── Testimonials ────────────────────────────────────────────────────
type T = { id: string; reviewer_name: string; reviewer_role: string; organization: string; content: string; content_i18n: Partial<ML>; rating: number | null; avatar_url: string | null; language: Lang; moderation_status: string; is_featured: boolean; display_order: number; created_at: string; testimonial_private: { email: string | null } | null }
function TestimonialCard({ row, onChange }: { row: T; onChange: () => void }) {
  const { t } = useI18n()
  const [e, setE] = useState(row)
  const [msg, setMsg] = useState('')
  const dirty = JSON.stringify(e) !== JSON.stringify(row)
  useDirty(`t:${row.id}`, dirty)
  const save = async (extra: Partial<T> = {}) => {
    const { testimonial_private: _p, id, created_at: _c, ...patch } = { ...e, ...extra }
    void _p; void _c
    const { error } = await supabase.from('testimonials').update({ ...patch, rating: patch.rating ? Number(patch.rating) : null, display_order: Number(patch.display_order) || 0 }).eq('id', id)
    setMsg(error ? `${t('admin.error')} ${error.message}` : t('admin.saved'))
    if (!error) onChange()
  }
  const f = (k: keyof T, label: Key, type = 'text') => (
    <label className="text-sm font-semibold">{t(label)}<input type={type} className={input} value={String(e[k] ?? '')} onChange={(ev) => setE({ ...e, [k]: ev.target.value })} /></label>
  )
  return (
    <li className={`${card} space-y-3 p-4`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#696d7d]"><Pill s={e.moderation_status}>{t(`admin.${e.moderation_status}` as Key)}</Pill>{e.is_featured && <Star className="size-4 fill-[#9a031e] text-[#9a031e]" />}
        {new Date(e.created_at).toLocaleDateString()} · {e.language.toUpperCase()}{row.testimonial_private?.email && <> · <a className="underline" href={`mailto:${row.testimonial_private.email}`}>{row.testimonial_private.email}</a></>}</div>
      <div className="grid gap-3 sm:grid-cols-3">{f('reviewer_name', 'reviews.name')}{f('reviewer_role', 'admin.relationship')}{f('organization', 'admin.organization')}</div>
      <label className="block text-sm font-semibold">{t('admin.reviewText')}<textarea className={input} rows={3} value={e.content} onChange={(ev) => setE({ ...e, content: ev.target.value })} /></label>
      <details><summary className="cursor-pointer text-sm font-semibold">{t('admin.translations2')}</summary>
        <div className="mt-2"><FieldEditor field={{ name: 'content_i18n', label: 'admin.reviewText', type: 'mltext' }} value={e.content_i18n} onChange={(v) => setE({ ...e, content_i18n: v as Partial<ML> })} /></div></details>
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="text-sm font-semibold">{t('admin.rating')}<select className={input} value={e.rating ?? ''} onChange={(ev) => setE({ ...e, rating: ev.target.value ? Number(ev.target.value) : null })}><option value="">—</option>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label className="text-sm font-semibold">{t('admin.language')}<select className={input} value={e.language} onChange={(ev) => setE({ ...e, language: ev.target.value as Lang })}>{LANGS.map((l) => <option key={l}>{l}</option>)}</select></label>
        {f('display_order', 'admin.order', 'number')}
        <label className="flex min-h-11 items-center gap-2 self-end text-sm font-semibold"><input type="checkbox" className="size-5 accent-[#9a031e]" checked={e.is_featured} onChange={(ev) => setE({ ...e, is_featured: ev.target.checked })} />{t('admin.featured')}</label>
      </div>
      {f('avatar_url', 'admin.uploadCover')}
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} disabled={!dirty} onClick={() => save()}>{t('admin.save')}</button>
        {e.moderation_status !== 'approved' && <button className={btnPrimary} onClick={() => save({ moderation_status: 'approved' })}><Check className="size-4" />{t('admin.approve')}</button>}
        {e.moderation_status !== 'rejected' && <button className={btnGhost} onClick={() => save({ moderation_status: 'rejected' })}><X className="size-4" />{t('admin.reject')}</button>}
        {e.moderation_status !== 'hidden' && <button className={btnGhost} onClick={() => save({ moderation_status: 'hidden' })}><EyeOff className="size-4" />{t('admin.hide')}</button>}
        <button className={btnDanger} onClick={async () => { if (!confirm(t('admin.confirmDelete'))) return; const { error } = await supabase.from('testimonials').delete().eq('id', row.id); if (error) setMsg(error.message); else onChange() }}><Trash2 className="size-4" />{t('admin.delete')}</button>
        <a className={btnGhost} href="/#reviews" target="_blank" rel="noopener">{t('admin.preview')}</a>
        <span role="status" className="self-center text-sm">{msg}</span>
      </div>
    </li>
  )
}

export function TestimonialsPage() {
  const { t, lang } = useI18n()
  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState<T[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    setRows(null)
    const { data, error } = await supabase.from('testimonials').select('*, testimonial_private(email)').eq('moderation_status', tab).order('display_order').order('created_at', { ascending: false })
    if (error) setError(error.message); else setRows(data as T[])
  }, [tab])
  useEffect(() => { void load() }, [load])
  const add = async () => {
    // manual entries are written by the admin from a real person's words: created as drafts (pending) until approved
    const { error } = await supabase.from('testimonials').insert({ reviewer_name: '—', content: '…………………………', language: lang, moderation_status: 'pending' })
    if (error) setError(error.message); else { setTab('pending'); void load() }
  }
  return (
    <Page title={t('admin.testimonials')} action={<button className={btnPrimary} onClick={add}><Plus className="size-4" />{t('admin.add')}</button>}>
      <Tabs label={t('admin.status')} value={tab} onChange={setTab} options={(['pending', 'approved', 'rejected', 'hidden'] as const).map((s) => [s, t(`admin.${s}` as Key)])} />
      <Status loading={!rows && !error} error={error} empty={rows?.length === 0} retry={load}>
        <ul className="space-y-3">{rows?.map((r) => <TestimonialCard key={r.id} row={r} onChange={load} />)}</ul>
      </Status>
    </Page>
  )
}
