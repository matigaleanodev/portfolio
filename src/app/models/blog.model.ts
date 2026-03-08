export interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  coverImage: string;
  readingTimeMinutes: number;
}

export interface BlogPostSeo {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage: string;
}

export interface BlogPost extends BlogPostSummary {
  updatedAt?: string;
  contentHtml: string;
  seo: BlogPostSeo;
}
