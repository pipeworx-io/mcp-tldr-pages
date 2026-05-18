interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * tldr-pages MCP — fetched from the canonical github repo.
 */


const REPO = 'https://raw.githubusercontent.com/tldr-pages/tldr/main';
const INDEX = 'https://tldr.sh/assets/index.json';
const UA = 'pipeworx-mcp-tldr-pages/1.0 (+https://pipeworx.io)';
const TTL_MS = 24 * 60 * 60 * 1000;
let INDEX_CACHE: { at: number; data: { commands: { name: string; platform: string[]; language: string[]; targets?: { os: string; language: string }[] }[] } } | null = null;

const tools: McpToolExport['tools'] = [
  {
    name: 'page',
    description: 'Render tldr page for a command.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        platform: { type: 'string', description: 'common (default) | linux | osx | windows | android | sunos | freebsd' },
        language: { type: 'string', description: 'ISO 639-1, default "en".' },
      },
      required: ['command'],
    },
  },
  {
    name: 'commands',
    description: 'List commands.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string' },
        language: { type: 'string' },
      },
    },
  },
  {
    name: 'platforms',
    description: 'List supported platforms.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'search',
    description: 'Substring search across page titles.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        platform: { type: 'string' },
        language: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'page': {
      const cmd = reqStr(args, 'command', '"tar"');
      const platform = String(args.platform ?? 'common');
      const lang = String(args.language ?? 'en');
      const dir = lang === 'en' ? 'pages' : `pages.${lang}`;
      const url = `${REPO}/${dir}/${platform}/${cmd}.md`;
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 404) {
        // Fall back to common.
        if (platform !== 'common') {
          const fb = await fetch(`${REPO}/${dir}/common/${cmd}.md`, { headers: { 'User-Agent': UA } });
          if (fb.ok) return { command: cmd, platform: 'common', language: lang, body: await fb.text() };
        }
        throw new Error(`tldr: ${cmd} not found on ${platform}/${lang}.`);
      }
      if (!res.ok) throw new Error(`tldr: ${res.status}`);
      return { command: cmd, platform, language: lang, body: await res.text() };
    }
    case 'commands': {
      const idx = await loadIndex();
      const platform = (args.platform as string | undefined) ?? 'common';
      const lang = (args.language as string | undefined) ?? 'en';
      const cmds = idx.commands.filter((c) => c.platform.includes(platform) && c.language.includes(lang)).map((c) => c.name);
      return { platform, language: lang, count: cmds.length, commands: cmds };
    }
    case 'platforms': {
      const idx = await loadIndex();
      const set = new Set<string>();
      for (const c of idx.commands) for (const p of c.platform) set.add(p);
      return { platforms: [...set].sort() };
    }
    case 'search': {
      const idx = await loadIndex();
      const q = reqStr(args, 'query', '"compress"').toLowerCase();
      const platform = args.platform as string | undefined;
      const lang = (args.language as string | undefined) ?? 'en';
      const limit = Math.min(500, Math.max(1, (args.limit as number) ?? 50));
      const matches = idx.commands.filter((c) => c.name.toLowerCase().includes(q) && (!platform || c.platform.includes(platform)) && c.language.includes(lang)).slice(0, limit);
      return { query: q, count: matches.length, commands: matches };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function loadIndex() {
  const now = Date.now();
  if (INDEX_CACHE && now - INDEX_CACHE.at < TTL_MS) return INDEX_CACHE.data;
  const res = await fetch(INDEX, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`tldr index: ${res.status}`);
  const data = (await res.json()) as typeof INDEX_CACHE['data'];
  INDEX_CACHE = { at: now, data };
  return data;
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
