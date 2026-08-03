// Static site generator for luauengine.org.
//
// Zero runtime dependencies: reads Markdown out of content/, renders it with the
// small block/inline parser below, wraps it in the layouts, and writes plain HTML
// into dist/ for Cloudflare Workers static assets to serve.
//
//   node build.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, navbar, sidebar, footer } from './site.config.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, 'content');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

function write(rel, html) {
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, 'utf8');
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (e.name === 'desktop.ini') continue;
    const s = path.join(from, e.name);
    const d = path.join(to, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

/* -------------------------------------------------------------------------- */
/* Syntax highlighting                                                        */
/* -------------------------------------------------------------------------- */

const span = (cls, raw) => `<span class="hl-${cls}">${esc(raw)}</span>`;
const spanE = (cls, escaped) => `<span class="hl-${cls}">${escaped}</span>`;

const LUAU_KW = new Set(
  ('and break do else elseif end false for function if in local nil not or repeat ' +
    'return then true until while continue export type typeof self')
    .split(' ')
);

const LUAU_BUILTIN = new Set(
  ('print warn error assert pairs ipairs next select tonumber tostring pcall xpcall ' +
    'unpack require setmetatable getmetatable rawget rawset rawequal rawlen table ' +
    'string math os coroutine bit32 utf8 buffer task game workspace script Instance ' +
    'Vector3 Vector2 CFrame Color3 UDim UDim2 Enum Engine Platform Random Players ' +
    'RunService ReplicatedStorage ServerScriptService UserInputService')
    .split(' ')
);

function hlLuaWords(chunk) {
  return esc(chunk).replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, (w) => {
    if (LUAU_KW.has(w)) return spanE('k', w);
    if (LUAU_BUILTIN.has(w)) return spanE('b', w);
    return w;
  });
}

function hlLua(src) {
  const rx =
    /(--\[\[[\s\S]*?\]\]|--[^\n]*)|(\[\[[\s\S]*?\]\]|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b0[xX][0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = rx.exec(src)) !== null) {
    out += hlLuaWords(src.slice(last, m.index));
    if (m[1]) out += span('c', m[1]);
    else if (m[2]) out += span('s', m[2]);
    else out += span('n', m[3]);
    last = rx.lastIndex;
  }
  return out + hlLuaWords(src.slice(last));
}

function hlBash(src) {
  const rx =
    /(#[^\n]*)|("(?:\\.|[^"\\])*"|'[^']*')|((?:^|\n)[ \t]*)([A-Za-z_][A-Za-z0-9_.\/-]*)|([ \t]-{1,2}[A-Za-z][A-Za-z0-9_-]*)/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = rx.exec(src)) !== null) {
    out += esc(src.slice(last, m.index));
    if (m[1] !== undefined) out += span('c', m[1]);
    else if (m[2] !== undefined) out += span('s', m[2]);
    else if (m[3] !== undefined) out += esc(m[3]) + span('b', m[4]);
    else out += span('k', m[5]);
    last = rx.lastIndex;
  }
  return out + esc(src.slice(last));
}

function hlJson(src) {
  const rx =
    /(\/\/[^\n]*)|("(?:\\.|[^"\\])*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\b\d+(?:\.\d+)?\b)/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = rx.exec(src)) !== null) {
    out += esc(src.slice(last, m.index));
    if (m[1] !== undefined) out += span('c', m[1]);
    else if (m[2] !== undefined)
      out += m[3] !== undefined ? span('b', m[2]) + esc(m[3]) : span('s', m[2]);
    else if (m[4] !== undefined) out += span('k', m[4]);
    else out += span('n', m[5]);
    last = rx.lastIndex;
  }
  return out + esc(src.slice(last));
}

function hlToml(src) {
  const rx =
    /(#[^\n]*)|(\[[^\]\n]*\])|((?:^|\n)[ \t]*)([A-Za-z_][A-Za-z0-9_.-]*)(?=[ \t]*=)|("(?:\\.|[^"\\])*")|(\btrue\b|\bfalse\b)|(-?\b\d+(?:\.\d+)?\b)/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = rx.exec(src)) !== null) {
    out += esc(src.slice(last, m.index));
    if (m[1] !== undefined) out += span('c', m[1]);
    else if (m[2] !== undefined) out += span('b', m[2]);
    else if (m[3] !== undefined) out += esc(m[3]) + span('k', m[4]);
    else if (m[5] !== undefined) out += span('s', m[5]);
    else if (m[6] !== undefined) out += span('k', m[6]);
    else out += span('n', m[7]);
    last = rx.lastIndex;
  }
  return out + esc(src.slice(last));
}

