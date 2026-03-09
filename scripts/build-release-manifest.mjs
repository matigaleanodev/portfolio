import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const rootDir = process.cwd();
const outputDir = join(rootDir, '.generated');
const outputPath = join(outputDir, 'release-manifest.json');
const postsPath = join(rootDir, 'src', 'assets', 'blog', 'posts.json');
const projectsPath = join(rootDir, 'src', 'assets', 'projects.json');

const [posts, projects] = await Promise.all([
  readJsonWithRetry(postsPath),
  readJsonWithRetry(projectsPath),
]);

if (!Array.isArray(posts)) {
  throw new TypeError('Expected blog posts index to be an array.');
}

if (!Array.isArray(projects)) {
  throw new TypeError('Expected projects index to be an array.');
}

const manifest = {
  generatedAt: new Date().toISOString(),
  siteUrl: 'https://matiasgaleano.dev',
  git: {
    sha: process.env.GITHUB_SHA ?? null,
    ref: process.env.GITHUB_REF ?? null,
  },
  deploy: {
    provider: 'firebase-hosting',
    publicDir: 'dist/portfolio/browser',
  },
  seo: {
    rssPath: '/rss.xml',
    sitemapPath: '/sitemap.xml',
    blogSitemapPath: '/sitemap-blog.xml',
  },
  content: {
    posts: posts.map((post) => ({
      slug: typeof post?.slug === 'string' ? post.slug : '',
      title: typeof post?.title === 'string' ? post.title : '',
      date: typeof post?.date === 'string' ? post.date : '',
      canonicalPath:
        typeof post?.slug === 'string' && post.slug ? `/blog/${post.slug}` : '',
    })),
    projects: projects.map((project) => ({
      slug: typeof project?.slug === 'string' ? project.slug : '',
      title: typeof project?.title === 'string' ? project.title : '',
    })),
  },
};

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, JSON.stringify(manifest, null, 2));

console.log(
  `Generated release manifest with ${manifest.content.posts.length} posts and ${manifest.content.projects.length} projects.`,
);

async function readJsonWithRetry(filePath, attempts = 3, delayMs = 40) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const raw = await readFile(filePath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
