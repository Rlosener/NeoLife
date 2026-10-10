import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const releaseRoot = path.join(sourceRoot, 'release');
const stageRoot = path.join(releaseRoot, '.stage');
const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const output = path.resolve(sourceRoot, valueAfter('--output') || 'release/NeoLife-cPanel.zip');
const rawSiteUrl = valueAfter('--site-url') || process.env.NEOLIFE_SITE_URL || '';
const siteUrl = rawSiteUrl ? rawSiteUrl.replace(/\/$/, '') : '';

if (siteUrl && !/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/i.test(siteUrl)) {
  throw new Error('--site-url yalnızca https://alanadi.tld biçiminde olmalı.');
}

const routes = new Map([
  ['index.html', '/'],
  ['about.html', '/hakkimizda'],
  ['services-grid.html', '/hizmetler'],
  ['services-details.html', '/proje-gelistirme'],
  ['project-grid.html', '/projeler'],
  ['project-details.html', '/panorama'],
  ['project-helios.html', '/helios'],
  ['blog-standard.html', '/blog'],
  ['blog-details.html', '/kibrista-gayrimenkul-yatirimi'],
  ['blog-girnede-yasam.html', '/girnede-yasam'],
  ['blog-insaat-kalitesi.html', '/insaat-kalitesi'],
  ['blog-kibris-konut-rehberi.html', '/kibrista-konut-secimi'],
  ['contact.html', '/iletisim'],
  ['faq.html', '/sikca-sorulan-sorular'],
  ['404.html', '/404'],
]);
const compatibilityFiles = ['index-3.html'];
const htmlAllowlist = [...routes.keys(), ...compatibilityFiles].sort();
const runtimePolicies = new Map([
  ['assets/css', new Set(['.css'])],
  ['assets/fonts', new Set(['.ttf', '.woff2'])],
  ['assets/img', new Set(['.jpg', '.jpeg', '.png', '.webp'])],
  ['assets/js', new Set(['.js'])],
  ['assets/video', new Set(['.mp4'])],
]);
const runtimeDirectories = [...runtimePolicies.keys()];
const rootAllowlist = ['.htaccess', 'robots.txt'];
const forbidden = /(^|\/)(?:archive|\.idea|release|__MACOSX)(\/|$)|(^|\/)(?:design-qa\.md|Arşiv\.zip|\.DS_Store)$|\.(?:zip|tar|gz|bak|backup|sql|log|map|scss)$/i;
const sourceRealRoot = fs.realpathSync(sourceRoot);

const rootHtml = fs.readdirSync(sourceRoot).filter((name) => name.endsWith('.html')).sort();
const missingHtml = htmlAllowlist.filter((name) => !rootHtml.includes(name));
const unexpectedHtml = rootHtml.filter((name) => !htmlAllowlist.includes(name));
if (missingHtml.length || unexpectedHtml.length) {
  throw new Error(`Kök HTML allowlist uyuşmazlığı. Eksik: ${missingHtml.join(', ') || '-'}; beklenmeyen: ${unexpectedHtml.join(', ') || '-'}.`);
}

const toPosix = (value) => value.split(path.sep).join('/');
const ensureInside = (root, candidate, label) => {
  const relative = path.relative(root, candidate);
  if (relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
    throw new Error(`${label}: kaynak kökünün dışına çıkıyor.`);
  }
};
const assertSafeSourceNode = (absolute, relative) => {
  const stats = fs.lstatSync(absolute);
  if (stats.isSymbolicLink()) throw new Error(`${relative}: sembolik bağlara release paketinde izin verilmez.`);
  if (!stats.isFile() && !stats.isDirectory()) throw new Error(`${relative}: yalnızca normal dosya ve dizinlere izin verilir.`);
  ensureInside(sourceRealRoot, fs.realpathSync(absolute), relative);
  return stats;
};
const copyTree = (relativeDirectory) => {
  const source = path.join(sourceRoot, relativeDirectory);
  const destination = path.join(stageRoot, relativeDirectory);
  const allowedExtensions = runtimePolicies.get(relativeDirectory);
  assertSafeSourceNode(source, relativeDirectory);
  fs.mkdirSync(destination, { recursive: true });

  const copyDirectory = (currentSource, currentDestination) => {
    for (const entry of fs.readdirSync(currentSource, { withFileTypes: true })) {
      const absolute = path.join(currentSource, entry.name);
      const relative = toPosix(path.relative(sourceRoot, absolute));
      if (entry.name === '.DS_Store') continue;
      if (entry.name.startsWith('.')) throw new Error(`${relative}: gizli dosya veya dizin release allowlist'inde değil.`);
      if (forbidden.test(relative)) throw new Error(`${relative}: yasaklı release girdisi.`);
      const stats = assertSafeSourceNode(absolute, relative);
      const target = path.join(currentDestination, entry.name);
      if (stats.isDirectory()) {
        fs.mkdirSync(target, { recursive: true });
        copyDirectory(absolute, target);
        continue;
      }
      const extension = path.extname(entry.name).toLowerCase();
      if (!allowedExtensions.has(extension)) {
        throw new Error(`${relative}: ${relativeDirectory} için izin verilmeyen dosya türü (${extension || 'uzantısız'}).`);
      }
      fs.copyFileSync(absolute, target);
    }
  };

  copyDirectory(source, destination);
};

