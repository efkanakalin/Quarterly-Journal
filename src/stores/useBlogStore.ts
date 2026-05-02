import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { BlogPost } from '@/types'

interface BlogState {
  posts: BlogPost[]
  loading: boolean
  error: string | null
  fetchList: () => Promise<void>
  fetchBySlug: (slug: string) => Promise<BlogPost | null>
  createPost: (input: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) => Promise<BlogPost>
  updatePost: (id: string, patch: Partial<BlogPost>) => Promise<BlogPost>
  deletePost: (id: string) => Promise<void>
}

export const useBlogStore = create<BlogState>((set) => ({
  posts: [],
  loading: false,
  error: null,

  fetchList: async () => {
    set({ loading: true, error: null })
    // RLS draft'ları admin için, published'ları herkes için döndürür.
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at',   { ascending: false })
    if (error) { set({ error: error.message, loading: false }); return }
    set({ posts: (data ?? []) as BlogPost[], loading: false })
  },

  fetchBySlug: async (slug) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    if (error) throw error
    return (data as BlogPost | null) ?? null
  },

  createPost: async (input) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(input)
      .select()
      .single()
    if (error) throw error
    set(state => ({ posts: [data as BlogPost, ...state.posts] }))
    return data as BlogPost
  },

  updatePost: async (id, patch) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    set(state => ({
      posts: state.posts.map(p => p.id === id ? { ...p, ...(data as BlogPost) } : p),
    }))
    return data as BlogPost
  },

  deletePost: async (id) => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) throw error
    set(state => ({ posts: state.posts.filter(p => p.id !== id) }))
  },
}))
