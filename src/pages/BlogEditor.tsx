import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { safeUrlTransform, SAFE_MARKDOWN_ALLOWED_ELEMENTS } from '@/lib/security/markdown'
import { audit } from '@/lib/security/audit'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBlogStore } from '@/stores/useBlogStore'
import { useS } from '@/lib/i18n'
import { estimateReadMinutes, slugify } from '@/lib/blog/slug'
import type { BlogPost } from '@/types'

const COVER_BUCKET = 'blog-covers'
const COVER_MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const COVER_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif'

interface FormState {
  title:           string
  slug:            string
  excerpt:         string
  cover_image_url: string
  body:            string
  read_minutes:    number
  published:       boolean
}

const EMPTY: FormState = {
  title: '', slug: '', excerpt: '', cover_image_url: '', body: '', read_minutes: 1, published: false,
}

export function BlogEditor() {
  const S = useS()
  const role = useAuthStore(s => s.role)
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const { slug: editingSlug } = useParams<{ slug: string }>()
  const isEdit = Boolean(editingSlug)

  const fetchBySlug = useBlogStore(s => s.fetchBySlug)
  const createPost  = useBlogStore(s => s.createPost)
  const updatePost  = useBlogStore(s => s.updatePost)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [originalId, setOriginalId] = useState<string | null>(null)
  const [originalPublished, setOriginalPublished] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving]   = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [readTouched, setReadTouched] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const handleCoverFile = async (file: File | undefined) => {
    if (!file) return
    if (!user) { toast.error('Not authenticated'); return }
    if (file.size > COVER_MAX_BYTES) {
      toast.error('Image too large (max 5 MB)')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are accepted')
      return
    }
    setUploadingCover(true)
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: uploadErr } = await supabase
        .storage
        .from(COVER_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type })
      if (uploadErr) throw uploadErr
      const { data: pub } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path)
      if (!pub?.publicUrl) throw new Error('Public URL unavailable')
      setForm(f => ({ ...f, cover_image_url: pub.publicUrl }))
      toast.success('Cover uploaded')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      toast.error(msg)
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  // Cursor pozisyonuna markdown image syntax'ı yapıştır.
  const insertImageAtCursor = () => {
    const url = window.prompt(S.blog.imagePromptUrl)
    if (!url || !url.trim()) return
    const alt = window.prompt(S.blog.imagePromptAlt) ?? ''
    const md = `\n\n![${alt}](${url.trim()})\n\n`
    const ta = bodyRef.current
    if (!ta) {
      setForm(f => ({ ...f, body: f.body + md }))
      return
    }
    const start = ta.selectionStart ?? form.body.length
    const end   = ta.selectionEnd   ?? form.body.length
    const next  = form.body.slice(0, start) + md + form.body.slice(end)
    setForm(f => ({ ...f, body: next }))
    // sonraki tick'te cursor'u yapıştırılan görselin sonuna al
    setTimeout(() => {
      ta.focus()
      const pos = start + md.length
      ta.setSelectionRange(pos, pos)
    }, 0)
  }

  // Edit modunda mevcut yazıyı yükle
  useEffect(() => {
    if (!isEdit || !editingSlug) return
    let cancelled = false
    fetchBySlug(editingSlug).then(post => {
      if (cancelled) return
      if (!post) { toast.error(S.blog.notFound); navigate('/blog'); return }
      setForm({
        title:           post.title,
        slug:            post.slug,
        excerpt:         post.excerpt ?? '',
        cover_image_url: post.cover_image_url ?? '',
        body:            post.body,
        read_minutes:    post.read_minutes,
        published:       post.published,
      })
      setOriginalId(post.id)
      setOriginalPublished(post.published)
      setSlugTouched(true)  // edit modda otomatik slug üretmek istemeyiz
      setReadTouched(true)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [isEdit, editingSlug, fetchBySlug, navigate, S.blog.notFound])

  // Title değişince slug'ı otomatik üret (kullanıcı manuel düzenlemediyse)
  useEffect(() => {
    if (slugTouched) return
    setForm(f => ({ ...f, slug: slugify(f.title) }))
  }, [form.title, slugTouched])

  // Body değişince read_minutes'ı otomatik üret (kullanıcı manuel değiştirmediyse)
  useEffect(() => {
    if (readTouched) return
    setForm(f => ({ ...f, read_minutes: estimateReadMinutes(f.body) }))
  }, [form.body, readTouched])

  const canSave = useMemo(() => (
    form.title.trim().length > 0
    && form.slug.trim().length > 0
    && form.body.trim().length > 0
    && !saving
  ), [form, saving])

  if (role !== 'admin') {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200">
        {S.blog.adminOnly}
      </div>
    )
  }

  if (loading) {
    return <div className="h-96 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
  }

  const submit = async (publish: boolean) => {
    if (!user) return
    if (!canSave) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const willPublish = publish || (isEdit && originalPublished)

      if (isEdit && originalId) {
        const patch: Partial<BlogPost> = {
          title:           form.title.trim(),
          slug:            form.slug.trim(),
          excerpt:         form.excerpt.trim() || null,
          cover_image_url: form.cover_image_url.trim() || null,
          body:            form.body,
          read_minutes:    form.read_minutes,
          published:       willPublish,
          published_at:    willPublish && !originalPublished ? now : undefined,
        }
        const updated = await updatePost(originalId, patch)
        void audit('blog.update', { targetId: updated.id, targetType: 'blog_post', metadata: { slug: updated.slug, published: willPublish } })
        toast.success(S.blog.saved)
        navigate(`/blog/${updated.slug}`)
      } else {
        const created = await createPost({
          author_id:       user.id,
          title:           form.title.trim(),
          slug:            form.slug.trim(),
          excerpt:         form.excerpt.trim() || null,
          cover_image_url: form.cover_image_url.trim() || null,
          body:            form.body,
          read_minutes:    form.read_minutes,
          published:       willPublish,
          published_at:    willPublish ? now : null,
        })
        void audit('blog.create', { targetId: created.id, targetType: 'blog_post', metadata: { slug: created.slug, published: willPublish } })
        toast.success(S.blog.saved)
        navigate(`/blog/${created.slug}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed'
      toast.error(msg)
      setSaving(false)
    }
  }

  const INPUT = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#415dff] focus:outline-none focus:ring-1 focus:ring-[#415dff]/40 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white'

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" />{S.blog.backToList}
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        {isEdit ? S.blog.edit : S.blog.newPost}
      </h1>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#1a1a1a]">
        <Field label={S.blog.formTitleLabel}>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder={S.blog.formTitlePh}
            className={INPUT}
            disabled={saving}
          />
        </Field>

        <Field label={S.blog.formCoverLabel} hint={S.blog.formCoverHint}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={saving || uploadingCover}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-[#d1d5db] dark:hover:bg-white/5"
            >
              {uploadingCover
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Upload className="h-3.5 w-3.5" />}
              {uploadingCover ? 'Uploading…' : 'Upload image'}
            </button>
            {form.cover_image_url && (
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, cover_image_url: '' }))}
                disabled={saving || uploadingCover}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-500 hover:text-rose-600 hover:border-rose-300 disabled:opacity-60 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-[#9ca3af]"
                title="Remove cover"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept={COVER_ACCEPT}
              onChange={e => handleCoverFile(e.target.files?.[0])}
              className="hidden"
            />
          </div>
          <input
            type="url"
            value={form.cover_image_url}
            onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
            placeholder={S.blog.formCoverPh}
            className={INPUT}
            disabled={saving || uploadingCover}
          />
          {form.cover_image_url && (
            <div className="mt-2 aspect-[16/9] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
              <img
                src={form.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
        </Field>

        <Field label={S.blog.formExcerptLabel}>
          <textarea
            value={form.excerpt}
            onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
            placeholder={S.blog.formExcerptPh}
            rows={2}
            className={INPUT}
            disabled={saving}
          />
        </Field>

        <Field label={S.blog.formBodyLabel}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${!showPreview ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:text-white'}`}
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${showPreview ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:text-white'}`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={insertImageAtCursor}
              disabled={showPreview || saving}
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-[#d1d5db] dark:hover:bg-white/5"
              title={S.blog.imageInsertHint}
            >
              <ImagePlus className="h-3 w-3" />{S.blog.imageInsertButton}
            </button>
          </div>
          {showPreview ? (
            <div className="qt-prose min-h-[280px] rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#0f0f0f]">
              <ReactMarkdown
                urlTransform={safeUrlTransform}
                allowedElements={SAFE_MARKDOWN_ALLOWED_ELEMENTS as unknown as string[]}
                unwrapDisallowed
              >
                {form.body || '_(boş)_'}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              ref={bodyRef}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder={S.blog.formBodyPh}
              rows={16}
              className={`${INPUT} font-mono text-xs leading-relaxed`}
              disabled={saving}
              spellCheck={false}
            />
          )}
        </Field>

        <Field label={S.blog.formReadLabel} hint={S.blog.formReadHint}>
          <input
            type="number"
            min={1}
            value={form.read_minutes}
            onChange={e => { setReadTouched(true); setForm(f => ({ ...f, read_minutes: Math.max(1, parseInt(e.target.value, 10) || 1) })) }}
            className={`${INPUT} w-24`}
            disabled={saving}
          />
        </Field>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
            disabled={saving}
            className="h-4 w-4 rounded border-gray-300 text-[#415dff] focus:ring-[#415dff] dark:border-white/20 dark:bg-[#0f0f0f]"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">{S.blog.formPublishedLabel}</span>
          <span className="text-xs text-gray-500 dark:text-[#9ca3af]">— {S.blog.formPublishedHint}</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link
          to="/blog"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-[#d1d5db] dark:hover:bg-white/5"
        >
          {S.blog.cancel}
        </Link>
        <button
          onClick={() => submit(false)}
          disabled={!canSave}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-[#d1d5db] dark:hover:bg-white/5"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (isEdit ? S.blog.update : S.blog.saveDraft)}
        </button>
        {!isEdit && (
          <button
            onClick={() => submit(true)}
            disabled={!canSave}
            className="rounded-lg bg-[#415dff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f4ae6] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : S.blog.publish}
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-700 dark:text-[#d1d5db]">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-500 dark:text-[#9ca3af]">{hint}</p>}
    </div>
  )
}