function highlight(code, lang) {
  switch ((lang || '').toLowerCase()) {
    case 'lua':
    case 'luau':
      return hlLua(code);
    case 'bash':
    case 'sh':
    case 'shell':
    case 'console':
      return hlBash(code);
    case 'json':
    case 'jsonc':
      return hlJson(code);
    case 'toml':
      return hlToml(code);
    default:
      return esc(code);
  }
}

/* -------------------------------------------------------------------------- */
/* Markdown                                                                   */
/* -------------------------------------------------------------------------- */

function inline(src) {
  const codes = [];
  let s = String(src).replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });

  s = esc(s);

  // Images then links (image syntax is a superset of link syntax).
  s = s.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
    (_, alt, src2, title) =>
      `<img src="${src2}" alt="${alt}"${title ? ` title="${title}"` : ''} loading="lazy">`
  );
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    const external = /^https?:\/\//.test(href) && !href.includes('luauengine.org');
    return `<a href="${href}"${
      external ? ' target="_blank" rel="noopener noreferrer"' : ''
    }>${text}</a>`;
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,;:!?])/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
  return s;
}

const isListItem = (l) => /^\s*(?:[-*+]|\d+\.)\s+/.test(l);

function parseList(lines, i) {
  const indentOf = (l) => l.match(/^(\s*)/)[1].length;
  const startIndent = indentOf(lines[i]);
  const ordered = /^\s*\d+\.\s/.test(lines[i]);
  const items = [];

  while (i < lines.length) {
    if (!isListItem(lines[i])) break;
    const ind = indentOf(lines[i]);
    if (ind < startIndent) break;
    if (ind > startIndent) {
      const [sub, next] = parseList(lines, i);
      if (items.length) items[items.length - 1] += sub;
      i = next;
      continue;
    }
    let text = lines[i].replace(/^\s*(?:[-*+]|\d+\.)\s+/, '');
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !isListItem(lines[i]) &&
      /^\s+\S/.test(lines[i])
    ) {
      text += ' ' + lines[i].trim();
      i++;
    }
    items.push(inline(text));
  }

  const tag = ordered ? 'ol' : 'ul';
  return [`<${tag}>${items.map((x) => `<li>${x}</li>`).join('')}</${tag}>`, i];
}

const ADMONITIONS = {
  note: 'Note',
  info: 'Info',
  tip: 'Tip',
  warning: 'Warning',
  caution: 'Warning',
  danger: 'Danger',
  official: 'Official',
};

function markdown(src) {
  const lines = String(src).replace(/\r\n/g, '\n').split('\n');
  const headings = [];
  let out = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    // Fenced code
    const fence = line.match(/^```\s*([A-Za-z0-9+#-]*)\s*(?:title=(?:"([^"]*)"|(\S+)))?\s*$/);
    if (fence) {
      const lang = fence[1] || '';
      const title = fence[2] || fence[3] || '';
      i++;
      const body = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      i++; // closing fence
      const code = body.join('\n');
      out +=
        `<div class="codeblock"${lang ? ` data-lang="${esc(lang)}"` : ''}>` +
        (title ? `<div class="codeblock-title">${esc(title)}</div>` : '') +
        `<pre><code class="lang-${esc(lang || 'text')}">${highlight(code, lang)}</code></pre>` +
        `<button class="copy" type="button" aria-label="Copy code">Copy</button>` +
        `</div>`;
      continue;
    }

    // Admonition  :::type Optional title
    const adm = line.match(/^:::\s*([a-z]+)\s*(.*)$/i);
    if (adm) {
      const kind = adm[1].toLowerCase();
      const label = adm[2].trim() || ADMONITIONS[kind] || adm[1];
      i++;
      const body = [];
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) body.push(lines[i++]);
      i++;
      const { html } = markdown(body.join('\n'));
      out += `<div class="admonition adm-${esc(kind)}"><div class="admonition-title">${esc(
        label
      )}</div><div class="admonition-body">${html}</div></div>`;
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      const id = slugify(text);
      if (level === 2 || level === 3) headings.push({ level, text, id });
      out += `<h${level} id="${id}">${inline(text)}<a class="anchor" href="#${id}" aria-label="Direct link to ${esc(
        text
      )}">#</a></h${level}>`;
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out += '<hr>';
      i++;
      continue;
    }

    // Table
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const cells = (l) =>
        l
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out +=
        '<div class="table-wrap"><table><thead><tr>' +
        head.map((c) => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        rows
          .map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>')
          .join('') +
        '</tbody></table></div>';
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const body = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ''));
      const { html } = markdown(body.join('\n'));
      out += `<blockquote>${html}</blockquote>`;
      continue;
    }

    // List
    if (isListItem(line)) {
      const [html, next] = parseList(lines, i);
      out += html;
      i = next;
      continue;
    }

    // Raw HTML block
    if (/^</.test(line)) {
      const body = [];
      while (i < lines.length && lines[i].trim() !== '') body.push(lines[i++]);
      out += body.join('\n');
      continue;
    }

    // Paragraph
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6}\s|```|:::|>|\||<)/.test(lines[i]) &&
      !isListItem(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      para.push(lines[i++]);
    }
    if (para.length) out += `<p>${inline(para.join(' ').trim())}</p>`;
    else i++;
  }

  return { html: out, headings };
}

/* -------------------------------------------------------------------------- */
/* Frontmatter                                                                */
/* -------------------------------------------------------------------------- */

function parseFile(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^".*"$/.test(v) || /^'.*'$/.test(v)) v = v.slice(1, -1);
    data[kv[1]] = v;
  }
  return { data, body: m[2] };
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

const ICON_GITHUB = `<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>`;

const ICON_SEARCH = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35"/></svg>`;

