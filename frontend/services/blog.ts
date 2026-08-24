import { api } from '@/lib/api';
import type { BlogPost } from '@/types';

export function getPublicBlogPosts(params?: Record<string, string>) {
  return api.get<BlogPost[]>('/blog/public', params);
}

export function getPublicBlogPost(slug: string) {
  return api.get<BlogPost>(`/blog/public/${slug}`);
}

export function getBlogPosts(params?: Record<string, string>) {
  return api.get<BlogPost[]>('/blog', params);
}

export function getBlogPost(id: string) {
  return api.get<BlogPost>(`/blog/${id}`);
}

export function createBlogPost(data: Partial<BlogPost>) {
  return api.post<BlogPost>('/blog', data);
}

export function updateBlogPost(id: string, data: Partial<BlogPost>) {
  return api.patch<BlogPost>(`/blog/${id}`, data);
}

export function deleteBlogPost(id: string) {
  return api.delete<null>(`/blog/${id}`);
}
