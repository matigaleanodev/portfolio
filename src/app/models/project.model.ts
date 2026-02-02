export interface Project {
  id: string;
  name: string;
  image: string;
  description: string;
  links: ProjectLink[];

  technologies?: string[];
  highlight?: boolean;
  order?: number;
}

export interface ProjectLink {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
}