const ICON_MOON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>`;

function navbarHtml(current) {
  const links = navbar
    .map((l) => {
      const active = current.startsWith(l.href.split('/').slice(0, 2).join('/'));
      return `<a class="nav-link${active ? ' active' : ''}" href="${l.href}">${esc(l.label)}</a>`;
    })
    .join('');

  return `<header class="navbar">
  <div class="navbar-inner">
    <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <a class="brand" href="/">
      <img src="/img/logo.png" alt="" width="32" height="32">
      <span>${esc(site.shortName)}</span>
    </a>
    <nav class="nav-links" aria-label="Main">${links}</nav>
    <button class="search-trigger" type="button" aria-label="Search documentation">
      ${ICON_SEARCH}<span>Search</span><kbd>Ctrl K</kbd>
    </button>
    <div class="navbar-right">
      <a class="icon-link" href="${site.github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">${ICON_GITHUB}</a>
      <button class="theme-toggle" type="button" aria-label="Switch between dark and light mode">
        ${ICON_MOON}<span class="theme-label">Dark</span>
      </button>
    </div>
  </div>
</header>`;
}

function footerHtml() {
  const cols = footer
    .map(
      (col) => `<div class="footer-col">
      <h4>${esc(col.label)}</h4>
      <ul>${col.links
        .map((l) => {
          const ext = /^https?:/.test(l.href);
          return `<li><a href="${l.href}"${
            ext ? ' target="_blank" rel="noopener noreferrer"' : ''
          }>${esc(l.label)}</a></li>`;
        })
        .join('')}</ul>
    </div>`
    )
    .join('');

  return `<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="/img/logo.png" alt="" width="40" height="40">
      <p class="footer-statement">${esc(site.robloxStatement)}</p>
      <p class="footer-note">Luau Engine is free software. Roblox and Roblox Studio are trademarks of Roblox Corporation.</p>
    </div>
    <div class="footer-cols">${cols}</div>
  </div>
  <div class="footer-bottom">
    <span>&copy; ${new Date().getFullYear()} The Luau Engine contributors.</span>
    <span><a href="/docs/licensing">Licensing &amp; trademarks</a></span>
  </div>
</footer>`;
}

const SEARCH_MODAL = `<div class="search-modal" hidden>
  <div class="search-backdrop"></div>
  <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search documentation">
    <div class="search-field">
      ${ICON_SEARCH}
      <input type="search" placeholder="Search the documentation…" aria-label="Search query" autocomplete="off" spellcheck="false">
      <kbd>Esc</kbd>
    </div>
    <div class="search-results" role="listbox"></div>
    <div class="search-empty">Start typing to search ${site.name} docs.</div>
  </div>
