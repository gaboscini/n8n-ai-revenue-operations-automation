import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowPath = path.join(root, 'workflows', 'revops-ai-enterprise-control-plane.json');
const schemaPath = path.join(root, 'supabase', 'schema.sql');
const imagePath = path.join(root, 'docs', 'assets', 'workflow-overview.png');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

const workflowText = fs.readFileSync(workflowPath, 'utf8');
const workflow = JSON.parse(workflowText);
const nodes = workflow.nodes ?? [];
const names = new Set();
const typeCounts = {};

for (const node of nodes) {
  assert(!names.has(node.name), `Duplicate node name: ${node.name}`);
  names.add(node.name);
  typeCounts[node.type] = (typeCounts[node.type] ?? 0) + 1;
  assert(node.disabled !== true, `Disabled node: ${node.name}`);
  assert(Object.keys(node.credentials ?? {}).length === 0, `Credential reference present: ${node.name}`);
  if (node.type === 'n8n-nodes-base.code') {
    try { new Function(node.parameters?.jsCode ?? ''); }
    catch (error) { errors.push(`Invalid JavaScript in ${node.name}: ${error.message}`); }
  }
}

for (const [source, outputs] of Object.entries(workflow.connections ?? {})) {
  assert(names.has(source), `Missing connection source: ${source}`);
  for (const branch of outputs.main ?? []) {
    for (const edge of branch ?? []) assert(names.has(edge.node), `Missing connection target: ${source} -> ${edge.node}`);
  }
}

const executable = nodes.filter((node) => node.type !== 'n8n-nodes-base.stickyNote');
const notes = nodes.filter((node) => node.type === 'n8n-nodes-base.stickyNote');
const rectangle = (node) => ({
  x: node.position?.[0] ?? 0,
  y: node.position?.[1] ?? 0,
  width: node.parameters?.width ?? 220,
  height: node.parameters?.height ?? 100,
});
const intersects = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

for (let left = 0; left < executable.length; left += 1) {
  for (let right = left + 1; right < executable.length; right += 1) {
    assert(!intersects(rectangle(executable[left]), rectangle(executable[right])), `Functional-node overlap: ${executable[left].name} <> ${executable[right].name}`);
  }
}
for (let left = 0; left < notes.length; left += 1) {
  for (let right = left + 1; right < notes.length; right += 1) {
    assert(!intersects(rectangle(notes[left]), rectangle(notes[right])), `Background-note overlap: ${notes[left].name} <> ${notes[right].name}`);
  }
}
for (const node of executable) {
  const current = rectangle(node);
  const center = { x: current.x + current.width / 2, y: current.y + current.height / 2 };
  const coverage = notes.filter((note) => {
    const background = rectangle(note);
    return center.x >= background.x && center.x <= background.x + background.width && center.y >= background.y && center.y <= background.y + background.height;
  });
  assert(coverage.length === 1, `Expected one contextual background for ${node.name}; found ${coverage.length}`);
}

const expectedTypes = {
  'n8n-nodes-base.supabase': 23,
  '@n8n/n8n-nodes-langchain.openAi': 5,
  'n8n-nodes-base.hubspot': 4,
  'n8n-nodes-base.slack': 6,
  'n8n-nodes-base.gmail': 2,
  'n8n-nodes-base.httpRequest': 1,
  'n8n-nodes-base.code': 29,
  'n8n-nodes-base.stickyNote': 7,
};
assert(nodes.length === 99, `Expected 99 nodes; found ${nodes.length}`);
assert(executable.length === 92, `Expected 92 functional nodes; found ${executable.length}`);
for (const [type, count] of Object.entries(expectedTypes)) assert(typeCounts[type] === count, `Expected ${count} ${type} nodes; found ${typeCounts[type] ?? 0}`);
assert(typeCounts['n8n-nodes-base.postgres'] === undefined, 'PostgreSQL node found');
assert(workflow.active === false, 'Portfolio workflow must be inactive');

const sensitivePatterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token', /gh[pousr]_[A-Za-z0-9_]{20,}/],
  ['OpenAI key', /sk-[A-Za-z0-9_-]{20,}/],
  ['live Slack webhook', /hooks\.slack\.com\/services\/[A-Z0-9]{6,}\/[A-Z0-9]{6,}\/[A-Za-z0-9]{12,}/i],
  ['JWT-like token', /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
];
for (const [label, pattern] of sensitivePatterns) assert(!pattern.test(workflowText), `Detected ${label}`);

const urls = [...new Set(workflowText.match(/https?:\/\/[^\s"'`}\\]+/g) ?? [])];
for (const url of urls) {
  assert(url === 'https://example.com/replace-booking-link' || url === 'https://hooks.slack.com/services/REPLACE/WITH/WEBHOOK', `Unexpected literal URL: ${url}`);
}

const schema = fs.readFileSync(schemaPath, 'utf8');
assert((schema.match(/CREATE TABLE IF NOT EXISTS revops_/g) ?? []).length === 7, 'Supabase schema must define seven revops tables');
assert((schema.match(/CREATE INDEX IF NOT EXISTS idx_revops_/g) ?? []).length >= 5, 'Supabase schema must define supporting indexes');
assert((schema.match(/ALTER TABLE revops_.* ENABLE ROW LEVEL SECURITY;/g) ?? []).length === 7, 'Supabase schema must enable RLS on seven tables');

const png = fs.readFileSync(imagePath);
assert(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'Workflow overview is not a valid PNG');
const imageWidth = png.readUInt32BE(16);
const imageHeight = png.readUInt32BE(20);
assert(imageWidth >= 1600 && imageHeight >= 700, `Workflow overview resolution is too small: ${imageWidth}x${imageHeight}`);

const markdownFiles = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.name.endsWith('.md')) markdownFiles.push(fullPath);
  }
};
walk(root);
for (const markdownPath of markdownFiles) {
  const markdown = fs.readFileSync(markdownPath, 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^(https?:|mailto:)/i.test(target)) continue;
    assert(fs.existsSync(path.resolve(path.dirname(markdownPath), target)), `Broken link in ${path.relative(root, markdownPath)}: ${target}`);
  }
}

const summary = {
  status: errors.length ? 'failed' : 'passed',
  workflow: workflow.name,
  nodes: nodes.length,
  functionalNodes: executable.length,
  backgroundNotes: notes.length,
  codeNodes: typeCounts['n8n-nodes-base.code'] ?? 0,
  image: `${imageWidth}x${imageHeight}`,
  errors,
};
console.log(JSON.stringify(summary, null, 2));
if (errors.length) process.exitCode = 1;
