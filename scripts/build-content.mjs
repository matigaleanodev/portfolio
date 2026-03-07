import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const rootDir = process.cwd();
const contentDir = path.join(rootDir, 'content');
const projectsDir = path.join(contentDir, 'projects');
const postsDir = path.join(contentDir, 'posts');
const assetsDir = path.join(rootDir, 'src', 'assets');
const publicDir = path.join(rootDir, 'public');
const projectsOutputPath = path.join(assetsDir, 'projects.json');
const blogDir = path.join(assetsDir, 'blog');
const postsIndexOutputPath = path.join(blogDir, 'posts.json');
const postsOutputDir = path.join(blogDir, 'posts');
const rssOutputPath = path.join(publicDir, 'rss.xml');
const sitemapBlogOutputPath = path.join(publicDir, 'sitemap-blog.xml');
const siteUrl = 'https://matiasgaleano.dev';

marked.setOptions({
  gfm: true,
  breaks: false,
});

export async function runBuildContent() {
  await ensureDirectory(assetsDir);
  await ensureDirectory(contentDir);
  await ensureDirectory(publicDir);

  const projects = await loadProjects();
  const posts = await loadPosts();

  await fs.writeFile(projectsOutputPath, `${JSON.stringify(projects, null, 2)}\n`);

  await ensureCleanDirectory(blogDir);
  await ensureDirectory(postsOutputDir);
  await fs.writeFile(postsIndexOutputPath, `${JSON.stringify(posts.index, null, 2)}\n`);

  for (const post of posts.details) {
    const outputPath = path.join(postsOutputDir, `${post.slug}.json`);
    await fs.writeFile(outputPath, `${JSON.stringify(post, null, 2)}\n`);
  }

  await fs.writeFile(rssOutputPath, buildRss(posts.details));
  await fs.writeFile(sitemapBlogOutputPath, buildSitemap(posts.details));

  console.log(`Generated ${projects.length} projects.`);
  console.log(`Generated ${posts.index.length} blog index entries.`);
  console.log(`Generated ${posts.details.length} blog post artifacts.`);
  console.log('Generated rss.xml and sitemap-blog.xml.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runBuildContent();
}

async function loadProjects() {
  const files = await getIndexMarkdownFiles(projectsDir);
  const slugRegistry = new Set();
  const orderRegistry = new Set();

  const projects = [];

  for (const filePath of files) {
    const entry = await parseMarkdownFile(filePath);
    const slug = resolveSlug(entry.data, entry.folderName);

    validateUnique(slugRegistry, slug, `Duplicate project slug "${slug}"`);
    validateRequiredString(entry.data.title, `Missing project title in ${relative(filePath)}`);
    validateRequiredString(entry.data.excerpt, `Missing project excerpt in ${relative(filePath)}`);
    const projectDate = normalizeDate(
      entry.data.date,
      `Invalid project date in ${relative(filePath)}`,
    );
    validateRequiredString(
      entry.data.coverImage,
      `Missing project coverImage in ${relative(filePath)}`,
    );
    validateStringArray(entry.data.stack, `Invalid project stack in ${relative(filePath)}`);
    validateProjectLinks(entry.data.links, relative(filePath));
    validateBoolean(entry.data.featured, `Invalid project featured flag in ${relative(filePath)}`);
    validateNumber(entry.data.order, `Invalid project order in ${relative(filePath)}`);
    validateUnique(
      orderRegistry,
      entry.data.order,
      `Duplicate project order "${entry.data.order}"`,
    );

    projects.push({
      slug,
      title: entry.data.title.trim(),
      excerpt: entry.data.excerpt.trim(),
      date: projectDate,
      coverImage: entry.data.coverImage.trim(),
      stack: entry.data.stack.map((value) => value.trim()),
      links: entry.data.links.map((link) => ({
        label: link.label.trim(),
        url: link.url.trim(),
        ...(link.icon ? { icon: String(link.icon).trim() } : {}),
      })),
      featured: entry.data.featured,
      order: entry.data.order,
    });
  }

  return projects.sort((left, right) => left.order - right.order);
}

async function loadPosts() {
  const files = await getIndexMarkdownFiles(postsDir);
  const slugRegistry = new Set();
  const visiblePosts = [];

  for (const filePath of files) {
    const entry = await parseMarkdownFile(filePath);
    const slug = resolveSlug(entry.data, entry.folderName);
    const isDraft = entry.data.draft === true;

    validateUnique(slugRegistry, slug, `Duplicate post slug "${slug}"`);
    validateRequiredString(entry.data.title, `Missing post title in ${relative(filePath)}`);
    validateRequiredString(entry.data.excerpt, `Missing post excerpt in ${relative(filePath)}`);
    const postDate = normalizeDate(entry.data.date, `Invalid post date in ${relative(filePath)}`);
    validateRequiredString(
      entry.data.coverImage,
      `Missing post coverImage in ${relative(filePath)}`,
    );
    validateStringArray(entry.data.tags, `Invalid post tags in ${relative(filePath)}`);

    const updatedAt =
      entry.data.updatedAt != null
        ? normalizeDate(entry.data.updatedAt, `Invalid post updatedAt in ${relative(filePath)}`)
        : null;

    const readingTimeMinutes = calculateReadingTime(entry.content);
    const sanitizedHtml = sanitizeGeneratedHtml(marked.parse(entry.content));
    const canonicalUrl = stringifyOptional(entry.data.canonicalUrl) ?? `${siteUrl}/blog/${slug}`;
    const ogImage = stringifyOptional(entry.data.ogImage) ?? entry.data.coverImage.trim();

    if (!isDraft) {
      visiblePosts.push({
        slug,
        title: entry.data.title.trim(),
        excerpt: entry.data.excerpt.trim(),
        date: postDate,
        ...(updatedAt ? { updatedAt } : {}),
        tags: entry.data.tags.map((value) => value.trim()),
        coverImage: entry.data.coverImage.trim(),
        readingTimeMinutes,
        contentHtml: sanitizedHtml,
        seo: {
          title: `${entry.data.title.trim()} | Matias Galeano`,
          description: entry.data.excerpt.trim(),
          canonicalUrl,
          ogImage,
        },
      });
    }
  }

  visiblePosts.sort((left, right) => right.date.localeCompare(left.date));

  return {
    index: visiblePosts.map(({ contentHtml, seo, ...indexEntry }) => indexEntry),
    details: visiblePosts,
  };
}

async function parseMarkdownFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = matter(raw);
  const folderName = path.basename(path.dirname(filePath));

  return {
    filePath,
    folderName,
    data: parsed.data,
    content: parsed.content.trim(),
  };
}