</div>`;

function shell({ title, description, url, body, bodyClass = '', ogType = 'website' }) {
  const fullTitle = title === site.name ? `${site.name} — open-source game engine` : `${title} | ${site.name}`;
  const desc = description || site.description;
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${site.url}${url}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${site.url}${url}">
<meta property="og:image" content="${site.url}/img/mascot.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/favicon.ico" sizes="any">
<link rel="icon" href="/img/logo.png" type="image/png">
<link rel="apple-touch-icon" href="/img/logo.png">
<meta name="theme-color" content="#000000">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)} news" href="/rss.xml">
<link rel="stylesheet" href="/styles.css">
<script>
(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
</script>
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">Skip to main content</a>
${navbarHtml(url)}
<main id="main">${body}</main>
${footerHtml()}
${SEARCH_MODAL}
<script src="/site.js" defer></script>
</body>
</html>
`;
}

/* -------------------------------------------------------------------------- */
/* Docs                                                                       */
/* -------------------------------------------------------------------------- */

function docsSidebarHtml(currentSlug) {
  return `<aside class="docs-sidebar" aria-label="Documentation">
  <nav>
  ${sidebar
    .map(
      (group) => `<div class="sidebar-group">
      <div class="sidebar-heading">${esc(group.label)}</div>
      <ul>${group.items
        .map((slug) => {
          const page = DOCS.get(slug);
          const label = page ? page.data.sidebar_label || page.data.title : slug;
          const active = slug === currentSlug;
          return `<li><a href="/docs/${slug}"${active ? ' class="active" aria-current="page"' : ''}>${esc(
            label
          )}</a></li>`;
        })
        .join('')}</ul>
    </div>`
    )
    .join('')}
  </nav>
</aside>`;
}

