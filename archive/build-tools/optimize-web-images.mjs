import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('/Users/rlosener/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const sources = [
  ...fs.readdirSync(root).filter(name => name.endsWith('.html')).map(name => path.join(root, name)),
  ...['assets/css', 'assets/js', 'assets/scss'].flatMap(directory => walk(path.join(root, directory))).filter(file => /\.(css|js|scss)$/.test(file)),
  path.join(root, 'archive/build-tools/verify-mvp.mjs')
];
const contents = new Map(sources.map(file => [file, fs.readFileSync(file, 'utf8')]));
const combined = [...contents.values()].join('\n');
let before = 0;
let after = 0;
let converted = 0;
for (const file of walk(path.join(root, 'assets/img')).filter(file => /\.(png|jpe?g)$/i.test(file))) {
  const relative = path.relative(root, file);
  if (relative.includes('favicon') || !combined.includes(relative)) continue;
  const output = file.replace(/\.(png|jpe?g)$/i, '-lossless.webp');
  const buffer = await sharp(file).webp({ lossless: true, effort: 6 }).toBuffer();
  const originalSize = fs.statSync(file).size;
  if (buffer.length >= originalSize) continue;
  const original = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const optimized = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (original.info.width !== optimized.info.width || original.info.height !== optimized.info.height) throw new Error(`Dimension mismatch: ${relative}`);
  for (let i = 0; i < original.data.length; i += 4) {
    if (original.data[i + 3] !== optimized.data[i + 3] || (original.data[i + 3] !== 0 && !original.data.subarray(i, i + 3).equals(optimized.data.subarray(i, i + 3)))) throw new Error(`Pixel mismatch: ${relative}`);
  }
  fs.writeFileSync(output, buffer);
  const outputRelative = path.relative(root, output);
  for (const [source, content] of contents) contents.set(source, content.replaceAll(relative, outputRelative));
  before += originalSize;
  after += buffer.length;
  converted += 1;
  console.log(`${relative}\t${originalSize}\t${buffer.length}\tPIXELS_IDENTICAL`);
}
for (const [file, content] of contents) if (content !== fs.readFileSync(file, 'utf8')) fs.writeFileSync(file, content);
console.log(JSON.stringify({ converted, before, after, saved: before - after }));