function resolveSlug(frontmatter, folderName) {
  const source = stringifyOptional(frontmatter.slug) ?? folderName;
  const slug = slugify(source);

  if (!slug) {
    throw new Error(`Unable to resolve slug for folder "${folderName}"`);
  }

  if (slug !== folderName) {
    throw new Error(`Slug "${slug}" must match folder name "${folderName}"`);
  }

  return slug;
}

export function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateReadingTime(content) {
  const words = content.split(/\s+/).filter(Boolean).length;

  if (words === 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(words / 200));
}

export function sanitizeGeneratedHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'strong',
      'em',
      'code',
      'pre',
      'hr',
      'br',
      'img',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
      code: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  });
}

async function getIndexMarkdownFiles(directoryPath) {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    const files = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const filePath = path.join(directoryPath, entry.name, 'index.md');
      const exists = await fileExists(filePath);

      if (!exists) {
        throw new Error(`Missing index.md in ${relative(path.join(directoryPath, entry.name))}`);
      }

      files.push(filePath);
    }

    return files;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

function validateRequiredString(value, message) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(message);
  }
}

export function normalizeDate(value, message) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  throw new Error(message);
}

function validateStringArray(value, message) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => typeof item !== 'string')
  ) {
    throw new Error(message);
  }
}

function validateProjectLinks(value, fileLabel) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Invalid project links in ${fileLabel}`);
  }

  for (const link of value) {
    if (typeof link !== 'object' || link == null) {
      throw new Error(`Invalid project link entry in ${fileLabel}`);
    }

    validateRequiredString(link.label, `Missing project link label in ${fileLabel}`);
    validateRequiredString(link.url, `Missing project link url in ${fileLabel}`);
  }
}

function validateBoolean(value, message) {
  if (typeof value !== 'boolean') {
    throw new Error(message);
  }
}

function validateNumber(value, message) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(message);
  }
}

function validateUnique(registry, value, message) {
  if (registry.has(value)) {
    throw new Error(message);
  }

  registry.add(value);
}

function stringifyOptional(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function buildRss(posts) {
  const items = posts
    .map((post) => {
      const pubDate = new Date(`${post.date}T00:00:00.000Z`).toUTCString();
      const description = xmlEscape(post.excerpt);
      const link = `${siteUrl}/blog/${post.slug}`;

      return `  <item>
    <title>${xmlEscape(post.title)}</title>
    <link>${link}</link>
    <guid>${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${description}</description>
  </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Matias Galeano Blog</title>
  <link>${siteUrl}/blog</link>
  <description>Posts tecnicos en español sobre Angular, NestJS, AWS, arquitectura y producto.</description>
  <language>es-ar</language>
${items}
</channel>
</rss>
`;
}

export function buildSitemap(posts) {
  const urls = [
    {
      loc: `${siteUrl}/blog`,
      lastmod: posts[0]?.updatedAt ?? posts[0]?.date ?? new Date().toISOString().slice(0, 10),
    },
    ...posts.map((post) => ({
      loc: `${siteUrl}/blog/${post.slug}`,
      lastmod: post.updatedAt ?? post.date,
    })),
  ]
    .map(
      ({ loc, lastmod }) => `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureCleanDirectory(directoryPath) {
  await fs.rm(directoryPath, { recursive: true, force: true });
  await ensureDirectory(directoryPath);
}

function relative(filePath) {
  return path.relative(rootDir, filePath);
}
