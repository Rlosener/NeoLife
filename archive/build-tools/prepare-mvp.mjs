import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("/Users/rlosener/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.cjs");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const metadata = {
  "index.html": {
    title: "NeoLife | Yaşam ve Gayrimenkul Projeleri",
    description: "NeoLife'ın Nova ve Helios projelerini, hizmetlerini ve yeni yaşam alanı yaklaşımını keşfedin."
  },
  "about.html": {
    title: "Hakkımızda | NeoLife",
    description: "NeoLife'ın proje geliştirme, mimari, inşaat yönetimi ve müşteri deneyimi yaklaşımını inceleyin."
  },
  "services-grid.html": {
    title: "Hizmetlerimiz | NeoLife",
    description: "NeoLife'ın proje geliştirme, mimari tasarım, inşaat yönetimi, satış ve yatırım danışmanlığı hizmetleri."
  },
  "services-details.html": {
    title: "Hizmet Yaklaşımımız | NeoLife",
    description: "NeoLife projelerinde planlamadan teslim sürecine kadar sunduğumuz entegre hizmet yaklaşımını keşfedin."
  },
  "project-grid.html": {
    title: "Projelerimiz | NeoLife",
    description: "Nova ve Helios projelerini konum ve proje durumuna göre filtreleyin; yakında duyurulacak NeoLife projesini takip edin."
  },
  "project-details.html": {
    title: "Nova Projesi | NeoLife",
    description: "Tamamlanan Nova projesinin yaşam yaklaşımını, proje durumunu ve görsel galerisini inceleyin."
  },
  "project-helios.html": {
    title: "Helios Projesi | NeoLife",
    description: "İnşaatı ve satış süreci devam eden Helios projesinin yaklaşımını ve görsel galerisini inceleyin."
  },
  "blog-standard.html": {
    title: "Blog | NeoLife",
    description: "Gayrimenkul proje seçimi, yaşam alanı tasarımı ve NeoLife projeleri hakkında güncel içerikler."
  },
  "blog-details.html": {
    title: "Gayrimenkul Projesi Değerlendirme Rehberi | NeoLife",
    description: "Bir gayrimenkul projesini değerlendirirken konum, planlama, süreç, kullanım ve satış koşullarında dikkat edilmesi gerekenler."
  },
  "contact.html": {
    title: "İletişim | NeoLife",
    description: "Nova, Helios ve NeoLife hizmetleri hakkında bilgi almak için proje ve satış ekibimize ulaşın."
  },
  "faq.html": {
    title: "Sıkça Sorulan Sorular | NeoLife",
    description: "NeoLife projeleri, satış süreci, proje bilgileri ve iletişim hakkında sık sorulan soruların yanıtları."
  },
  "404.html": {
    title: "Sayfa Bulunamadı | NeoLife",
    description: "Aradığınız NeoLife sayfası bulunamadı. Ana sayfaya veya projeler sayfasına dönebilirsiniz.",
    robots: "noindex, follow"
  }
};

const faqAnswers = [
  "İhtiyacınızı ve önceliklerinizi belirledikten sonra projeler sayfasından güncel seçenekleri inceleyebilir, ayrıntılı bilgi için iletişim formunu kullanabilirsiniz.",
  "Proje geliştirme, mimari tasarım, inşaat yönetimi, satış ve pazarlama ile yatırım danışmanlığını proje ihtiyacına göre bütüncül biçimde ele alıyoruz.",
  "Proje ve satış sürecine ilişkin mevcut dokümanları şeffaf biçimde paylaşırız. Hukuki veya mali uzmanlık gerektiren konularda bağımsız uzman görüşü alınmasını öneririz.",
  "Her proje; konum, kullanım amacı, bütçe, teslim durumu ve kişisel risk tercihleriyle birlikte değerlendirilmelidir. Tek bir proje herkes için aynı sonucu vermez.",
  "Tapu ve mülkiyet kayıtları, imar durumu, ruhsatlar, sözleşme şartları ve ödeme planı bağımsız hukuk ve teknik uzmanlarıyla doğrulanmalıdır.",
  "Evet. Proje geliştirme, mimari koordinasyon ve inşaat yönetimi hizmetleri sunuyoruz; kapsam, projenin ihtiyaçlarına göre netleştirilir."
];

const footerLinks = new Map([
  ["Hakkımızda", "about.html"],
  ["Ekibimiz", "about.html#uzmanliklar"],
  ["Çözümler", "services-grid.html"],
  ["Neden bizi seçmelisiniz?", "index.html#neden-neolife"],
  ["İş ortakları", "contact.html#iletisim-formu"],
  ["Temel Değerler", "about.html#degerler"],
  ["Gayrimenkul Geliştirme", "services-details.html"],
  ["Satış ve pazarlama", "services-details.html"],
  ["Satış & Pazarlama", "services-details.html"],
  ["Mimari ve tasarım", "services-details.html"],
  ["İnşaat Yönetimi", "services-details.html"],
  ["Yatırım ve sermaye", "services-details.html"],
  ["Proje Yönetimi", "services-details.html"],
  ["Müşteri yorumları", "about.html#yaklasim"],
  ["Sıkça Sorulan Sorular", "faq.html"],
  ["Blog", "blog-standard.html"],
  ["Kariyer", "contact.html?konu=kariyer#iletisim-formu"],
  ["Bize ulaşın", "contact.html#iletisim-formu"]
]);

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function write(file, contents) {
  fs.writeFileSync(path.join(root, file), contents);
}

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Beklenen içerik bulunamadı (${label ?? search.slice(0, 60)})`);
  }
  return source.replace(search, replacement);
}

function replaceSequential(source, search, replacements) {
  let index = 0;
  const output = source.replace(search, () => replacements[index++] ?? replacements.at(-1));
  if (index < replacements.length) {
    throw new Error(`Beklenen ${replacements.length} eşleşmenin yalnızca ${index} tanesi bulundu.`);
  }
  return output;
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function applyFaqAnswers(html) {
  const boilerplate = /<p class="margin-0">Dünya çapında yenilikçi gayrimenkul çözümleri sunan özel bir şirketiz\. Ekibimiz gayrimenkul yatırımı ve mülk yönetimi alanlarında uzmandır\.<\/p>/g;
  let answerIndex = 0;
  return html.replace(boilerplate, () => `<p class="margin-0">${faqAnswers[answerIndex++ % faqAnswers.length]}</p>`);
}

function normalizeDeadLinks(html) {
  return html.replace(/<a\b([^>]*?)href="#"([^>]*)>([\s\S]*?)<\/a>/g, (full, before, after, inner) => {
    const text = stripTags(inner);
    let href = footerLinks.get(text);

    if (text === "OFİS E-POSTASI" || text === "E-POSTA GÖNDER" || text === "NeoLife@") {
      href = "mailto:info@neolife.com";
    } else if (text === "Yanıtla") {
      href = "#blog-feedback";
    }

    if (href) {
      return `<a${before}href="${href}"${after}>${inner}</a>`;
    }

    const label = text || "Sosyal medya bağlantısı yakında";
    return `<a${before}${after} aria-disabled="true" tabindex="-1" aria-label="${label.replace(/"/g, "&quot;")}">${inner}</a>`;
  });
}

