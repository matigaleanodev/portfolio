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
  ogImageAlt?: string;
}

export interface BlogPost extends BlogPostSummary {
  headings?: { id: string; title: string; level: number }[];
  updatedAt?: string;
  contentHtml: string;
  seo: BlogPostSeo;
}