const replaceLocalRoute = (value) => {
  const match = value.match(/^([^?#]+)([?#].*)?$/);
  if (!match || !routes.has(match[1])) return value;
  return `${routes.get(match[1])}${match[2] || ''}`;
};

const transformLinks = (html) => html.replace(/\b(href|action)=(['"])(.*?)\2/gis, (full, attribute, quote, value) => {
  if (/^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(value)) return full;
  return `${attribute}=${quote}${replaceLocalRoute(value)}${quote}`;
});

const escapeAttribute = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const textFromTag = (html, expression) => (html.match(expression)?.[1] || '').replace(/\s+/g, ' ').trim();
const getAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'is'));
  return match ? match[2] : '';
};
const socialImageByPage = new Map([
  ['index.html', '/assets/img/neolife/home/hero-helios-pool-volleyball.webp'],
  ['blog-details.html', '/assets/img/neolife/editorial/kibris-yatirim.webp'],
  ['blog-girnede-yasam.html', '/assets/img/neolife/editorial/girne-yasam.webp'],
  ['blog-insaat-kalitesi.html', '/assets/img/neolife/editorial/insaat-kalite.webp'],
  ['blog-kibris-konut-rehberi.html', '/assets/img/neolife/editorial/kibris-yatirim.webp'],
]);

const injectSeo = (html, file) => {
  if (file === 'index-3.html') return html;
  html = html
    .replace(/\s*<link\b[^>]*\brel=["']canonical["'][^>]*>/gi, '')
    .replace(/\s*<meta\b[^>]*(?:\bproperty=["']og:[^"']+["']|\bname=["'](?:twitter:[^"']+|robots)["'])[^>]*>/gi, '')
    .replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  const route = routes.get(file);
  const canonical = siteUrl ? `${siteUrl}${route}` : route;
  const title = textFromTag(html, /<title>([\s\S]*?)<\/title>/i);
  const descriptionTag = (html.match(/<meta\b[^>]*>/gi) || [])
    .find((tag) => getAttribute(tag, 'name').toLowerCase() === 'description');
  const description = descriptionTag ? getAttribute(descriptionTag, 'content') : '';
  const isArticle = file.startsWith('blog-') && file !== 'blog-standard.html';
  const imagePath = socialImageByPage.get(file);
  const socialImage = siteUrl && imagePath ? `${siteUrl}${imagePath}` : '';
  const robots = file === '404.html' ? 'noindex,follow' : 'index,follow,max-image-preview:large';
  const meta = [
    `    <link rel="canonical" href="${escapeAttribute(canonical)}">`,
    `    <meta name="robots" content="${robots}">`,
    `    <meta property="og:locale" content="tr_TR">`,
    `    <meta property="og:type" content="${isArticle ? 'article' : 'website'}">`,
    `    <meta property="og:site_name" content="NeoLife">`,
    `    <meta property="og:title" content="${escapeAttribute(title)}">`,
    `    <meta property="og:description" content="${escapeAttribute(description)}">`,
    `    <meta name="twitter:card" content="${socialImage ? 'summary_large_image' : 'summary'}">`,
  ];
  if (siteUrl) meta.push(`    <meta property="og:url" content="${escapeAttribute(canonical)}">`);
  if (socialImage) meta.push(`    <meta property="og:image" content="${escapeAttribute(socialImage)}">`);
  if (file === 'index.html' && siteUrl) {
    const organization = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'NeoLife',
      url: `${siteUrl}/`,
      logo: `${siteUrl}/assets/img/logo/neolife-logo-black.png`,
      email: 'info@neolife.com',
    };
    meta.push(`    <script type="application/ld+json">${JSON.stringify(organization)}</script>`);
  }
  return html.replace(/\s*<\/head>/i, `\n${meta.join('\n')}\n</head>`);
};

fs.mkdirSync(releaseRoot, { recursive: true });
fs.rmSync(stageRoot, { recursive: true, force: true });
fs.mkdirSync(stageRoot, { recursive: true });

for (const directory of runtimeDirectories) copyTree(directory);
for (const file of rootAllowlist) {
  const source = path.join(sourceRoot, file);
  const stats = assertSafeSourceNode(source, file);
  if (!stats.isFile()) throw new Error(`${file}: release kök girdisi normal dosya olmalı.`);
  fs.copyFileSync(source, path.join(stageRoot, file));
}

for (const file of htmlAllowlist) {
  let html = fs.readFileSync(path.join(sourceRoot, file), 'utf8');
  html = transformLinks(html);
  html = injectSeo(html, file);
  fs.writeFileSync(path.join(stageRoot, file), html);
}

if (siteUrl) {
  const urls = [...routes.entries()]
    .filter(([file]) => file !== '404.html')
    .map(([, route]) => `  <url><loc>${siteUrl}${route}</loc></url>`)
    .join('\n');
  fs.writeFileSync(path.join(stageRoot, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.appendFileSync(path.join(stageRoot, 'robots.txt'), `Sitemap: ${siteUrl}/sitemap.xml\n`);
}

const stageRealRoot = fs.realpathSync(stageRoot);
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = path.join(directory, entry.name);
  const relative = toPosix(path.relative(stageRoot, absolute));
  const stats = fs.lstatSync(absolute);
  if (stats.isSymbolicLink()) throw new Error(`${relative}: stage içinde sembolik bağ bulundu.`);
  if (stats.isDirectory()) return walk(absolute);
  if (!stats.isFile()) throw new Error(`${relative}: stage içinde normal olmayan dosya bulundu.`);
  ensureInside(stageRealRoot, fs.realpathSync(absolute), relative);
  return [relative];
});
const stagedFiles = walk(stageRoot).sort();
const forbiddenFiles = stagedFiles.filter((file) => forbidden.test(file));
if (forbiddenFiles.length) throw new Error(`Release içinde yasaklı dosya: ${forbiddenFiles.join(', ')}`);
const allowedStagedFile = (file) => {
  if (htmlAllowlist.includes(file) || rootAllowlist.includes(file) || file === 'sitemap.xml') return true;
  for (const [directory, extensions] of runtimePolicies) {
    if (file.startsWith(`${directory}/`) && extensions.has(path.extname(file).toLowerCase())) return true;
  }
  return false;
};
const unexpectedStagedFiles = stagedFiles.filter((file) => !allowedStagedFile(file));
if (unexpectedStagedFiles.length) throw new Error(`Release allowlist dışı dosya: ${unexpectedStagedFiles.join(', ')}`);
for (const file of [...htmlAllowlist, ...rootAllowlist]) {
  if (!stagedFiles.includes(file)) throw new Error(`Release dosyası eksik: ${file}`);
}
for (const file of htmlAllowlist.filter((name) => name !== 'index-3.html')) {
  const html = fs.readFileSync(path.join(stageRoot, file), 'utf8');
  if (/\b(?:href|action)=["'][^"']*\.html(?:[?#"'])/i.test(html)) {
    throw new Error(`${file}: public bağlantılarda .html uzantısı kaldı.`);
  }
  for (const route of routes.values()) {
    if (route !== '/' && html.includes(`href="${route}`)) continue;
  }
}

fs.rmSync(output, { force: true });
fs.mkdirSync(path.dirname(output), { recursive: true });
const zip = spawnSync('/usr/bin/zip', ['-X', '-y', '-q', '-r', output, '.'], { cwd: stageRoot, encoding: 'utf8' });
if (zip.status !== 0) throw new Error(zip.stderr || 'ZIP oluşturulamadı.');
const archiveList = spawnSync('/usr/bin/unzip', ['-Z1', output], { encoding: 'utf8' });
if (archiveList.status !== 0) throw new Error(archiveList.stderr || 'ZIP envanteri okunamadı.');
const members = archiveList.stdout.split(/\r?\n/).filter(Boolean);
if (!members.includes('index.html') || members.some((member) => member.startsWith('.stage/'))) {
  throw new Error('ZIP document-root seviyesinde oluşturulmadı.');
}
if (members.some((member) => forbidden.test(member))) throw new Error('ZIP içinde yasaklı dosya bulundu.');
const unsafeMember = members.find((member) => {
  const normalized = path.posix.normalize(member);
  if (member.startsWith('/') || normalized === '..' || normalized.startsWith('../')) return true;
  if (member.endsWith('/')) return false;
  return !allowedStagedFile(normalized);
});
if (unsafeMember) throw new Error(`ZIP allowlist dışı üye: ${unsafeMember}`);

const digest = crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex');
fs.rmSync(stageRoot, { recursive: true, force: true });
console.log(`RELEASE\t${output}`);
console.log(`FILES\t${members.length}`);
console.log(`SHA256\t${digest}`);
console.log(`SITE_URL\t${siteUrl || 'NOT_SET (root-relative canonical kullanıldı; sitemap üretilmedi)'}`);