function normalizeMetadata(html, file) {
  const meta = metadata[file];
  html = html.replace(/\s*<meta name="description"[^>]*>/g, "");
  html = html.replace(/\s*<meta name="robots"[^>]*>/g, "");
  html = html.replace(/\s*<meta property="og:[^"]+"[^>]*>/g, "");
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${meta.title}</title>\n    <meta name="description" content="${meta.description}">\n    <meta name="robots" content="${meta.robots ?? "index, follow"}">\n    <meta name="theme-color" content="#F4F0EA">\n    <meta property="og:locale" content="tr_TR">\n    <meta property="og:type" content="website">\n    <meta property="og:title" content="${meta.title}">\n    <meta property="og:description" content="${meta.description}">`);
  return html;
}

function normalizeCommon(html, file) {
  html = normalizeMetadata(html, file);
  html = html.replaceAll("index-3.html", "index.html");
  html = html.replace(
    '<li><a href="about.html"><span>Hakkımızda</span></a>\n                                        <li>',
    '<li><a href="about.html"><span>Hakkımızda</span></a></li>\n                                        <li>'
  );
  html = html.replace(/<body class="([^"]*)">/, `<body class="$1 neolife-page-${file.replace(/\.html$/, "").replace(/[^a-z0-9-]/g, "-")}">\n    <a class="skip-link" href="#main-content">İçeriğe geç</a>`);
  html = html.replace(/<main(?![^>]*\bid=)[^>]*>/, (tag) => tag.replace("<main", '<main id="main-content" tabindex="-1"'));
  html = html.replace('<nav class="tp-mobile-menu-active">', '<nav class="tp-mobile-menu-active" aria-label="Ana menü">');

  const currentPrimary = file === "index.html" ? "index.html" :
    file.startsWith("project-") ? "project-grid.html" :
    file.startsWith("services-") ? "services-grid.html" :
    file.startsWith("blog-") ? "blog-standard.html" : file;
  html = html.replace(/<nav class="tp-mobile-menu-active" aria-label="Ana menü">([\s\S]*?)<\/nav>/, (nav) =>
    nav.replace(`href="${currentPrimary}"`, `href="${currentPrimary}" aria-current="page"`)
  );

  html = html.replace(/href="tel:[^"]+"/g, 'href="contact.html#iletisim-formu"');
  html = html.replaceAll("+999 2564G 231", "İletişim formu");
  html = html.replaceAll("+999 2654 2563", "İletişim formu");
  html = html.replaceAll("+(1) 224 676 7430", "İletişim formu");
  html = html.replaceAll("+99 145 896 3649", "İletişim formu");
  html = html.replaceAll("Bizi arayın:", "Bilgi ve satış:");
  html = html.replaceAll("Bizi doğrudan arayın", "Hızlı bilgi talebi");
  html = html.replaceAll("Dünya çapında yenilikçi gayrimenkul çözümleri sunmaya odaklanan özel bir gayrimenkul şirketiyiz.", "Yaşam odaklı projeleri planlama, tasarım, geliştirme ve satış süreçleriyle birlikte ele alıyoruz.");

  html = html.replace('<button id="back_to_top" type="button" class="back-to-top-btn">', '<button id="back_to_top" type="button" class="back-to-top-btn" aria-label="Sayfanın başına dön">');
  html = html.replace('<button class="header-sidebar-btn tp-offcanvas-toogle ml-10">', '<button class="header-sidebar-btn tp-offcanvas-toogle ml-10" type="button" aria-label="Menüyü aç" aria-controls="mobile-menu" aria-expanded="false">');
  html = html.replace('<section class="tp-offcanvas">', '<section class="tp-offcanvas" id="mobile-menu" aria-label="Mobil menü" aria-hidden="true">');
  html = html.replace('<button class="tp-offcanvas-button-close tp-offcanvas-close-toggle">', '<button class="tp-offcanvas-button-close tp-offcanvas-close-toggle" type="button" aria-label="Menüyü kapat">');
  html = html.replace(/<button class="tp-btn-swiper">/g, '<button class="tp-btn-swiper" type="button" aria-label="Slaytı değiştir">');

  html = normalizeDeadLinks(html);
  html = html.replace(/<a([^>]+)target="_blank"(?![^>]*rel=)([^>]*)>/g, '<a$1target="_blank" rel="noopener noreferrer"$2>');
  html = applyFaqAnswers(html);
  return html;
}

async function addImageHints(html) {
  const imagePattern = /<img\b([^>]*?)src="([^"]+)"([^>]*)>/g;
  const matches = [...html.matchAll(imagePattern)];
  const dimensions = new Map();

  for (const match of matches) {
    const src = match[2];
    if (/^(?:https?:|data:)/.test(src)) continue;
    const absolute = path.join(root, src.split(/[?#]/)[0]);
    if (!fs.existsSync(absolute)) continue;
    if (!dimensions.has(src)) {
      const meta = await sharp(absolute).metadata();
      dimensions.set(src, { width: meta.width, height: meta.height });
    }
  }

  return html.replace(imagePattern, (full, before, src, after) => {
    let attrs = `${before}src="${src}"${after}`;
    const size = dimensions.get(src);
    if (size && !/\bwidth=/.test(attrs)) attrs += ` width="${size.width}"`;
    if (size && !/\bheight=/.test(attrs)) attrs += ` height="${size.height}"`;
    if (!/\bdecoding=/.test(attrs)) attrs += ' decoding="async"';
    if (!src.includes("/logo/") && !/\bloading=/.test(attrs)) attrs += ' loading="lazy"';
    return `<img${attrs}>`;
  });
}

function prepareHome(html) {
  html = html.replaceAll("Panaroma", "Nova");
  html = html.replaceAll("team-details.html", "about.html#uzmanliklar");
  html = html.replaceAll("services-grid-icon.html", "services-grid.html");
  html = html.replace(
    /<a href="project-details\.html" class="cursor-hide d-block">(\s*<div class="tp-project project-slider-panel tp-bg" data-background="assets\/img\/neolife\/helios-wide\.webp">)/,
    '<a href="project-helios.html" class="cursor-hide d-block">$1'
  );
  html = html.replace(/data-count="40"/, 'data-count="3"')
    .replace(/data-count="60"/, 'data-count="2"')
    .replace(/data-count="1\.2"/, 'data-count="1"')
    .replace(/data-count="20"/, 'data-count="4"')
    .replaceAll('<span class="tpfact__title-div">+</span>', '<span class="tpfact__title-div" aria-hidden="true"></span>')
    .replace('<span class="tpfact__title-text">Mlr</span>', '<span class="tpfact__title-text" aria-hidden="true"></span>')
    .replace('<span class="tpfact__title-text">Mn</span>', '<span class="tpfact__title-text" aria-hidden="true"></span>')
    .replace("Tamamlanan projeler", "Toplam proje")
    .replace("Geliştirilen projeler", "Yayındaki proje")
    .replace("Toplam proje değeri", "Yakında duyurulacak")
    .replace("Metrekare gayrimenkul alanı", "Filtrelenebilir durum")
    .replace("Yıllık <br>\n                                    Deneyim", "Projelik <br>\n                                    Portföy")
    .replace('<h3 class="tp-about-exprience-num">19</h3>', '<h3 class="tp-about-exprience-num">3</h3>');

  html = replaceSequential(
    html,
    /Hedefimiz sıfır iş kazasıdır; kayıp zaman oranımız sektör standartlarının önündedir\./g,
    [
      "İhtiyaçları netleştirir, proje sürecini anlaşılır adımlarla paylaşırız.",
      "Konum, kullanım ve yaşam senaryolarını birlikte değerlendiririz.",
      "Planlama ve uygulama kararlarını disiplinler arası koordinasyonla yönetiriz.",
      "Mimari estetik ile günlük kullanım konforunu dengeleriz.",
      "Ortak alanları sosyal yaşamı destekleyecek biçimde ele alırız.",
      "Her talebi projenin gerçek kapsamı ve güncel durumu içinde değerlendiririz.",
      "Uzun ömürlü, işlevsel ve bakımı düşünülmüş çözümlere odaklanırız.",
      "Bilgi talebinden satış sonrasına kadar açık iletişimi sürdürürüz."
    ]
  );

  const statements = [
    "Her proje kararını ihtiyaç, konum ve uzun vadeli kullanım değeri üzerinden değerlendiriyoruz.",
    "Tasarım ile uygulama arasındaki koordinasyonu şeffaf bir çalışma düzeniyle yönetiyoruz.",
    "Proje durumunu ve mevcut bilgileri abartısız, anlaşılır ve güncel biçimde paylaşıyoruz.",
    "Müşteri deneyimini ilk bilgi talebinden proje teslim sürecine kadar bütün olarak ele alıyoruz."
  ];
  html = html.replace(/NeoLife ile çalışmak verdiğimiz en doğru karardı\.[\s\S]*?ulaşılabilirlerdi!/g, statements[0]);
  html = html.replace(/NeoLife ile deneyimimiz gerçekten benzersizdi\.[\s\S]*?profesyoneldi!/g, statements[1]);
  html = html.replace(/NeoLife'tan daha iyi bir iş ortağı düşünemezdik\.[\s\S]*?ulaşılabilirlerdi!/g, statements[2]);
  html = html.replace(/NeoLife tüm beklentilerimizi aştı\.[\s\S]*?müşteri odaklıydılar!/g, statements[3]);
  html = html.replace("Eşsiz kalite standartlarımız", "NeoLife proje yaklaşımı");
  html = html.replace("İlhamı keşfedin<span>ve trendler</span>", "Projeleri ve yaşamı<span>birlikte keşfedin</span>");
  html = html.replace("Gayrimenkul markanıza isim vermek <br> artık çok daha kolay.", "Nova projesinin yaşam ve tasarım yaklaşımı.");
  html = html.replace("Kentsel alanları <br> sürdürülebilir biçimde dönüştürüyoruz...", "Bir gayrimenkul projesini değerlendirirken dikkat edilmesi gerekenler.");
  html = html.replace("Yaşam alanlarını amaç ve özenle tasarlıyor, <br> tarzınızı yansıtıyoruz.", "Helios projesinde işlev, konfor ve çağdaş tasarım.");
  html = html.replace('<section class="tp-team-area tp-team-spacing tp-team-spacing-3 fix">', '<section class="tp-team-area tp-team-spacing tp-team-spacing-3 fix" id="uzmanliklar">');
  html = html.replace(/<section class="tp-choose-area([^>]*)>/, '<section class="tp-choose-area$1 id="neden-neolife">');
  return applyFaqAnswers(html);
}

function prepareAbout(html) {
  html = html.replaceAll("Panaroma", "Nova");
  html = html.replace("Özel gayrimenkul yatırımlarında öncü küresel ölçekte yönetim sunuyor, uzun vadeli değer yaratıyoruz yenilik sayesinde", "Yaşam odaklı gayrimenkul projelerini planlama, tasarım ve uygulama disipliniyle geliştiriyoruz");
  html = html.replace("“Uzman stratejileri, öngördüğümüzden daha hızlı ölçeklenmemizi sağladı. Gelirimiz yalnızca altı ayda %50 arttı.”", "“Tasarım, uygulama ve iletişim kararlarını aynı hedef etrafında buluşturan şeffaf bir proje yaklaşımı benimsiyoruz.”");
  html = html.replace('<h4 class="tp-about-satisfied-title margin-0 tp-text-black">%</h4>', '<h4 class="tp-about-satisfied-title margin-0 tp-text-black">Açık</h4>');
  html = html.replace("Memnuniyet oranı", "İletişim yaklaşımı");
  html = html.replace("Ekibimizin yeteneğini ve vizyonunu keşfedin ekip üyelerimiz.", "Projelerimizi şekillendiren uzmanlık alanlarını keşfedin.");
  const roles = ["Proje Geliştirme", "Mimari Tasarım", "İnşaat Yönetimi", "Satış ve Pazarlama", "Yatırım Planlama", "Müşteri Deneyimi"];
  html = replaceSequential(html, /(Cristopher|Silver Oak|Benjamin|Dominic|Frederick|Jonathan)/g, roles);
  html = html.replaceAll("team-details.html", "services-details.html");
  html = html.replaceAll("team.html", "services-grid.html");
  html = html.replace('<section class="tp-team-area tp-team-spacing tp-team-spacing-2 fix">', '<section class="tp-team-area tp-team-spacing tp-team-spacing-2 fix" id="uzmanliklar">');
  html = html.replace(/<section class="tp-value-area([^>]*)>/, '<section class="tp-value-area$1 id="degerler">');
  html = html.replace(/<section class="tp-about-area([^>]*)>/, '<section class="tp-about-area$1 id="yaklasim">');
  return applyFaqAnswers(html);
}

function prepareServices(html) {
  html = html.replace("Sunduğumuz hizmetlere kısaca göz atın sunduğumuz hizmetler", "Projeler için uçtan uca sunduğumuz hizmetlere göz atın");
  return replaceSequential(
    html,
    /Etkileşimli tasarım, anlaşılır ve akıcı kullanıcı deneyimleri oluşturmaya odaklanır\./g,
    [
      "Planlama, saha koordinasyonu, kalite ve ilerleme takibini tek bir proje disiplini içinde yönetiriz.",
      "Projenin konumlandırma, iletişim ve satış adımlarını güncel proje verileriyle birlikte ele alırız.",
      "Bütçe, hedef ve riskleri proje kapsamına göre değerlendirerek karar sürecini destekleriz.",
      "Mimari estetik, günlük kullanım ve uygulanabilirliği dengeli biçimde bir araya getiririz.",
      "Fikir aşamasından teslim sürecine kadar proje hedeflerini, ekipleri ve kararları koordine ederiz."
    ]
  );
}

function prepareServiceDetails(html) {
  html = html.replace("Birlikte Çalışmaya Başlayalım İletişim formu", "Projenizi birlikte değerlendirelim İletişim formu");
  html = html.replace("Onaylanan konsept üzerinden projenin genel formunu, kütlesini ve mekânsal organizasyonunu tanımlayan şematik çizimler geliştiririz.", "Proje hedeflerini, kullanıcı ihtiyaçlarını ve uygulama koşullarını birlikte değerlendirerek net bir yol haritası oluştururuz.");
  html = html.replace(/Yapay zekâ ajansları,[\s\S]*?veriye dayalı içgörüler üretir\./g, "NeoLife; proje geliştirme, mimari koordinasyon, inşaat yönetimi ve satış süreçlerini aynı proje hedefi etrafında birleştirir. Her hizmetin kapsamı, ihtiyaçlar ve mevcut proje verileri üzerinden netleştirilir.");
  html = html.replace(/Yapay zekâ ajanslarının yükselişi,[\s\S]*?ileri teknolojiye erişim sağlar\./g, "Süreç boyunca karar noktalarını, sorumlulukları ve sonraki adımları anlaşılır biçimde paylaşırız. Böylece tasarım ile uygulama arasındaki bilgi kaybını azaltır, proje ilerleyişini daha öngörülebilir hale getiririz.");
  html = html.replace("7/24 destek", "Süreç boyunca iletişim");
  html = html.replaceAll("Başarınız mesai saatleriyle sınırlı değil; bizim desteğimiz de değil.", "Proje kapsamı, güncel durum ve sonraki adımlar hakkında açık bilgi paylaşırız.");
  return applyFaqAnswers(html);
}

function prepareProjectGrid(html) {
  html = html.replaceAll("Panaroma", "Nova");
  html = html.replaceAll('value="panaroma"', 'value="nova"');
  html = html.replaceAll('data-project="panaroma"', 'data-project="nova"');
  html = html.replace(
    '<form action="" class="tp-project-filter" data-project-filter>',
    '<form action="" class="tp-project-filter" data-project-filter aria-label="Projeleri filtrele">'
  );
  html = html.replace(
    '<button class="tp-btn-submit tp-btn-submit-2" type="submit">Filtrele</button>',
    '<div class="tp-project-filter-actions">\n                            <button class="tp-btn-submit tp-btn-submit-2" type="submit">Filtrele</button>\n                            <button class="tp-project-filter-reset" type="reset" data-project-reset>Temizle</button>\n                        </div>'
  );
  html = html.replace(
    '<h2 class="tpproject__title tp-fs-24 margin-0"><a href="project-details.html">Nova</a></h2>',
    '<h2 class="tpproject__title tp-fs-24 margin-0"><a href="project-details.html" aria-label="Nova projesini incele"><img class="neolife-project-card-logo" src="assets/img/neolife/project-logos/nova.png" alt="Nova"></a></h2>'
  );
  html = html.replace(
    '<h2 class="tpproject__title tp-fs-24 margin-0"><a href="project-details.html">Helios</a></h2>',
    '<h2 class="tpproject__title tp-fs-24 margin-0"><a href="project-helios.html" aria-label="Helios projesini incele"><img class="neolife-project-card-logo" src="assets/img/neolife/project-logos/helios.png" alt="Helios"></a></h2>'
  );
  html = html.replace(/(<div class="col-lg-6[^>]*data-project="helios"[\s\S]*?<\/div>\s*<\/div>)/, (block) => block.replaceAll('href="project-details.html"', 'href="project-helios.html"'));
  html = html.replaceAll(">Konaklama<", ">Konut<").replaceAll(">Gayrimenkul<", ">Yaşam<").replaceAll(">Pazarlama<", ">Proje<");
  html = html.replace(
    '<p class="tp-project-filter-empty" data-project-empty role="status" aria-live="polite" hidden>',
    '<p class="tp-project-filter-count" data-project-count role="status" aria-live="polite">3 proje gösteriliyor.</p>\n                <p class="tp-project-filter-empty" data-project-empty role="status" aria-live="polite" hidden>'
  );
  return html;
}

function prepareProject(html, project) {
  const isHelios = project === "Helios";
  html = html.replaceAll("Panaroma", project);
  if (isHelios) {
    html = html.replaceAll("assets/img/neolife/panaroma-detail-hero.webp", "assets/img/neolife/helios-wide.webp");
    html = html.replaceAll("assets/img/neolife/panaroma-gallery-1.webp", "assets/img/neolife/helios-landscape.webp");
    html = html.replaceAll("assets/img/neolife/panaroma-gallery-2.webp", "assets/img/neolife/helios-bedroom.webp");
    html = html.replaceAll("assets/img/neolife/panaroma-gallery-3.webp", "assets/img/neolife/helios-bathroom.webp");
  }

  const values = isHelios ? {
    status: "İnşaatta · Satışta",
    type: "Konut",
    area: "Bilgi için iletişim",
    date: "Geliştirme sürüyor",
    price: "Satış ekibinden bilgi alın",
    description: "Helios, fonksiyonel planlama ile çağdaş iç mekân yaklaşımını bir araya getiren NeoLife projesidir. İnşaat ve satış süreci devam etmektedir; güncel uygunluk ve proje dokümanları için ekibimizle iletişime geçebilirsiniz.",
    approach: "Helios'ta yaşam senaryoları, kullanım konforu ve uygulanabilir tasarım kararları aynı proje disiplini içinde ele alınır. Paylaşılan satış bilgileri talep tarihindeki güncel duruma göre teyit edilir.",
    quick: ["Plan seçenekleri", "Talep üzerine", "Yaşam yaklaşımı", "İşlevsel ve çağdaş", "İç mekân", "Konfor odaklı", "Proje türü", "Konut", "Satış durumu", "Satışta"],
    bullets: ["İşlevsel konut planlaması.", "Çağdaş iç mekân ve malzeme yaklaşımı.", "Süreç boyunca güncel proje bilgilendirmesi.", "NeoLife proje ve satış koordinasyonu."]
  } : {
    status: "Tamamlandı · Tükendi",
    type: "Konut",
    area: "Bilgi için iletişim",
    date: "Tamamlandı",
    price: "Satışlar tamamlandı",
    description: "Nova, modern mimari yaklaşımı ve sosyal yaşam odaklı planlamasıyla tamamlanan NeoLife projesidir. Proje arşivi ve mevcut dokümanlar hakkında bilgi almak için ekibimizle iletişime geçebilirsiniz.",
    approach: "Nova'nın tasarım ve uygulama sürecinde günlük kullanım, ortak yaşam ve mimari bütünlük birlikte ele alındı. Projeye ilişkin bilgiler tamamlanan proje arşivi üzerinden paylaşılır.",
    quick: ["Plan bilgisi", "Talep üzerine", "Yaşam yaklaşımı", "Sosyal yaşam odaklı", "Mimari", "Modern ve işlevsel", "Proje türü", "Konut", "Satış durumu", "Tükendi"],
    bullets: ["Konut ve sosyal yaşam odaklı planlama.", "Mimari bütünlük ve işlevsel kullanım.", "Tamamlanan proje sürecine ait arşiv bilgileri.", "NeoLife proje yönetimi yaklaşımı."]
  };

  html = html.replace("Merkezi iş bölgesi", "Merkez");
  html = html.replace("Yapım Aşamasında", values.status)
    .replaceAll("Ofis ve rezidans", values.type)
    .replace("26.346,74 ft²", values.area)
    .replace("28 Aralık 2025", values.date)
    .replace("$900k – $3.9M", values.price)
    .replace("Başlangıç tarihi", isHelios ? "Proje süreci" : "Tamamlanma durumu")
    .replace("Fiyat aralığı", "Satış durumu");

  html = html.replace(/Proje ilk altı ayında %97 ortalama doluluk oranına ulaşmış[\s\S]*?özenle tasarlanmıştır\./, values.description);
  html = html.replace(/Proje ilk altı ayında %97 ortalama doluluk oranına ulaşmış[\s\S]*?özenle tasarlanmıştır\./, values.approach);
  html = html.replace("Öne çıkan sonuçlar", "Proje yaklaşımı");

  const quickLabels = ["Konut alanı:", "3.850 ft²", "Yatak odaları", "03", "Banyolar", "3 tam, 1 yarım", "Proje türü", values.type, "Garaj", "1 Araç şarj istasyonu"];
  quickLabels.forEach((item, index) => {
    html = html.replace(item, values.quick[index]);
  });
  [
    "Daha hızlı iş akışları ve optimize edilmiş süreçler.",
    "Gelecekteki ihtiyaçlara hazır, ölçeklenebilir sistemler.",
    "Daha iyi deneyim ve daha yüksek etkileşim.",
    "Yaratıcı ve modern problem çözme yaklaşımı."
  ].forEach((item, index) => {
    html = html.replace(item, values.bullets[index]);
  });
  html = html.replace("Fotoğraflar", "Dış mekân").replace("Planlar", "İç mekân").replace("Video", "Yaşam alanları").replace("Sokak görünümü", "Detaylar");
  html = html.replace("Konut ve ticari gayrimenkuller için uzman danışmanlık<span>hizmetleri.</span>", `${project} hakkında bilgi almak için<span>ekibimizle iletişime geçin.</span>`);
  html = html.replace('<form action="#">', `<form action="mailto:info@neolife.com" method="post" enctype="text/plain" data-neolife-mail-form data-subject="${project} proje bilgi talebi" novalidate>`);
  html = html.replace('<input type="text" placeholder="Adınız soyadınız">', '<input type="text" name="ad_soyad" autocomplete="name" maxlength="100" required placeholder="Adınız soyadınız *" aria-label="Adınız soyadınız">');
  html = html.replace('<input type="email" placeholder="E-posta adresiniz">', '<input type="email" name="eposta" autocomplete="email" maxlength="160" required placeholder="E-posta adresiniz *" aria-label="E-posta adresiniz">');
  html = html.replace('<input type="text" placeholder="Telefon numaranız">', '<input type="tel" name="telefon" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="Telefon numaranız" aria-label="Telefon numaranız">');
  html = html.replace('<select>', '<select name="konu" required aria-label="İlgilendiğiniz konu">');
  html = html.replace('<option value="1">İlgilendiğiniz konu...</option>', '<option value="" selected disabled>İlgilendiğiniz konu... *</option>');
  html = html.replace('<option value="2">Konut projeleri</option>', `<option value="${project}">${project} projesi</option>`);
  html = html.replace('<option value="3">Ticari projeler</option>', '<option value="proje-bilgisi">Genel proje bilgisi</option>');
  html = html.replace('<option value="4">Yatırım danışmanlığı</option>', '<option value="satis-sureci">Satış süreci</option>');
  html = html.replace('<textarea placeholder="Mesajınızı yazın..."></textarea>', '<textarea name="mesaj" maxlength="2000" required placeholder="Mesajınızı yazın... *" aria-label="Mesajınız"></textarea>');
  html = html.replace("Sizden haber almayı sabırsızlıkla bekliyoruz! <br>\n                                                            Zorunlu alanlar işaretlenmiştir", "Zorunlu alanlar * ile işaretlenmiştir. <br>\n                                                            Form, e-posta uygulamanızı açar.");
  html = html.replace('</button>\n                                                    </div>\n                                                </div>\n                                            </div>\n                                        </form>', '</button>\n                                                    </div>\n                                                </div>\n                                            </div>\n                                            <p class="form-response mt-20" data-form-response role="status" aria-live="polite"></p>\n                                        </form>');
  return html;
}

function prepareBlogStandard(html) {
  const articlePattern = /<article class="tp-postbox-item mb-80">[\s\S]*?<\/article>/g;
  const articles = [...html.matchAll(articlePattern)];
  const articleData = [
    ["blog-details.html", "Gayrimenkul projesini değerlendirirken <span>5 temel başlık</span>", "Konum, planlama, proje durumu, kullanım senaryosu ve satış koşullarını birlikte değerlendirerek daha sağlıklı karar verebilirsiniz."],
    ["project-details.html", "Nova: tamamlanan projenin <span>yaşam yaklaşımı</span>", "Nova'nın modern mimari ve sosyal yaşam odaklı yaklaşımını proje görselleri ve güncel durum bilgisiyle inceleyin."],
    ["project-helios.html", "Helios: çağdaş planlama <span>ve satış süreci</span>", "İnşaatı ve satış süreci devam eden Helios'un işlevsel planlama ve iç mekân yaklaşımını keşfedin."],
    ["faq.html", "Satın alma sürecinde <span>sık sorulan sorular</span>", "Proje bilgileri, dokümanlar, satış süreci ve uzman görüşü gerektiren kontroller hakkında temel yanıtları inceleyin."]
  ];
  articles.forEach((match, index) => {
    const [href, title, description] = articleData[index];
    let block = match[0].replace('class="tp-postbox-item mb-80"', 'class="tp-postbox-item mb-80" data-blog-post');
    block = block.replaceAll('href="blog-details.html"', `href="${href}"`);
    block = block.replace(/<h3 class="tp-postbox-title tp-section-title mb-15"><a[^>]*>[\s\S]*?<\/a><\/h3>/, `<h3 class="tp-postbox-title tp-section-title mb-15"><a href="${href}">${title}</a></h3>`);
    block = block.replace(/<div class="tp-postbox-content">([\s\S]*?)<p>[\s\S]*?<\/p>/, `<div class="tp-postbox-content">$1<p>${description}</p>`);
    html = html.replace(match[0], block);
  });
  html = html.replace('<form action="#">', '<form action="blog-standard.html" method="get" role="search" data-blog-search>');
  html = html.replace('<input type="search" name="search" placeholder="Arama kelimelerini yazın...">', '<input id="blog-search" type="search" name="q" autocomplete="off" maxlength="80" placeholder="Blogda ara..." aria-label="Blog yazılarında ara">');
  html = html.replace('<button type="submit">', '<button type="submit" aria-label="Ara">');
  html = html.replace('</article>\n                            </div>\n                        </div>', '</article>\n                                <p class="blog-search-empty" data-blog-search-empty role="status" aria-live="polite" hidden>Aramanızla eşleşen içerik bulunamadı.</p>\n                            </div>\n                        </div>');
  html = html.replaceAll("David Hussy", "NeoLife Editör");
  html = html.replaceAll("Hazır başlık tasarımıyla <br> kolay başlangıç", "Proje seçiminde temel ölçütler");
  html = html.replaceAll("Hazır başlık tasarımıyla kolay başlangıç <br> hazır başlık tasarımı", "Nova ve Helios proje notları");
  html = html.replaceAll("25 Mayısısısıs 2024", "25 Mayıs 2024");
  return html;
}

function prepareBlogDetails(html) {
  html = html.replace("Yatırımcılar için gayrimenkul danışmanlığı bir büyüme ortaklığıdır. Yüksek potansiyelli bölgeleri belirler, proje kârlılığını değerlendirir <span>ve uzun vadeli planlama yapar.</span>", "Bir gayrimenkul projesini değerlendirirken <span>5 temel başlık</span>");
  html = html.replace("Temanızı nasıl güncellersiniz?", "Kararı yalnızca görsele göre vermeyin");
  html = html.replace(/Yapay zekâ ajansları,[\s\S]*?veriye dayalı içgörüler üretir\./, "Bir projeyi değerlendirirken yalnızca satış sunumuna değil; konuma, kullanım senaryosuna, güncel proje durumuna, sözleşme koşullarına ve uzun vadeli yaşam ihtiyaçlarına birlikte bakmak gerekir.");
  html = html.replace(/Yapay zekâ ajanslarının yükselişi,[\s\S]*?ileri teknolojiye erişim sağlar\./, "Önce bütçenizi ve kullanım amacınızı netleştirin. Ardından proje dokümanlarını, teslim durumunu ve ödeme planını inceleyin. Hukuki, teknik ve mali konularda bağımsız uzman görüşü alarak bilgileri teyit edin.");
  html = html.replace(/Yapay zekâ ajanslarının yükselişi,[\s\S]*?rekabet için bir gereklilik olarak görüyor\./, "İyi bir proje; yalnızca estetik görünmez, günlük yaşamı kolaylaştıran planlama kararları da sunar. Dolaşım, gün ışığı, depolama, ortak alanlar ve bakım ihtiyaçları birlikte değerlendirilmelidir.");
  html = html.replace(/Yapay zekâ ajanslarının yükselişi,[\s\S]*?rekabet için bir gereklilik olarak görüyor\./, "Satış durumu ve uygunluk bilgileri zaman içinde değişebilir. Karar vermeden önce güncel fiyat, stok, teslim ve sözleşme koşullarını doğrudan proje ekibinden yazılı olarak isteyin.");
  html = html.replaceAll('alt=""', 'alt="NeoLife proje ve yaşam alanı görseli"');
  html = html.replaceAll('Görseller <a href="#">@sample</a>', 'NeoLife proje görselleri');
  html = html.replace("“@neolife gayrimenkul ekibi son derece özverili, bilgili ve yardımsever.”", "“Doğru proje kararı; güncel bilgi, açık karşılaştırma ve bağımsız doğrulama ile güçlenir.”");
  html = html.replace("Socrates", "NeoLife Rehber");

  const commentsStart = html.indexOf('<div class="tp-postbox-comments-wrap pt-75">');
  const formStart = html.indexOf('<div class="tp-postbox-comments-form-wrap pt-100">', commentsStart);
  if (commentsStart !== -1 && formStart !== -1) {
    html = `${html.slice(0, commentsStart)}<div class="tp-postbox-comments-wrap pt-75">\n                                    <h3 class="tp-postbox-comments-title mb-15">Görüşlerinizi paylaşın</h3>\n                                    <p>Bu rehber hakkında sorunuz veya görüşünüz varsa aşağıdaki formdan ekibimize iletebilirsiniz.</p>\n                                </div>\n                                ${html.slice(formStart)}`;
  }
  html = html.replace('<div class="tp-postbox-comments-form-wrap pt-100">', '<div class="tp-postbox-comments-form-wrap pt-50" id="blog-feedback">');
  html = html.replace("Yanıt bırak", "Yazı hakkında görüş gönder");
  html = html.replace("E-posta adresiniz yayımlanmayacaktır. Zorunlu alanlar * ile işaretlenmiştir.", "Zorunlu alanlar * ile işaretlenmiştir. Form e-posta uygulamanızı açar.");
  html = html.replace('<form action="#">', '<form action="mailto:info@neolife.com" method="post" enctype="text/plain" data-neolife-mail-form data-subject="NeoLife blog görüşü" novalidate>');
  html = html.replace('<textarea placeholder="Mesajınızı yazın..."></textarea>', '<textarea name="mesaj" maxlength="2000" required placeholder="Mesajınızı yazın... *" aria-label="Mesajınız"></textarea>');
  html = html.replace('<input type="text" placeholder="Adınız soyadınız">', '<input type="text" name="ad_soyad" autocomplete="name" maxlength="100" required placeholder="Adınız soyadınız *" aria-label="Adınız soyadınız">');
  html = html.replace('<input type="email" placeholder="E-posta adresiniz">', '<input type="email" name="eposta" autocomplete="email" maxlength="160" required placeholder="E-posta adresiniz *" aria-label="E-posta adresiniz">');
  html = html.replace('<input type="text" placeholder="Web sitesi adresi">', '<input type="text" name="ilgilenilen_proje" maxlength="80" placeholder="İlgilendiğiniz proje" aria-label="İlgilendiğiniz proje">');
  html = html.replace('name="checkbox" class="tp-postbox-check" id="remeber" type="checkbox"', 'name="iletisim_izni" value="evet" class="tp-postbox-check" id="iletisim-izni" type="checkbox" required');
  html = html.replace('for="remeber">Bir sonraki yorumum için adımı, e-postamı ve web sitemi bu tarayıcıda kaydet.', 'for="iletisim-izni">Yanıt için e-posta üzerinden iletişim kurulmasını kabul ediyorum.');
  html = html.replace("Yorumu gönder", "Görüşü gönder");
  html = html.replace('</button>\n                                                    </div>\n                                                </div>\n                                            </div>\n                                        </form>', '</button>\n                                                    </div>\n                                                </div>\n                                            </div>\n                                            <p class="form-response mt-20" data-form-response role="status" aria-live="polite"></p>\n                                        </form>');
  html = html.replace('<form action="#">', '<form action="blog-standard.html" method="get" role="search" data-blog-search>');
  html = html.replace('<input type="search" name="search" placeholder="Arama kelimelerini yazın...">', '<input id="blog-search" type="search" name="q" autocomplete="off" maxlength="80" placeholder="Blogda ara..." aria-label="Blog yazılarında ara">');
  html = html.replace('<button type="submit">', '<button type="submit" aria-label="Ara">');
  html = html.replaceAll("David Hussy", "NeoLife Editör");
  html = html.replaceAll("Hazır başlık tasarımıyla <br> kolay başlangıç", "Proje seçiminde temel ölçütler");
  html = html.replaceAll("Hazır başlık tasarımıyla kolay başlangıç <br> hazır başlık tasarımı", "Nova ve Helios proje notları");
  html = html.replaceAll("25 Mayısısısıs 2024", "25 Mayıs 2024");
  return html;
}

function prepareContact(html) {
  html = html.replace('aria-selected="true">New York</button>', 'aria-selected="false">Genel Bilgi</button>');
  html = html.replace('aria-selected="false">Londra</button>', 'aria-selected="true">Nova</button>');
  html = html.replace('aria-selected="false">Avustralya</button>', 'aria-selected="false">Helios</button>');
  html = html.replaceAll("31 Winding Creek Caddesi, <br>\n                                                            New York, ABD", "NeoLife proje ve satış ekibi");
  html = html.replaceAll("Pazartesi - Cuma 10.00 - 18.00", "E-posta üzerinden bilgi alın");
  html = html.replaceAll("OFİS E-POSTASI", "E-POSTA GÖNDER");
  html = html.replace("Sohbeti başlat", '<a href="mailto:info@neolife.com">E-posta gönder</a>');
  html = html.replace("Sizi dinlemekten<span>memnuniyet duyarız</span>", "Projelerimizi görün,<span>bilgi talebinizi iletin</span>");
  html = html.replace(/<iframe[\s\S]*?<\/iframe>/, '<img class="neolife-contact-visual br-20" src="assets/img/neolife/helios-landscape.webp" alt="Helios projesi yaşam alanı">');
  html = html.replace('<a class="d-inline-block" href="#">NeoLife@</a>', '<a class="d-inline-block" href="mailto:info@neolife.com">info@neolife.com</a>');
  html = html.replace('<form action="#">', '<form action="mailto:info@neolife.com" method="post" enctype="text/plain" id="iletisim-formu" data-neolife-mail-form data-subject="NeoLife web sitesi bilgi talebi" novalidate>');
  html = html.replace('<label>Ad Soyad *</label>\n                                    <input type="text">', '<label for="contact-name">Ad Soyad *</label>\n                                    <input id="contact-name" name="ad_soyad" type="text" autocomplete="name" maxlength="100" required>');
  html = html.replace('<label>E-posta *</label>\n                                    <input type="email">', '<label for="contact-email">E-posta *</label>\n                                    <input id="contact-email" name="eposta" type="email" autocomplete="email" maxlength="160" required>');
  html = html.replace('<label>Mesaj *</label>\n                                    <textarea></textarea>', '<label for="contact-message">Mesaj *</label>\n                                    <textarea id="contact-message" name="mesaj" maxlength="2000" required></textarea>');
  html = html.replace("Göndererek koşullarımızı kabul etmiş olursunuz.", "Form e-posta uygulamanızı açar; göndermeden önce mesajınızı kontrol edebilirsiniz.");
  html = html.replace('</button>\n                                </div>', '</button>\n                                </div>\n                                <p class="form-response mt-20" data-form-response role="status" aria-live="polite"></p>');
  html = html.replaceAll('<button class="tp-btn-swiper">', '<button class="tp-btn-swiper" type="button" aria-label="İletişim kartını değiştir">');
  return html;
}

function prepare404(html) {
  html = html.replaceAll('href="index.html"', 'href="index.html"');
  return html;
}

const originalHome = read("index-3.html");
const originalProject = read("project-details.html");
write("index.html", prepareHome(originalHome));
write("project-details.html", prepareProject(originalProject, "Nova"));
write("project-helios.html", prepareProject(originalProject, "Helios"));

const pagePreparers = {
  "about.html": prepareAbout,
  "services-grid.html": prepareServices,
  "services-details.html": prepareServiceDetails,
  "project-grid.html": prepareProjectGrid,
  "blog-standard.html": prepareBlogStandard,
  "blog-details.html": prepareBlogDetails,
  "contact.html": prepareContact,
  "faq.html": applyFaqAnswers,
  "404.html": prepare404
};

for (const [file, prepare] of Object.entries(pagePreparers)) {
  write(file, prepare(read(file)));
}

for (const file of Object.keys(metadata)) {
  let html = normalizeCommon(read(file), file);
  html = await addImageHints(html);
  write(file, html);
}

write("index-3.html", `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NeoLife Ana Sayfa</title>
    <meta name="robots" content="noindex, follow">
    <meta http-equiv="refresh" content="0; url=index.html">
    <link rel="icon" type="image/png" href="assets/img/logo/neolife-favicon.png">
</head>
<body>
    <p>NeoLife ana sayfasına yönlendiriliyorsunuz. <a href="index.html">Yönlendirme başlamazsa buraya tıklayın.</a></p>
    <script>window.location.replace("index.html");<\/script>
</body>
</html>
`);

console.log(`MVP içerik ve erişilebilirlik normalizasyonu tamamlandı: ${Object.keys(metadata).length} aktif sayfa.`);
