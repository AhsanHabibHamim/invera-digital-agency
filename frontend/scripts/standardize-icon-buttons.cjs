/* eslint-disable */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dirs = ['app', 'components'];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(full);
  }
  return out;
}

function findOpenTag(src, from) {
  let i = from;
  while (i > 0) {
    const ch = src[i];
    if (ch === '<' && (src.startsWith('<button', i) || src.startsWith('<a', i))) break;
    i -= 1;
  }
  if (i <= 0) return null;
  const tagStart = i;
  let j = tagStart;
  let quote = null;
  let brace = 0;
  while (j < src.length) {
    const ch = src[j];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (brace > 0) {
      if (ch === '{') brace += 1;
      else if (ch === '}') brace -= 1;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '{') {
      brace = 1;
    } else if (ch === '>') {
      break;
    }
    j += 1;
  }
  if (j >= src.length) return null;
  const openEnd = j + 1;
  const attrs = src.slice(tagStart + 1, j);
  const tagName = attrs.trim().startsWith('a') ? 'a' : 'button';
  return { openStart: tagStart, openEnd, attrs, tagName };
}

function findCloseTag(src, openEnd, tagName) {
  const openRe = new RegExp('<' + tagName + '\\b', 'g');
  const closeRe = new RegExp('</' + tagName + '>', 'g');
  const events = [];
  let m;
  openRe.lastIndex = openEnd;
  while ((m = openRe.exec(src)) !== null) events.push([m.index, 'open']);
  closeRe.lastIndex = openEnd;
  while ((m = closeRe.exec(src)) !== null) events.push([m.index, 'close']);
  events.sort((a, b) => a[0] - b[0]);
  let depth = 1;
  for (const [idx, type] of events) {
    if (type === 'open') depth += 1;
    else depth -= 1;
    if (depth === 0) return idx;
  }
  return -1;
}

function isIconOnly(inner) {
  const trimmed = inner.trim();
  if (!trimmed) return false;
  const noTags = trimmed
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<[A-Z][A-Za-z0-9]*[\s\S]*?\/>/g, '')
    .replace(/<[A-Z][A-Za-z0-9]*[\s\S]*?<\/[A-Z][A-Za-z0-9]*>/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  return noTags.trim() === '';
}

const files = dirs.flatMap((d) => walk(path.join(root, d)));
let changedFiles = 0;
let changedCount = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('btn btn-ghost btn-sm')) continue;

  let out = src;
  let count = 0;
  let searchFrom = 0;
  let idx;
  while ((idx = out.indexOf('btn btn-ghost btn-sm', searchFrom)) !== -1) {
    const open = findOpenTag(out, idx);
    if (!open) { searchFrom = idx + 1; continue; }
    const closeIdx = findCloseTag(out, open.openEnd, open.tagName);
    if (closeIdx === -1) { searchFrom = idx + 1; continue; }
    const inner = out.slice(open.openEnd, closeIdx);
    if (isIconOnly(inner) && !/btn-icon/.test(open.attrs)) {
      const start = out.indexOf('btn btn-ghost btn-sm', open.openStart);
      out = out.slice(0, start) + 'btn btn-ghost btn-icon' + out.slice(start + 'btn btn-ghost btn-sm'.length);
      count += 1;
      searchFrom = start + 'btn btn-ghost btn-icon'.length;
    } else {
      searchFrom = idx + 1;
    }
  }

  if (out !== src) {
    fs.writeFileSync(file, out);
    changedFiles += 1;
    changedCount += count;
    console.log(`${path.relative(root, file)}: ${count}`);
  }
}

console.log(`\nTotal: ${changedCount} buttons converted across ${changedFiles} files`);
