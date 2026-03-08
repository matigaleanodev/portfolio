export interface Project {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  coverImage: string;
  featured: boolean;
  order: number;
  stack: string[];
  links: ProjectLink[];
}

export interface ProjectLink {
  label: string;
  url: string;
  icon?: string;
}
