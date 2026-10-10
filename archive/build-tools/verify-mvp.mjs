import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const archiveUnused = process.argv.includes('--archive-unused');
const activeHtmlFiles = fs.readdirSync(root)
  .filter((name) => name.endsWith('.html'))
  .sort();
const fullPageFiles = activeHtmlFiles.filter((name) => name !== 'index-3.html');
const issues = [];
const notes = [];
const optionalFontFiles = new Set([
  'fa-duotone-900.woff2',
  'fa-duotone-900.ttf',
  'fa-thin-100.woff2',
  'fa-thin-100.ttf',
  'fa-v4compatibility.woff2',
  'fa-v4compatibility.ttf',
]);

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const countMatches = (source, expression) => (source.match(expression) || []).length;
const getAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'is'));
  return match ? match[2] : null;
};
const cleanReference = (value) => value
  .trim()
  .replace(/^['"]|['"]$/g, '')
  .split('#')[0]
  .split('?')[0];
const isExternalReference = (value) => /^(?:https?:|mailto:|data:|javascript:|#|\/\/)/i.test(value);
const resolveReference = (sourceRelativePath, rawValue) => {
  const value = cleanReference(rawValue);
  if (!value || isExternalReference(value) || value.startsWith('$')) return null;
  if (value.startsWith('/')) return path.join(root, value.slice(1));
  if (value.startsWith('assets/')) return path.join(root, value);
  return path.resolve(path.dirname(path.join(root, sourceRelativePath)), value);
};
const normalizeText = (value) => value.replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();

const htmlByFile = new Map(activeHtmlFiles.map((file) => [file, read(file)]));
const criticalImageByFile = new Map([
  ['index.html', 'assets/img/neolife/home/hero-helios-pool-volleyball.webp'],
  ['404.html', 'assets/img/neolife/placements/error-error-bg.webp'],
  ...fullPageFiles
    .filter((file) => !['index.html', '404.html'].includes(file))
    .map((file) => [file, file.startsWith('blog-') ? ({
      'blog-details.html': 'assets/img/neolife/editorial/kibris-yatirim.webp',
      'blog-insaat-kalitesi.html': 'assets/img/neolife/editorial/insaat-kalite.webp',
    }[file] || 'assets/img/neolife/editorial/girne-yasam.webp') : 'assets/img/neolife/placements/breadcrumb-breadcrumb-bg.webp']),
]);
const idsByFile = new Map();
const titles = new Map();
const descriptions = new Map();
const normalizedHeaders = new Map();
let svgPathCount = 0;

for (const file of fullPageFiles) {
  const html = htmlByFile.get(file);
  const idValues = [...html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gis)].map((match) => match[2]);
  const duplicateIds = [...new Set(idValues.filter((id, index) => idValues.indexOf(id) !== index))];
  idsByFile.set(file, new Set(idValues));

  if (!/<html\b[^>]*\blang=["']tr["']/i.test(html)) issues.push(`${file}: html lang="tr" eksik.`);
  if (countMatches(html, /<h1\b/gi) !== 1) issues.push(`${file}: tam olarak bir h1 başlığı yok.`);
  if (countMatches(html, /<main\b/gi) !== 1 || countMatches(html, /<\/main>/gi) !== 1) issues.push(`${file}: tek bir main bölgesi yok.`);
  if (!/<main\b[^>]*\bid=["']main-content["']/i.test(html)) issues.push(`${file}: main-content hedefi eksik.`);
  if (!/<a\b[^>]*class=["'][^"']*skip-link[^"']*["'][^>]*href=["']#main-content["']/i.test(html)) issues.push(`${file}: içerik atlama bağlantısı eksik.`);
  if (duplicateIds.length) issues.push(`${file}: yinelenen id değerleri: ${duplicateIds.join(', ')}.`);

  const header = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || '';
  if (!header) issues.push(`${file}: ortak header bulunamadı.`);
  else {
    if (!/<a\b[^>]*class=["'][^"']*\btp-flex-center\b[^"']*["'][^>]*href=["']contact\.html#iletisim-formu["'][^>]*aria-label=["']İletişim formu["']/i.test(header)) {
      issues.push(`${file}: header ikon iletişim bağlantısının erişilebilir adı eksik.`);
    }
    normalizedHeaders.set(file, header
      .replace(/\s+aria-current\s*=\s*(["'])page\1/gi, '')
      .replace(/\s+/g, ' ')
      .trim());
  }

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  const descriptionTag = (html.match(/<meta\b[^>]*>/gis) || [])
    .find((tag) => getAttribute(tag, 'name')?.toLowerCase() === 'description');
  const description = descriptionTag ? (getAttribute(descriptionTag, 'content') || '').trim() : '';
  if (!title) issues.push(`${file}: sayfa başlığı eksik.`);
  if (!description) issues.push(`${file}: meta açıklaması eksik.`);
  titles.set(file, title);
  descriptions.set(file, description);

  const criticalImage = criticalImageByFile.get(file);
  const preloadPattern = criticalImage
    ? new RegExp(`<link\\b[^>]*\\brel=["']preload["'][^>]*\\bas=["']image["'][^>]*\\bhref=["']${criticalImage.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}["']`, 'i')
    : null;
  if (criticalImage && !preloadPattern.test(html)) issues.push(`${file}: kritik ilk görsel için preload eksik.`);

  for (const imageTag of html.match(/<img\b[^>]*>/gis) || []) {
    if (getAttribute(imageTag, 'alt') === null) issues.push(`${file}: alt niteliği olmayan görsel var.`);
    if (!getAttribute(imageTag, 'width') || !getAttribute(imageTag, 'height')) issues.push(`${file}: boyutları belirtilmeyen görsel var.`);
  }

  for (const pathTag of html.match(/<path\b[^>]*>/gis) || []) {
    const pathData = getAttribute(pathTag, 'd');
    if (!pathData) continue;
    svgPathCount += 1;
    const nonCommandLetters = pathData.replace(/[MmZzLlHhVvCcSsQqTtAaEe]/g, '').match(/[A-Za-z\u00c0-\u024f\u1e00-\u1eff]/g);
    if (nonCommandLetters) issues.push(`${file}: SVG path verisinde geçersiz metin bulundu.`);
  }

  for (const buttonMatch of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const buttonTag = `<button ${buttonMatch[1]}>`;
    const buttonText = normalizeText(buttonMatch[2].replace(/<svg\b[\s\S]*?<\/svg>/gi, ' '));
    if (!getAttribute(buttonTag, 'aria-label') && !getAttribute(buttonTag, 'title') && !buttonText) issues.push(`${file}: erişilebilir adı olmayan düğme var.`);
  }

  for (const linkMatch of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const linkTag = `<a ${linkMatch[1]}>`;
    if (getAttribute(linkTag, 'aria-hidden') === 'true') continue;
    const linkBody = linkMatch[2];
    const linkText = normalizeText(linkBody.replace(/<svg\b[\s\S]*?<\/svg>/gi, ' '));
    const namedImage = (linkBody.match(/<img\b[^>]*>/gis) || []).some((imageTag) => Boolean((getAttribute(imageTag, 'alt') || '').trim()));
    if (!getAttribute(linkTag, 'aria-label') && !getAttribute(linkTag, 'aria-labelledby') && !getAttribute(linkTag, 'title') && !linkText && !namedImage) {
      issues.push(`${file}: erişilebilir adı olmayan bağlantı var.`);
    }
  }

  for (const animatedTag of html.match(/<(?:h[1-6]|p)\b[^>]*class=["'][^"']*\b(?:tp-char-animation|text-line-anim)\b[^"']*["'][^>]*>/gi) || []) {
    if (!getAttribute(animatedTag, 'aria-label')) issues.push(`${file}: harf animasyonlu metnin doğal erişilebilir adı eksik.`);
  }
  for (const revealBlock of html.matchAll(/<div\b[^>]*class=["'][^"']*\breval-line\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi)) {
    for (const semanticTag of revealBlock[1].match(/<(?:h[1-6]|p)\b[^>]*>/gi) || []) {
      if (!getAttribute(semanticTag, 'aria-label')) issues.push(`${file}: parçalanan metin animasyonunun doğal erişilebilir adı eksik.`);
    }
  }

  const labelTargets = new Set([...html.matchAll(/<label\b[^>]*for=(["'])(.*?)\1/gi)].map((match) => match[2]));
  for (const controlTag of html.match(/<(?:input|textarea|select)\b[^>]*>/gi) || []) {
    if ((getAttribute(controlTag, 'type') || '').toLowerCase() === 'hidden') continue;
    const id = getAttribute(controlTag, 'id');
    if (!getAttribute(controlTag, 'aria-label') && !getAttribute(controlTag, 'aria-labelledby') && !(id && labelTargets.has(id))) {
      issues.push(`${file}: erişilebilir adı olmayan form alanı var.`);
    }
    if (!getAttribute(controlTag, 'name')) issues.push(`${file}: name niteliği olmayan form alanı var.`);
  }

  if (/href\s*=\s*["']#["']/i.test(html)) issues.push(`${file}: boş bağlantı hedefi var.`);
  if (/action\s*=\s*["']#["']/i.test(html)) issues.push(`${file}: boş form hedefi var.`);
  if (/class\s*=\s*["'][^"']*\bcollapsed\b[^"']*["'][^>]*aria-expanded\s*=\s*["']true["']/i.test(html)) {
    issues.push(`${file}: kapalı akordeon düğmesi aria-expanded="true" olarak işaretlenmiş.`);
  }
  if (/\btel:/i.test(html)) issues.push(`${file}: doğrulanmamış telefon bağlantısı var.`);
  if (/\+99\s|ThemePure|David Hussy|Lorem ipsum|placeholder\.com/i.test(html)) issues.push(`${file}: şablon veya doğrulanmamış içerik kalmış.`);
  if (html.includes('data-neolife-mail-form')) issues.push(`${file}: eski e-posta formu işareti kaldı.`);
  if (html.includes('data-neolife-whatsapp-form') && !html.includes('data-form-response')) issues.push(`${file}: WhatsApp form durum mesajı alanı eksik.`);
  if (html.includes('data-neolife-whatsapp-form') && /<form\b[^>]*\bnovalidate\b/i.test(html)) issues.push(`${file}: WhatsApp formunda yerel doğrulama devre dışı.`);
  if (html.includes('data-neolife-whatsapp-form') && !/action=["']https:\/\/wa\.me\/905338472879["']/i.test(html)) issues.push(`${file}: WhatsApp form hedefi şirket numarasıyla eşleşmiyor.`);
}

if (new Set(normalizedHeaders.values()).size !== 1) {
  issues.push(`Tam sayfalarda ortak header yapısı tutarlı değil: ${[...normalizedHeaders.keys()].join(', ')}.`);
}

for (const [file, title] of titles) {
  if (!title) continue;
  const matches = [...titles.entries()].filter(([, candidate]) => candidate === title).map(([name]) => name);
  if (matches.length > 1 && matches[0] === file) issues.push(`Aynı sayfa başlığı kullanılıyor: ${matches.join(', ')}.`);
}

for (const [file, description] of descriptions) {
  if (!description) continue;
  const matches = [...descriptions.entries()].filter(([, candidate]) => candidate === description).map(([name]) => name);
  if (matches.length > 1 && matches[0] === file) issues.push(`Aynı meta açıklaması kullanılıyor: ${matches.join(', ')}.`);
}

for (const file of activeHtmlFiles) {
  const html = htmlByFile.get(file);
  for (const anchorTag of html.match(/<a\b[^>]*>/gis) || []) {
    const href = getAttribute(anchorTag, 'href');
    if (!href || isExternalReference(href)) continue;
    const [rawPath, rawHash = ''] = href.split('#');
    const targetFile = rawPath ? cleanReference(rawPath) : file;
    const targetPath = path.join(root, targetFile);
    if (rawPath && !fs.existsSync(targetPath)) {
      issues.push(`${file}: bulunamayan sayfa bağlantısı: ${href}.`);
      continue;
    }
    if (rawHash && targetFile.endsWith('.html')) {
      const targetHtml = htmlByFile.get(targetFile) || (fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '');
      const targetIds = new Set([...targetHtml.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gis)].map((match) => match[2]));
      if (!targetIds.has(decodeURIComponent(rawHash))) issues.push(`${file}: bulunamayan bölüm hedefi: ${href}.`);
    }
  }
}

const reachablePages = new Set(['index.html']);
const pendingPages = ['index.html'];
while (pendingPages.length) {
  const sourceFile = pendingPages.shift();
  const html = htmlByFile.get(sourceFile) || '';
  for (const anchorTag of html.match(/<a\b[^>]*>/gis) || []) {
    const href = getAttribute(anchorTag, 'href');
    if (!href || isExternalReference(href)) continue;
    const targetFile = cleanReference(href) || sourceFile;
    if (!fullPageFiles.includes(targetFile) || reachablePages.has(targetFile)) continue;
    reachablePages.add(targetFile);
    pendingPages.push(targetFile);
  }
}
const unreachablePages = fullPageFiles.filter((file) => file !== '404.html' && !reachablePages.has(file));
if (unreachablePages.length) issues.push(`Anasayfadan ulaşılamayan aktif sayfalar: ${unreachablePages.join(', ')}.`);

const referenceSources = [
  ...activeHtmlFiles,
  ...['assets/css', 'assets/js', 'assets/scss'].flatMap((directory) => {
    const base = path.join(root, directory);
    const result = [];
    const walk = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const absolute = path.join(current, entry.name);
        if (entry.isDirectory()) walk(absolute);
        else if (!entry.name.endsWith('.map')) result.push(path.relative(root, absolute));
      }
    };
    walk(base);
    return result;
  }),
];
const referencedAssets = new Set();

for (const sourceFile of referenceSources) {
  const source = read(sourceFile);
  const rawReferences = [];

  if (/\.html$/i.test(sourceFile)) {
    for (const match of source.matchAll(/\b(?:src|href|poster|data-background)\s*=\s*(["'])(.*?)\1/gis)) rawReferences.push(match[2]);
    for (const match of source.matchAll(/\bsrcset\s*=\s*(["'])(.*?)\1/gis)) {
      for (const candidate of match[2].split(',')) rawReferences.push(candidate.trim().split(/\s+/)[0]);
    }
  }
  if (/\.(?:css|scss)$/i.test(sourceFile)) {
    for (const match of source.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gis)) rawReferences.push(match[2]);
  }
  for (const match of source.matchAll(/(["'])(assets\/[A-Za-z0-9_./ -]+\.[A-Za-z0-9]+)\1/g)) rawReferences.push(match[2]);

  for (const rawReference of rawReferences) {
    const absolute = resolveReference(sourceFile, rawReference);
    if (!absolute) continue;
    if (!fs.existsSync(absolute) && !optionalFontFiles.has(path.basename(absolute))) issues.push(`${sourceFile}: bulunamayan yerel dosya: ${rawReference}.`);
    if (absolute.startsWith(path.join(root, 'assets') + path.sep)) referencedAssets.add(path.normalize(absolute));
  }
}

const projectHtml = htmlByFile.get('project-grid.html');
const homeHtml = htmlByFile.get('index.html') || '';
const aboutHtml = htmlByFile.get('about.html') || '';
const servicesHtml = htmlByFile.get('services-grid.html') || '';
const aboutVideoPath = 'assets/video/neolife-construction-timelapse.mp4';
const aboutVideoPosterPath = 'assets/img/neolife/video/construction-timelapse-poster.jpg';
for (const [file, html] of [['index.html', homeHtml], ['about.html', aboutHtml]]) {
  if (countMatches(html, /<video\b[^>]*class=["'][^"']*\bneolife-about-video\b[^"']*["']/g) !== 1) issues.push(`${file}: Hakkımızda alanında tek kurumsal video bulunmalı.`);
  if (!html.includes(`src="${aboutVideoPath}"`)) issues.push(`${file}: Hakkımızda videosu eksik.`);
  if (!html.includes(`poster="${aboutVideoPosterPath}"`)) issues.push(`${file}: Hakkımızda video posteri eksik.`);
  if (!/<video\b[^>]*\bmuted\b[^>]*\bloop\b[^>]*\bplaysinline\b/i.test(html)) issues.push(`${file}: Hakkımızda videosunun sessiz, döngülü ve mobil uyumlu nitelikleri eksik.`);
}
for (const removedImage of [
  'assets/img/neolife/home/about-panaroma.webp',
  'assets/img/neolife/home/about-helios.webp',
  'assets/img/neolife/placements/about-about-thumb-2.webp',
  'assets/img/neolife/placements/about-about-parson.webp'
]) {
  if (homeHtml.includes(removedImage) || aboutHtml.includes(removedImage)) issues.push(`Hakkımızda alanında kaldırılan iki fotoğraflı düzen geri gelmiş: ${removedImage}.`);
}
const aboutVideoAbsolutePath = path.join(root, aboutVideoPath);
if (!fs.existsSync(aboutVideoAbsolutePath)) issues.push('Optimize Hakkımızda videosu bulunamadı.');
else if (fs.statSync(aboutVideoAbsolutePath).size > 4 * 1024 * 1024) issues.push('Optimize Hakkımızda videosu 4 MB sınırını aşıyor.');
notes.push('Anasayfa ve Hakkımızda sayfasındaki iki fotoğraflı alanlar, optimize ve hareket tercihine duyarlı tek kurumsal videoya geçirildi.');
const expectedHomeServicePhotos = [
  'assets/img/neolife/services/photos/project-development.webp',
  'assets/img/neolife/services/photos/architecture-design.webp',
  'assets/img/neolife/services/photos/process-management.webp',
];
const expectedServiceGridPhotos = [
  'assets/img/neolife/services/photos/project-development.webp',
  'assets/img/neolife/services/photos/sales-consultancy.webp',
  'assets/img/neolife/services/photos/finance-options.webp',
  'assets/img/neolife/services/photos/architecture-design.webp',
  'assets/img/neolife/services/photos/subcontracting-renovation.webp',
];
for (const source of expectedHomeServicePhotos) {
  if (!homeHtml.includes(`src="${source}"`)) issues.push(`Anasayfa hizmet fotoğrafı eksik: ${source}.`);
}
for (const source of expectedServiceGridPhotos) {
  if (!servicesHtml.includes(`src="${source}"`)) issues.push(`Hizmetler sayfası stok fotoğrafı eksik: ${source}.`);
}
if (/assets\/img\/neolife\/services\/(?:project-development|architecture-design|process-management)\.svg/.test(homeHtml)) {
  issues.push('Anasayfa hizmet kartlarında kaldırılan çizim görselleri yeniden kullanılmış.');
}
if (/assets\/img\/neolife\/placements\/services-services-2-img-[1-5]\.webp/.test(servicesHtml)) {
  issues.push('Hizmetler sayfasında kaldırılan proje görselleri yeniden kullanılmış.');
}
notes.push('Anasayfadaki 3 hizmet kartı ve Hizmetler sayfasındaki 5 kart stok fotoğraf setini kullanıyor; proje renderı ve çizim görselleri aktif değil.');
if (!/<span\b[^>]*class=["'][^"']*\bodometer\b[^"']*["'][^>]*data-count=["']5["'][^>]*><\/span>[\s\S]{0,500}?Devam eden proje/i.test(homeHtml)) {
  issues.push('Anasayfadaki Devam eden proje sayacı 5 olmalı.');
}
const projectCardCount = countMatches(projectHtml, /\bdata-project-card\b/g);
const clickableProjectCount = countMatches(projectHtml, /aria-label=["'](?:Panorama|Helios) projesini incele["']/g);
if (projectCardCount !== 3) issues.push(`Proje sayfasında ${projectCardCount} kart var; 3 olmalı.`);
if (clickableProjectCount !== 2) issues.push(`Proje sayfasında ${clickableProjectCount} tıklanabilir proje var; 2 olmalı.`);
for (const status of ['tamamlandi', 'insaatta', 'satista', 'tukendi']) {
  if (!projectHtml.includes(`value="${status}"`)) issues.push(`Proje filtresinde ${status} durumu eksik.`);
}

const projectDetailFiles = ['project-details.html', 'project-helios.html'];
for (const file of projectDetailFiles) {
  const html = htmlByFile.get(file);
  const sliderCount = countMatches(html, /class=["'][^"']*\btp-project-gallery-active\b[^"']*["']/g);
  const controlCount = countMatches(html, /class=["'][^"']*\btp-project-gallery-controls\b[^"']*["']/g);
  const previousButtonCount = countMatches(html, /class=["'][^"']*\btp-project-gallery-prev\b[^"']*["']/g);
  const nextButtonCount = countMatches(html, /class=["'][^"']*\btp-project-gallery-next\b[^"']*["']/g);
  const paginationCount = countMatches(html, /class=["'][^"']*\btp-project-gallery-pagination\b[^"']*["']/g);
  if (sliderCount !== 4) issues.push(`${file}: dört kategori galerisi bulunmalı; bulunan ${sliderCount}.`);
  if (controlCount !== sliderCount || previousButtonCount !== sliderCount || nextButtonCount !== sliderCount || paginationCount !== sliderCount) {
    issues.push(`${file}: her proje galerisi için ileri, geri ve sayfalama kontrolleri eksiksiz değil.`);
  }
}

const heliosHtml = htmlByFile.get('project-helios.html') || '';
const heliosGallery = heliosHtml.match(/<section\b[^>]*class=["'][^"']*\btp-project-gallery-area\b[^"']*["'][^>]*>[\s\S]*?<!-- project-gallery-area,end/i)?.[0] || '';
const heliosGallerySources = [...heliosGallery.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((match) => match[1]);
const duplicateHeliosImages = [...new Set(heliosGallerySources.filter((source, index) => heliosGallerySources.indexOf(source) !== index))];
if (duplicateHeliosImages.length) issues.push(`Helios galerisinde yinelenen görseller var: ${duplicateHeliosImages.join(', ')}.`);
for (const label of ['İç mekân', 'Ortak alanlar', 'Villalar', 'Apartmanlar']) {
  if (!heliosGallery.includes(`>${label}</button>`)) issues.push(`Helios galeri kategorisi eksik: ${label}.`);
}
const expectedHeliosGalleryCounts = new Map([
  ['/interior-', 5],
  ['/common/', 6],
  ['/villa/', 5],
  ['/apartment/', 9],
]);
for (const [pathSignal, expectedCount] of expectedHeliosGalleryCounts) {
  const actualCount = heliosGallerySources.filter((source) => source.includes(pathSignal)).length;
  if (actualCount !== expectedCount) issues.push(`Helios galerisinde ${pathSignal} grubu ${expectedCount} görsel içermeli; bulunan ${actualCount}.`);
}
notes.push(`${heliosGallerySources.length} benzersiz Helios galeri görseli; iç mekân, ortak alan, villa ve apartman kategorileri.`);

const editorialFiles = ['blog-girnede-yasam.html', 'blog-insaat-kalitesi.html', 'blog-details.html', 'blog-kibris-konut-rehberi.html'];
const blogListing = htmlByFile.get('blog-standard.html') || '';
if (countMatches(blogListing, /\bdata-blog-post\b/g) !== editorialFiles.length) issues.push('Blog listesi dört bağımsız editoryal yazı içermeli.');
for (const file of editorialFiles) {
  const html = htmlByFile.get(file) || '';
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';
  if (!main || !html.includes('neolife-editorial.css')) issues.push(`${file}: editoryal içerik veya stil eksik.`);
  if (!blogListing.includes(`href="${file}"`)) issues.push(`${file}: blog listesinden bağlantı eksik.`);
  if (!main.includes('temsili editoryal görsel')) issues.push(`${file}: temsili görsel açıklaması eksik.`);
  for (const image of main.match(/<img\b[^>]*>/gis) || []) {
    const src = getAttribute(image, 'src') || '';
    if (!src.includes('/editorial/') && !src.includes('/logo')) issues.push(`${file}: blog içinde editoryal olmayan görsel: ${src}.`);
  }
}
for (const file of ['index.html', 'about.html']) {
  if (/id=["']uzmanliklar["']|Uzmanlık alanlarımız/.test(htmlByFile.get(file) || '')) issues.push(`${file}: kaldırılan uzmanlık bölümü geri gelmiş.`);
}
notes.push(`${editorialFiles.length} bağımsız blog yazısı, temsili görsel açıklamaları ve uzmanlık bölümü kaldırılması doğrulandı.`);

const mainCss = read('assets/css/main.css');
for (const expectedRule of ['max-width: 1199.98px', 'max-width: 767.98px', 'max-width: 389.98px', 'prefers-reduced-motion: reduce']) {
  if (!mainCss.includes(expectedRule)) issues.push(`Responsive CSS kuralı eksik: ${expectedRule}.`);
}
for (const color of ['#F4F0EA', '#D8CBB8', '#80624A', '#404038']) {
  if (!mainCss.toUpperCase().includes(color)) issues.push(`Marka rengi derlenmiş CSS içinde yok: ${color}.`);
}
if (!mainCss.includes('body:not(.neolife-home) > header')) issues.push('İç ve detay sayfalarının header katman kuralı eksik.');
for (const expectedRule of [
  '/* NeoLife monochrome header */',
  '/* Keep the shared header stable before JavaScript-applied image sizing runs. */',
  '.tp-header-menu a[aria-current=page]::before',
  '.tp-header-spacing-2.media.header-sticky',
  'right: 12px',
  'left: 12px',
  '/* NeoLife inner-page solid white header */',
  'body > header,',
  'background: #fff',
  'border-bottom-color: rgba(0, 0, 0, 0.14)'
]) {
  if (!mainCss.includes(expectedRule)) issues.push(`Siyah-beyaz header kuralı eksik: ${expectedRule}.`);
}
for (const file of fullPageFiles) {
  const html = htmlByFile.get(file) || '';
  if (!html.includes('assets/css/main.css?v=20261005-performance')) {
    issues.push(`${file}: ortak stil sürümü güncel değil.`);
  }
  if (!html.includes('assets/js/ajex-form.js?v=20261005-whatsapp')) {
    issues.push(`${file}: ortak form etkileşimi sürümü güncel değil.`);
  }
  if (!html.includes('assets/js/main.js?v=20260928-about-video')) {
    issues.push(`${file}: ortak etkileşim sürümü güncel değil.`);
  }
}
if (/\.tp-header-menu-grey\s*\{[^}]*var\(--tp-gray-color\)/s.test(mainCss)) issues.push('Header menü kapsülünde eski gri/kahve tonu kaldı.');
if (/\.tp-header-menu a\[aria-current=page\]\s*\{[^}]*var\(--neolife-brand-deep\)/s.test(mainCss)) issues.push('Aktif header bağlantısında kahve marka tonu kaldı.');
notes.push('Masaüstü, sticky, iç sayfa ve mobil menü header renkleri siyah-beyaz sistemine sabitlendi.');

const mainJs = read('assets/js/main.js');
const interactionJs = read('assets/js/ajex-form.js');
if (!mainJs.includes("matchMedia('(prefers-reduced-motion: reduce)')")) issues.push('JavaScript hareket azaltma tercihini algılamıyor.');
for (const expectedSignal of ["document.querySelectorAll('.neolife-about-video')", "'IntersectionObserver' in window", 'video.pause()', 'video.play()']) {
  if (!mainJs.includes(expectedSignal)) issues.push(`Hakkımızda video davranışı eksik: ${expectedSignal}.`);
}
if (/autoplay\s*:\s*\{/i.test(mainJs)) issues.push('Hareket azaltma tercihinden bağımsız otomatik slider bulundu.');
for (const expectedSignal of ['toggleAttribute("inert", !isOpen)', 'aria-modal', 'is-mobile-menu-open']) {
  if (!interactionJs.includes(expectedSignal)) issues.push(`Mobil menü erişilebilirlik davranışı eksik: ${expectedSignal}.`);
}
for (const expectedSignal of ['DEFAULT_WHATSAPP_NUMBER = "905338472879"', 'function buildWhatsAppUrl', 'https://wa.me/', 'form.classList.contains("is-submitting")', 'window.location.assign(whatsappUrl)']) {
  if (!interactionJs.includes(expectedSignal)) issues.push(`WhatsApp form davranışı eksik: ${expectedSignal}.`);
}
if (interactionJs.includes('buildMailto') || interactionJs.includes('mailto:')) issues.push('Eski e-posta form yönlendirmesi JavaScript içinde kaldı.');

const robots = fs.existsSync(path.join(root, 'robots.txt')) ? read('robots.txt') : '';
if (!/^User-agent:\s*\*/im.test(robots) || !/^Allow:\s*\/$/im.test(robots)) {
  issues.push('robots.txt temel tarama iznini tanımlamıyor.');
}
if (/Disallow:\s*\/(?:archive|\.idea)\//i.test(robots)) {
  issues.push('robots.txt erişim kontrolü yerine kullanılmamalı; dahili dosyalar release paketinden çıkarılmalı.');
}

const htaccess = fs.existsSync(path.join(root, '.htaccess')) ? read('.htaccess') : '';
for (const expectedSignal of [
  '<If "%{REQUEST_URI} =~ m#^/(?:archive|\\.idea|release|__MACOSX)',
  '<FilesMatch "(?i:^(?:design-qa\\.md|Arşiv\\.zip|\\.DS_Store)',
  'Require all denied',
  '<IfModule mod_rewrite.c>',
  'RewriteCond %{REQUEST_FILENAME} !-d',
  'RewriteRule ^(.+)/$ /$1 [R=301,L,NE]',
]) {
  if (!htaccess.includes(expectedSignal)) issues.push(`Apache yayın koruması eksik: ${expectedSignal}.`);
}
const authorizationIndex = htaccess.indexOf('Require all denied');
const rewriteIndex = htaccess.indexOf('<IfModule mod_rewrite.c>');
if (authorizationIndex < 0 || rewriteIndex < 0 || authorizationIndex > rewriteIndex) {
  issues.push('Hassas dosya yetkilendirmesi mod_rewrite bloğundan bağımsız ve önce olmalı.');
}

const releaseBuilder = fs.existsSync(path.join(root, 'archive/build-tools/build-release.mjs'))
  ? read('archive/build-tools/build-release.mjs')
  : '';
for (const expectedSignal of [
  'const runtimePolicies = new Map',
  'fs.lstatSync',
  'stats.isSymbolicLink()',
  'fs.realpathSync',
  "['-X', '-y', '-q', '-r'",
  'unexpectedStagedFiles',
  'unsafeMember',
]) {
  if (!releaseBuilder.includes(expectedSignal)) issues.push(`Release güvenlik kapısı eksik: ${expectedSignal}.`);
}

const runtimeExtensionPolicies = new Map([
  ['assets/css', new Set(['.css'])],
  ['assets/fonts', new Set(['.ttf', '.woff2'])],
  ['assets/img', new Set(['.jpg', '.jpeg', '.png', '.webp'])],
  ['assets/js', new Set(['.js'])],
  ['assets/video', new Set(['.mp4'])],
]);
for (const [relativeDirectory, extensions] of runtimeExtensionPolicies) {
  const base = path.join(root, relativeDirectory);
  const inspect = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === '.DS_Store') continue;
      const absolute = path.join(current, entry.name);
      const relative = path.relative(root, absolute);
      const stats = fs.lstatSync(absolute);
      if (stats.isSymbolicLink()) {
        issues.push(`${relative}: runtime ağacında sembolik bağ bulundu.`);
        continue;
      }
      if (entry.name.startsWith('.')) issues.push(`${relative}: runtime ağacında gizli girdi bulundu.`);
      if (stats.isDirectory()) inspect(absolute);
      else if (!stats.isFile() || !extensions.has(path.extname(entry.name).toLowerCase())) {
        issues.push(`${relative}: runtime allowlist dışı dosya türü.`);
      }
    }
  };
  inspect(base);
}
notes.push('Release paketleyici sembolik bağ, gerçek yol, gizli dosya ve dizin bazlı uzantı allowlist kontrolleriyle doğrulandı.');

const unusedCandidates = [];
for (const candidateDirectory of ['assets/img', 'assets/js']) {
  const base = path.join(root, candidateDirectory);
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === '.DS_Store') continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (!referencedAssets.has(path.normalize(absolute))) unusedCandidates.push(path.relative(root, absolute));
    }
  };
  walk(base);
}

let archivedCount = 0;
if (archiveUnused) {
  for (const relativePath of unusedCandidates) {
    const sourcePath = path.join(root, relativePath);
    const destinationPath = path.join(root, 'archive', 'unused-assets', relativePath);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    if (fs.existsSync(destinationPath)) {
      issues.push(`Arşiv hedefi zaten var: ${path.relative(root, destinationPath)}.`);
      continue;
    }
    fs.renameSync(sourcePath, destinationPath);
    archivedCount += 1;
  }
}

const visibleEnglishSignals = [];
const englishExpression = /\b(?:Read More|Submit|Search|Contact Us|Business|Our Services|Our Projects|Team Members|Blog Details)\b/i;
for (const file of fullPageFiles) {
  const visibleText = normalizeText(htmlByFile.get(file)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' '));
  if (englishExpression.test(visibleText)) visibleEnglishSignals.push(file);
}
if (visibleEnglishSignals.length) issues.push(`Görünür İngilizce şablon sinyali: ${visibleEnglishSignals.join(', ')}.`);

notes.push(`${activeHtmlFiles.length} kök HTML dosyası (${fullPageFiles.length} tam sayfa + 1 uyumluluk yönlendirmesi).`);
notes.push(`${normalizedHeaders.size} tam sayfada tek ortak header yapısı.`);
notes.push(`${svgPathCount} SVG path verisi metin bozulmasına karşı doğrulandı.`);
notes.push(`${reachablePages.size} aktif sayfaya anasayfa bağlantı grafiğinden ulaşılıyor; 404 sayfası bilinçli olarak hariç.`);
notes.push(`${projectCardCount} proje kartı; ${clickableProjectCount} tıklanabilir proje ve 1 Yakında kartı.`);
notes.push(`${projectDetailFiles.length} proje detay sayfasında kontrollü ve responsive görsel sliderı.`);
notes.push('Hareket azaltma tercihi, mobil menü odak izolasyonu ve animasyonlu metinlerin doğal adları kaynak seviyesinde korunuyor.');
notes.push(`${referencedAssets.size} yerel varlık doğrudan kaynaklarda kullanılıyor.`);
notes.push(`${unusedCandidates.length} kullanılmayan görsel/JavaScript adayı bulundu.`);
if (archiveUnused) notes.push(`${archivedCount} kullanılmayan varlık archive/unused-assets altına taşındı.`);

console.log('NEOLIFE_MVP_VERIFICATION');
for (const note of notes) console.log(`OK\t${note}`);
for (const issue of [...new Set(issues)]) console.log(`ISSUE\t${issue}`);
for (const candidate of unusedCandidates.sort()) console.log(`UNUSED\t${candidate}`);
console.log(`RESULT\t${issues.length ? 'FAIL' : 'PASS'}\t${[...new Set(issues)].length} issue`);
process.exitCode = issues.length ? 1 : 0;
