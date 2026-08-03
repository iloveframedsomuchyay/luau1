# luauengine.org

Source for the [Luau Engine](https://luauengine.org) documentation site.

A zero-dependency static site generator (`build.mjs`) renders Markdown from `content/` into `dist/`, which is served by a Cloudflare Workers static-assets deployment. Styling is deliberately matched to [luau.org](https://luau.org) so the two sites read as one family — the design tokens in `public/styles.css` were sampled from the live site.

## Quick start

```bash
npm install          # only needed for wrangler (deploys); the build itself has no deps
npm run build        # content/ -> dist/
npm run serve        # build, then preview at http://localhost:8787
```

`npm run serve` uses `serve.mjs`, which mirrors Cloudflare's `auto-trailing-slash` behaviour so local preview matches production.

## Layout

```text
├── build.mjs           # generator: markdown parser, Luau highlighter, layouts, search index
├── serve.mjs           # local preview server
├── site.config.mjs     # site metadata, navbar, docs sidebar, footer
├── wrangler.jsonc      # Cloudflare Workers static-assets config
├── assets/             # source logo + mascot (copied into dist/img/)
├── public/             # static passthrough — styles.css, site.js
├── content/
│   ├── docs/           # documentation pages (one .md per sidebar entry)
│   ├── news/           # blog posts, sorted by frontmatter date
│   └── pages/          # standalone pages (e.g. download)
└── dist/               # build output (gitignored)
```

## Adding a page

**Docs** — create `content/docs/<slug>.md` with frontmatter, then add `<slug>` to the appropriate group in `site.config.mjs`. The sidebar, breadcrumbs, prev/next pager and search index all derive from that list, and the build warns about any slug in one place but not the other.

```markdown
---
title: Page title
sidebar_label: Short label
description: One sentence, used for <meta description> and search results.
---
```

**News** — create `content/news/<slug>.md` with `title`, `date` (`YYYY-MM-DD`), `author` and `description`. It is picked up automatically and appears in `/news` and `rss.xml`.

## Markdown support

Headings (auto-anchored), paragraphs, bold/italic, inline code, links, images, ordered and unordered lists with one level of nesting, tables, blockquotes, horizontal rules, raw HTML blocks, and fenced code with an optional title:

````markdown
```luau title="src/server/Main.server.luau"
print("hello")
```
````

Syntax highlighting covers `luau`/`lua`, `bash`, `json` and `toml`. Anything else renders escaped.

Admonitions:

```markdown
:::note Optional custom title
Body text.
:::
```

Kinds: `note`, `info`, `tip`, `warning`, `caution`, `danger`, `official`.

## Generated output

Alongside the HTML, each build writes `search-index.json` (client-side Ctrl+K search), `sitemap.xml`, `robots.txt` and `rss.xml`.

## Deploying

```bash
npx wrangler login
npm run deploy
```

The Worker is assets-only — there is no server-side script. `wrangler.jsonc` declares custom domain routes for `luauengine.org` and `www.luauengine.org`; comment that `routes` block out for a first deploy if the zone is not yet on the account, and the site will still be live on `<name>.<subdomain>.workers.dev`.

## Editing the Roblox relationship statement

The "Licensed and official by Roblox Corporation" line appears on the home page hero, in the footer, and on `/docs/licensing`. The first two both render `site.robloxStatement` from `site.config.mjs`; the licensing page states it in full prose. Change those two places to change it everywhere.

## Licence

Site content and code are MIT-licensed. Roblox and Roblox Studio are trademarks of Roblox Corporation.
