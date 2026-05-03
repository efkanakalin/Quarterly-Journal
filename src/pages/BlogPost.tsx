import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { ArrowLeft, Clock, Pencil, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { safeUrlTransform, SAFE_MARKDOWN_ALLOWED_ELEMENTS } from '@/lib/security/markdown'
import { toast } from 'sonner'
import { useBlogStore } from '@/stores/useBlogStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useLangStore } from '@/stores/useLangStore'
import { useS } from '@/lib/i18n'
import type { BlogPost as BlogPostT } from '@/types'

export function BlogPost() {
  const S = useS()
  const lang = useLangStore(s => s.lang)
  const locale = lang === 'tr' ? tr : enUS
  const role = useAuthStore(s => s.role)
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const fetchBySlug = useBlogStore(s => s.fetchBySlug)
  const deletePost  = useBlogStore(s => s.deletePost)

  const [post, setPost]     = useState<BlogPostT | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    fetchBySlug(slug)
      .then(data => {
        if (cancelled) return
        if (!data) setNotFound(true)
        else setPost(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setNotFound(true)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [slug, fetchBySlug])

  const isAdmin = role === 'admin'

  const handleDelete = async () => {
    if (!post) return
    if (!confirm(S.blog.deleteConfirm)) return
    try {
      await deletePost(post.id)
      toast.success(S.blog.deleted)
      navigate('/blog')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  if (loading) {
    return <div className="h-96 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
  }
  if (notFound || !post) {
    return (
      <div className="space-y-4">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" />{S.blog.backToList}
        </Link>
        <p className="text-sm text-gray-500 dark:text-[#9ca3af]">{S.blog.notFound}</p>
      </div>
    )
  }

  const dateRaw = post.published_at ?? post.created_at
  const dateStr = format(new Date(dateRaw), 'd MMMM yyyy', { locale })

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />{S.blog.backToList}
      </Link>

      {post.cover_image_url && (
        <div className="mt-5 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/5">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="h-full w-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}

      <header className="mt-6 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {!post.published && (
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
              {S.blog.drafts}
            </span>
          )}
          {isAdmin && (
            <div className="ml-auto flex gap-2">
              <Link
                to={`/blog/${post.slug}/edit`}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-[#d1d5db] dark:hover:bg-white/5"
              >
                <Pencil className="h-3 w-3" />{S.blog.edit}
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300 dark:hover:bg-rose-400/15"
              >
                <Trash2 className="h-3 w-3" />{S.blog.delete}
              </button>
            </div>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-gray-900 dark:text-white">
          {post.title}
        </h1>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#9ca3af]">
          <span>{dateStr}</span>
          <span className="opacity-50">•</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />{S.blog.readTime(post.read_minutes)}
          </span>
        </div>
      </header>

      <div className="qt-prose mt-8">
        <ReactMarkdown
          urlTransform={safeUrlTransform}
          allowedElements={SAFE_MARKDOWN_ALLOWED_ELEMENTS as unknown as string[]}
          unwrapDisallowed
        >
          {post.body}
        </ReactMarkdown>
      </div>
    </article>
  )
}
