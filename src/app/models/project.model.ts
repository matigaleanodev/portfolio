export interface Project {
  slug: string;
  title: string;
  excerpt: string;
  productType: string;
  primarySignal: string;
  proof: string;
  role: string;
  architecture: string;
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
  primary?: boolean;
}
