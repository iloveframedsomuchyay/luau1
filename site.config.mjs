// Single source of truth for site metadata and navigation.
// `build.mjs` reads this to generate the navbar, docs sidebar and prev/next links.

export const site = {
  name: 'Luau Engine',
  shortName: 'Luau Engine',
  url: 'https://luauengine.org',
  tagline:
    'Luau Engine is a free and open-source fork of Roblox Studio, licensed and official by Roblox Corporation.',
  description:
    'Luau Engine is a free, open-source fork of Roblox Studio. Build with the tools you already know, then publish to Roblox — or compile standalone games for Windows, macOS, Linux and the web.',
  github: 'https://github.com/Luau-Engine/LuauEngine',
  discord: 'https://discord.gg/luauengine',
  // ---------------------------------------------------------------------------
  // Roblox relationship statement. This one string is rendered on the home page
  // hero badge, the footer and /docs/licensing. Edit here to change it everywhere.
  // ---------------------------------------------------------------------------
  robloxStatement: 'Licensed and official by Roblox Corporation.',
  currentVersion: '0.9.4',
};

export const navbar = [
  { label: 'Docs', href: '/docs/introduction' },
  { label: 'Download', href: '/download' },
  { label: 'News', href: '/news' },
];

// Docs sidebar. Each `items` entry maps to content/docs/<slug>.md
export const sidebar = [
  {
    label: 'Getting Started',
    items: [
      'introduction',
      'installation',
      'first-project',
      'editor-tour',
      'migrating-from-roblox-studio',
    ],
  },
  {
    label: 'Building Games',
    items: ['datamodel', 'scripting', 'assets', 'rendering-and-physics', 'plugins'],
  },
  {
    label: 'Publishing',
    items: [
      'publishing-overview',
      'publish-roblox',
      'export-desktop',
      'export-web',
      'export-mobile',
      'dedicated-servers',
    ],
  },
  {
    label: 'Reference',
    items: ['cli', 'project-file', 'api-differences', 'file-formats', 'keybindings'],
  },
  {
    label: 'About',
    items: ['licensing', 'faq', 'contributing', 'roadmap'],
  },
];

export const footer = [
  {
    label: 'Documentation',
    links: [
      { label: 'Introduction', href: '/docs/introduction' },
      { label: 'Installation', href: '/docs/installation' },
      { label: 'Your first project', href: '/docs/first-project' },
      { label: 'CLI reference', href: '/docs/cli' },
    ],
  },
  {
    label: 'Publishing',
    links: [
      { label: 'Overview', href: '/docs/publishing-overview' },
      { label: 'Publish to Roblox', href: '/docs/publish-roblox' },
      { label: 'Desktop export', href: '/docs/export-desktop' },
      { label: 'Web export', href: '/docs/export-web' },
    ],
  },
  {
    label: 'Project',
    links: [
      { label: 'News', href: '/news' },
      { label: 'Roadmap', href: '/docs/roadmap' },
      { label: 'Contributing', href: '/docs/contributing' },
      { label: 'Licensing', href: '/docs/licensing' },
    ],
  },
  {
    label: 'Community',
    links: [
      { label: 'GitHub', href: site.github },
      { label: 'Issue tracker', href: site.github + '/issues' },
      { label: 'Discussions', href: site.github + '/discussions' },
      { label: 'Luau language', href: 'https://luau.org' },
    ],
  },
];
