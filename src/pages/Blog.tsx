import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { Plus, Clock, FileText } from 'lucide-react'
import { useBlogStore } from '@/stores/useBlogStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useLangStore } from '@/stores/useLangStore'
import { useS } from '@/lib/i18n'
import type { BlogPost } from '@/types'

export function Blog() {
  const S = useS()
  const lang = useLangStore(s => s.lang)
  const locale = lang === 'tr' ? tr : enUS
  const role = useAuthStore(s => s.role)
  const { posts, loading, fetchList } = useBlogStore()

  useEffect(() => { fetchList() }, [fetchList])

  const isAdmin = role === 'admin'
  const drafts    = posts.filter(p => !p.published)
  const published = posts.filter(p =>  p.published)

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{S.blog.title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#9ca3af]">{S.blog.subtitle}</p>
        </div>
        {isAdmin && (
          <Link
            to="/blog/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#415dff] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2f4ae6] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />{S.blog.newPost}
          </Link>
        )}
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-white/10 dark:bg-[#141414]">
          <FileText className="mx-auto h-8 w-8 text-gray-300 dark:text-[#3a3a3a]" />
          <p className="mt-3 text-sm text-gray-500 dark:text-[#9ca3af]">{S.blog.empty}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {isAdmin && drafts.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {S.blog.drafts} ({drafts.length})
              </h2>
              <PostGrid posts={drafts} locale={locale} S={S} />
            </section>
          )}
          {published.length > 0 && (
            <section>
              {isAdmin && (
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9ca3af]">
                  {S.blog.published} ({published.length})
                </h2>
              )}
              <PostGrid posts={published} locale={locale} S={S} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function PostGrid({ posts, locale, S }: {
  posts: BlogPost[]
  locale: typeof tr
  S: ReturnType<typeof useS>
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map(p => <PostCard key={p.id} post={p} locale={locale} S={S} />)}
    </div>
  )
}

function PostCard({ post, locale, S }: {
  post: BlogPost
  locale: typeof tr
  S: ReturnType<typeof useS>
}) {
  const dateRaw = post.published_at ?? post.created_at
  const dateStr = dateRaw ? format(new Date(dateRaw), 'd MMM yyyy', { locale }) : ''

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-sm dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:border-white/20"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-white/5">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-[#3a3a3a]">
            <FileText className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {!post.published && (
          <span className="self-start rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
            {S.blog.drafts}
          </span>
        )}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900 dark:text-white">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-[#9ca3af]">{post.excerpt}</p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2 text-[11px] text-gray-500 dark:text-[#6b7280]">
          <span>{dateStr}</span>
          <span className="opacity-50">•</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />{S.blog.readTime(post.read_minutes)}
          </span>
        </div>
      </div>
    </Link>
  )
}