function tocHtml(headings) {
  if (headings.length < 2) return '<div class="docs-toc"></div>';
  return `<div class="docs-toc">
  <div class="toc-title">On this page</div>
  <ul>${headings
    .map(
      (h) =>
        `<li class="toc-l${h.level}"><a href="#${h.id}">${esc(h.text.replace(/[`*]/g, ''))}</a></li>`
    )
    .join('')}</ul>
</div>`;
}

/* -------------------------------------------------------------------------- */
/* Home page                                                                  */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    title: 'The Studio you already know',
    body: 'Luau Engine forks the Roblox Studio editor, so the Explorer, Properties, Toolbox and the Luau script editor all work the way you expect. Existing muscle memory carries over on day one.',
  },
  {
    title: 'Free and open source',
    body: 'The whole editor, runtime and toolchain are released under a permissive licence. Read the code, patch the parts you dislike, ship your own build — no seat fees and no telemetry you did not opt into.',
  },
  {
    title: 'Publish beyond Roblox',
    body: 'Compile the same place file to a native Windows, macOS or Linux executable, a WebAssembly bundle for the browser, or a headless dedicated server — alongside publishing to Roblox as usual.',
  },
  {
    title: 'Real Luau, everywhere',
    body: 'Ships the upstream Luau VM with the full gradual type system, native code generation and the analysis tooling. Your types, lints and strict-mode settings behave identically to Roblox.',
  },
  {
    title: 'A scriptable toolchain',
    body: 'Everything the editor does is exposed through the `luauengine` CLI, so builds, tests and publishing drop straight into CI without a GUI anywhere in the loop.',
  },
  {
    title: 'Own your project files',
    body: 'Places are stored as plain-text `.rbxlx` alongside a readable project manifest, so version control produces diffs a human can actually review.',
  },
];

const TARGETS = [
  { name: 'Roblox', note: 'Publish places and experiences to roblox.com exactly as Studio does.', status: 'stable' },
  { name: 'Windows', note: 'Native x64 and ARM64 executables with an installer or a portable folder.', status: 'stable' },
  { name: 'macOS', note: 'Universal binaries for Apple Silicon and Intel, ready for notarisation.', status: 'stable' },
  { name: 'Linux', note: 'Portable AppImage plus a plain tarball for your own packaging.', status: 'stable' },
  { name: 'Web', note: 'WebAssembly + WebGPU bundle you can host on any static file server.', status: 'beta' },
  { name: 'Dedicated server', note: 'Headless authoritative build for containers and bare metal.', status: 'beta' },
  { name: 'Android', note: 'APK and AAB output signed with your own keystore.', status: 'experimental' },
  { name: 'iOS', note: 'Xcode project generation for your own signing and submission.', status: 'experimental' },
];

function homeHtml() {
  const featureCards = FEATURES.map(
    (f) => `<div class="feature-card">
      <h3>${esc(f.title)}</h3>
      <p>${inline(f.body)}</p>
    </div>`
  ).join('');

  const targetRows = TARGETS.map(
    (t) => `<div class="target-card">
      <div class="target-head"><span class="target-name">${esc(t.name)}</span><span class="badge badge-${t.status}">${esc(
      t.status
    )}</span></div>
      <p>${esc(t.note)}</p>
    </div>`
  ).join('');

  const quickstart = `local Players = game:GetService("Players")

-- The same Luau, the same DataModel, the same APIs you already write.
Players.PlayerAdded:Connect(function(player)
	print("Welcome to Luau Engine,", player.Name)
end)

-- ...plus a few things Studio cannot do.
if Engine.Platform ~= Enum.Platform.Roblox then
	Engine.Window:SetTitle("My Standalone Game")
	Engine.Window:SetSize(1920, 1080)
end`;

  return `<section class="hero">
  <div class="hero-inner">
    <div class="hero-copy">
      <h1>Luau&nbsp;Engine</h1>
      <p class="hero-tagline">A free and open-source fork of <strong>Roblox&nbsp;Studio</strong> — build with the tools you already know, then ship your game far beyond Roblox.</p>
      <p class="hero-official"><span class="dot"></span>${esc(site.robloxStatement)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="/docs/introduction">Get Started</a>
        <a class="btn btn-ghost" href="/download">Download</a>
        <a class="btn btn-link" href="${site.github}" target="_blank" rel="noopener noreferrer">View source <span aria-hidden="true">›</span></a>
      </div>
    </div>
    <div class="hero-art">
      <img src="/img/mascot.png" alt="The Luau seal mascot" width="440" height="316">
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2>Studio, unlocked</h2>
    <p class="section-lead">Luau Engine keeps everything that makes Roblox Studio productive and removes the parts that kept your game locked to a single platform.</p>
    <div class="feature-grid">${featureCards}</div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <h2>One project, many targets</h2>
    <p class="section-lead">Pick a target and build. The editor, the CLI and your CI all use the same pipeline.</p>
    <div class="codeblock codeblock-terminal">
      <div class="codeblock-title">Terminal</div>
      <pre><code class="lang-bash">${hlBash(
        `# Create a project, then build it for whatever you like\nluauengine new my-game\ncd my-game\n\nluauengine build --target windows --release\nluauengine build --target web\nluauengine publish --roblox --place-id 1234567890`
      )}</code></pre>
      <button class="copy" type="button" aria-label="Copy code">Copy</button>
    </div>
    <div class="target-grid">${targetRows}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2>Write the Luau you already write</h2>
    <p class="section-lead">The DataModel, services, events and the full gradual type system come across intact. The engine only adds APIs where a standalone build needs something Roblox never had to expose.</p>
    <div class="home-split">
      <div class="codeblock">
        <div class="codeblock-title">ServerScriptService/Welcome.server.luau</div>
        <pre><code class="lang-luau">${hlLua(quickstart)}</code></pre>
        <button class="copy" type="button" aria-label="Copy code">Copy</button>
      </div>
      <div class="home-split-copy">
        <h3>Start where you left off</h3>
        <p>Open an existing <code>.rbxl</code> place and it just loads. Instances, scripts, attributes, tags and packages are all preserved, and saving back out to Roblox format is lossless.</p>
        <ul class="check-list">
          <li>Full <code>game</code>/<code>workspace</code> DataModel</li>
          <li>Signals, tasks and the scheduler</li>
          <li>Strict-mode type checking and lints</li>
          <li>Plugin API compatible with most Studio plugins</li>
        </ul>
        <a class="btn btn-ghost btn-sm" href="/docs/migrating-from-roblox-studio">Read the migration guide</a>
      </div>
    </div>
  </div>
</section>

<section class="section section-cta">
  <div class="container cta-inner">
    <h2>Ready to build?</h2>
    <p>Install the editor, open a project and ship it wherever you want.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="/docs/installation">Install Luau Engine</a>
      <a class="btn btn-ghost" href="/docs/first-project">Your first project</a>
    </div>
  </div>
</section>`;
}

/* -------------------------------------------------------------------------- */
/* Build                                                                      */
/* -------------------------------------------------------------------------- */

const DOCS = new Map();
const NEWS = [];
const searchIndex = [];

function indexPage({ title, url, section, html, description }) {
  const text = html
    .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  searchIndex.push({ t: title, u: url, s: section, d: description || '', x: text.slice(0, 1400) });
}

function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // ---- load docs -----------------------------------------------------------
  for (const file of walk(path.join(CONTENT, 'docs'))) {
    if (!file.endsWith('.md')) continue;
    const slug = path.basename(file, '.md');
    DOCS.set(slug, parseFile(file));
  }

  const flat = sidebar.flatMap((g) => g.items.map((slug) => ({ slug, group: g.label })));
  const missing = flat.filter((f) => !DOCS.has(f.slug));
  if (missing.length) {
    console.warn('  ! sidebar references missing docs:', missing.map((m) => m.slug).join(', '));
  }
  const orphans = [...DOCS.keys()].filter((s) => !flat.some((f) => f.slug === s));
  if (orphans.length) console.warn('  ! docs not in sidebar:', orphans.join(', '));

  // ---- docs pages ----------------------------------------------------------
  flat.forEach((entry, idx) => {
    const page = DOCS.get(entry.slug);
    if (!page) return;
    const { data, body } = page;
    const { html, headings } = markdown(body);
    const url = `/docs/${entry.slug}`;

    const prev = idx > 0 ? flat[idx - 1] : null;
    const next = idx < flat.length - 1 ? flat[idx + 1] : null;
    const linkFor = (e, dir) => {
      if (!e || !DOCS.has(e.slug)) return '';
      const t = DOCS.get(e.slug).data.title;
      return `<a class="pager-link pager-${dir}" href="/docs/${e.slug}"><span class="pager-dir">${
        dir === 'prev' ? 'Previous' : 'Next'
      }</span><span class="pager-title">${esc(t)}</span></a>`;
    };

    const editUrl = `${site.github}/edit/main/content/docs/${entry.slug}.md`;

    const bodyHtml = `<div class="docs-layout">
  ${docsSidebarHtml(entry.slug)}
  <article class="docs-main">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/docs/introduction">Docs</a><span>/</span><span>${esc(
      entry.group
    )}</span></nav>
    <h1>${esc(data.title)}</h1>
    ${data.description ? `<p class="page-lead">${inline(data.description)}</p>` : ''}
    <div class="markdown">${html}</div>
    <div class="doc-footer">
      <a class="edit-link" href="${editUrl}" target="_blank" rel="noopener noreferrer">Edit this page on GitHub</a>
    </div>
    <nav class="pager" aria-label="Docs pages">${linkFor(prev, 'prev')}${linkFor(next, 'next')}</nav>
  </article>
  ${tocHtml(headings)}
</div>`;

    write(
      `docs/${entry.slug}.html`,
      shell({
        title: data.title,
        description: data.description,
        url,
        body: bodyHtml,
        bodyClass: 'page-docs',
        ogType: 'article',
      })
    );
    indexPage({
      title: data.title,
      url,
      section: entry.group,
      html,
      description: data.description,
    });
  });

  // ---- news ---------------------------------------------------------------
  for (const file of walk(path.join(CONTENT, 'news'))) {
    if (!file.endsWith('.md')) continue;
    const slug = path.basename(file, '.md');
    const { data, body } = parseFile(file);
    const { html, headings } = markdown(body);
    NEWS.push({ slug, data, html, headings });
  }
  NEWS.sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)));

  const fmtDate = (d) => {
    const dt = new Date(d + 'T00:00:00Z');
    return Number.isNaN(dt.getTime())
      ? d
      : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  };

  for (const post of NEWS) {
    const url = `/news/${post.slug}`;
    const bodyHtml = `<article class="post container-narrow">
  <a class="back-link" href="/news">‹ All news</a>
  <p class="post-meta"><time datetime="${esc(post.data.date)}">${esc(
      fmtDate(post.data.date)
    )}</time>${post.data.author ? ` · ${esc(post.data.author)}` : ''}</p>
  <h1>${esc(post.data.title)}</h1>
  ${post.data.description ? `<p class="page-lead">${inline(post.data.description)}</p>` : ''}
  <div class="markdown">${post.html}</div>
</article>`;
    write(
      `news/${post.slug}.html`,
      shell({
        title: post.data.title,
        description: post.data.description,
        url,
        body: bodyHtml,
        bodyClass: 'page-news',
        ogType: 'article',
      })
    );
    indexPage({
      title: post.data.title,
      url,
      section: 'News',
      html: post.html,
      description: post.data.description,
    });
  }

  const newsIndex = `<div class="container-narrow page-head">
  <h1>News</h1>
  <p class="page-lead">Release notes and announcements from the Luau Engine team.</p>
</div>
<div class="container-narrow news-list">
${NEWS.map(
  (p) => `<a class="news-item" href="/news/${p.slug}">
    <p class="post-meta"><time datetime="${esc(p.data.date)}">${esc(fmtDate(p.data.date))}</time>${
    p.data.author ? ` · ${esc(p.data.author)}` : ''
  }</p>
    <h2>${esc(p.data.title)}</h2>
    <p>${esc(p.data.description || '')}</p>
    <span class="news-more">Read more ›</span>
  </a>`
).join('')}
</div>`;
  write('news.html', shell({ title: 'News', description: 'Release notes and announcements from the Luau Engine team.', url: '/news', body: newsIndex, bodyClass: 'page-news' }));

  // ---- standalone pages ----------------------------------------------------
  for (const file of walk(path.join(CONTENT, 'pages'))) {
    if (!file.endsWith('.md')) continue;
    const slug = path.basename(file, '.md');
    const { data, body } = parseFile(file);
    const { html } = markdown(body);
    const url = `/${slug}`;
    const bodyHtml = `<div class="container-narrow page-head">
  <h1>${esc(data.title)}</h1>
  ${data.description ? `<p class="page-lead">${inline(data.description)}</p>` : ''}
</div>
<div class="container-narrow markdown">${html}</div>`;
    write(`${slug}.html`, shell({ title: data.title, description: data.description, url, body: bodyHtml, bodyClass: 'page-standalone' }));
    indexPage({ title: data.title, url, section: 'Site', html, description: data.description });
  }

  // ---- home ----------------------------------------------------------------
  write(
    'index.html',
    shell({
      title: site.name,
      description: site.description,
      url: '/',
      body: homeHtml(),
      bodyClass: 'page-home',
    })
  );

  // ---- 404 -----------------------------------------------------------------
  write(
    '404.html',
    shell({
      title: 'Page not found',
      description: 'That page does not exist.',
      url: '/404',
      body: `<div class="container-narrow notfound">
      <p class="notfound-code">404</p>
      <h1>Page not found</h1>
      <p class="page-lead">We could not find that page. It may have moved, or the link may be out of date.</p>
      <div class="hero-actions"><a class="btn btn-primary" href="/">Go home</a><a class="btn btn-ghost" href="/docs/introduction">Browse the docs</a></div>
    </div>`,
      bodyClass: 'page-404',
    })
  );

  // ---- static assets -------------------------------------------------------
  copyDir(PUBLIC, DIST);
  fs.mkdirSync(path.join(DIST, 'img'), { recursive: true });
  for (const [from, to] of [
    ['logo.png', 'logo.png'],
    ['mascot.png', 'mascot.png'],
    ['logo.ico', 'favicon.ico'],
  ]) {
    const src = path.join(ROOT, 'assets', from);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DIST, 'img', to));
  }

  // ---- search index, sitemap, robots, rss ---------------------------------
  fs.writeFileSync(path.join(DIST, 'search-index.json'), JSON.stringify(searchIndex), 'utf8');

  const urls = ['/', '/download', '/news', ...flat.map((f) => `/docs/${f.slug}`), ...NEWS.map((n) => `/news/${n.slug}`)];
  const uniq = [...new Set(urls)];
  fs.writeFileSync(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniq
      .map((u) => `  <url><loc>${site.url}${u}</loc></url>`)
      .join('\n')}\n</urlset>\n`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(DIST, 'rss.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(site.name)} news</title>
<link>${site.url}/news</link>
<description>${esc(site.description)}</description>
${NEWS.map(
  (p) => `<item>
<title>${esc(p.data.title)}</title>
<link>${site.url}/news/${p.slug}</link>
<guid>${site.url}/news/${p.slug}</guid>
<pubDate>${new Date(p.data.date + 'T00:00:00Z').toUTCString()}</pubDate>
<description>${esc(p.data.description || '')}</description>
</item>`
).join('\n')}
</channel></rss>
`,
    'utf8'
  );

  const count = walk(DIST).filter((f) => f.endsWith('.html')).length;
  console.log(`  built ${count} pages -> dist/`);
  console.log(`  ${searchIndex.length} entries in search index`);
}

build();
