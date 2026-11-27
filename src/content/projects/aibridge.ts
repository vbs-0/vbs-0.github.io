import type { Project } from '../types';

const repo = 'https://github.com/vbs-0/ai-bridge-mcp';

export const aibridge: Project = {
  id: 'aibridge',
  name: 'ai-bridge-mcp',
  year: '2026',
  tier: 'featured',
  oneLiner: 'A local MCP bridge and dashboard that lets several coding agents work as a team.',
  summary:
    'A Model Context Protocol server for one machine: every agent reads and writes one shared board, one patterns file and one usage ledger, and a dashboard can watch or drive any of them.',
  highlights: [
    'Shared memory as MCP tools: agents append to and read one markdown board and one file of reusable lessons.',
    'A usage ledger reports calls, tokens and errors per agent and task type.',
    'A dashboard shows agent status, live run output and the board feed; a PTY bridge puts an agent terminal in the browser.',
    'Files are the database: append-only markdown and JSON lines, no service to run.',
  ],
  layers: ['ops'],
  stack: ['Node.js', 'MCP SDK', 'node-pty', 'WebSocket'],
  metrics: [
    { value: '7', label: 'MCP tools', source: `${repo}#mcp-tools` },
    { value: '4', label: 'dependencies', source: `${repo}#notes-on-this-repository` },
  ],
  links: [{ kind: 'repo', label: 'Source', url: repo }],
  shots: [],
  figure: {
    kind: 'table',
    title: 'MCP tools',
    head: ['Tool', 'Does'],
    rows: [
      ['board_read', 'Recent board contents'],
      ['board_post', 'Append a message to the board'],
      ['patterns_read', 'The patterns file'],
      ['patterns_note', 'Append a pattern'],
      ['usage_stats', 'Calls, tokens and errors per agent'],
      ['ask_freebuff', 'Send a line to the Freebuff terminal'],
      ['ask_<agent>', 'Ask a teammate and post its reply'],
    ],
  },
  glyph: 'agents',
  limits: ['Single machine, single user, no authentication: meant for localhost only.'],
  repos: ['vbs-0/ai-bridge-mcp'],
};
