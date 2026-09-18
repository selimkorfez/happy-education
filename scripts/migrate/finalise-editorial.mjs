import {getCliClient} from 'sanity/cli'

const apply = process.argv.includes('--apply')
const client = getCliClient({apiVersion: '2026-08-01'})

const sectionPages = {
  universities: {
    en: ['Universities abroad', 'universities', 'Country guides, entry requirements, costs and the application timeline for studying at university abroad.'],
    tr: ['Yurt dışında üniversiteler', 'universiteler', 'Yurt dışında üniversite eğitimi için ülke rehberleri, kabul koşulları, maliyetler ve başvuru takvimi.'],
  },
  languageSchools: {
    en: ['Language schools', 'language-schools', 'English-language schools by country and city, with course types, accommodation and start dates to compare.'],
    tr: ['Dil okulları', 'dil-okullari', 'Ülke ve şehir bazında İngilizce dil okulları; kurs türleri, konaklama ve başlangıç tarihleriyle karşılaştırın.'],
  },
  summerSchools: {
    en: ['Summer schools', 'summer-schools', 'Supervised summer programmes for younger students, with individual and accompanied group options.'],
    tr: ['Yaz okulları', 'yaz-okullari', 'Küçük yaş grupları için bireysel ve refakatli grup seçenekleri sunan gözetimli yaz programları.'],
  },
  boardingSchools: {
    en: ['Boarding schools', 'boarding-schools', 'UK boarding schools, curriculum routes, age guidance and a clearer view of how admissions works.'],
    tr: ['Yatılı okullar', 'yatili-okullar', 'İngiltere’de yatılı okullar, müfredat seçenekleri, yaş rehberi ve başvuru sürecine dair açık bilgiler.'],
  },
  tours: {
    en: ['Educational tours', 'tours', 'Organised educational tours for schools and groups, with itineraries, inclusions and supervision arrangements.'],
    tr: ['Eğitim turları', 'turlar', 'Okullar ve gruplar için programı, dâhil olan hizmetleri ve refakat düzeni açıklanan eğitim turları.'],
  },
  insights: {
    en: ['Insights', 'insights', 'Practical guidance on studying abroad from the Happy Education advisory team.'],
    tr: ['Blog', 'blog', 'Happy Education danışman ekibinden yurt dışında eğitim üzerine pratik rehberler.'],
  },
  guides: {
    en: ['Student guide', 'student-guide', 'Applications, accommodation, costs and preparation explained step by step.'],
    tr: ['Öğrenci rehberi', 'ogrenci-rehberi', 'Başvuru, konaklama, maliyet ve hazırlık süreçleri adım adım açıklanıyor.'],
  },
  services: {
    en: ['Our services', 'services', 'How Happy Education supports students from the first conversation through to arrival.'],
    tr: ['Hizmetlerimiz', 'hizmetler', 'Happy Education’ın ilk görüşmeden varışa kadar öğrencilere sunduğu destek.'],
  },
}

const fixedPages = {
  about: {
    en: {
      title: 'About Happy Education', slug: 'about',
      intro: 'A London-registered education consultancy helping students and families make clearer study-abroad decisions.',
      paragraphs: [
        'Happy Education is an education consultancy registered in England and Wales. We advise students and families on course and country choices, applications and the administration that follows an offer.',
        'The company has been registered in the United Kingdom since 2018. Its registered activity is educational support services.',
        'We are not a school or a government body, and we do not decide admissions or visas. Our role is to explain the options clearly and help keep the parts of the application process within your control organised.',
      ],
    },
    tr: {
      title: 'Happy Education hakkında', slug: 'hakkimizda',
      intro: 'Öğrencilerin ve ailelerin yurt dışında eğitim kararlarını daha net vermelerine yardımcı olan, Londra’da tescilli bir eğitim danışmanlığı.',
      paragraphs: [
        'Happy Education, İngiltere ve Galler’de tescilli bir eğitim danışmanlığı şirketidir. Öğrencilere ve ailelere bölüm ve ülke seçimi, başvurular ve kabul sonrası idari süreçler konusunda destek veririz.',
        'Şirket 2018’den bu yana Birleşik Krallık’ta tescillidir. Tescilli faaliyet alanı eğitim destek hizmetleridir.',
        'Bir okul ya da resmî kurum değiliz; kabul veya vize kararlarını biz vermeyiz. Rolümüz, seçenekleri açık biçimde anlatmak ve başvuru sürecinin kontrolünüzde olan adımlarını düzenli tutmanıza yardımcı olmaktır.',
      ],
    },
  },
  contact: {
    en: {
      title: 'Contact us', slug: 'contact',
      intro: 'Tell us what you are considering and give us a little context. An initial conversation is free.',
      paragraphs: [
        'You can contact Happy Education about university study, language courses, summer programmes, boarding schools or educational group travel.',
        'A useful first message includes what the student wants to study, the preferred start date, age or current education level, and any countries already under consideration. We will use that information to suggest a clear next step.',
      ],
    },
    tr: {
      title: 'İletişim', slug: 'iletisim',
      intro: 'Neyi değerlendirdiğinizi ve biraz bağlamı paylaşın. İlk görüşme ücretsizdir.',
      paragraphs: [
        'Üniversite eğitimi, dil okulları, yaz programları, yatılı okullar veya eğitim amaçlı grup seyahatleri için Happy Education ile iletişime geçebilirsiniz.',
        'İlk mesajınızda öğrencinin ne okumak istediğini, hedeflenen başlangıç tarihini, yaşını veya mevcut eğitim seviyesini ve düşündüğünüz ülkeleri paylaşmanız yeterlidir. Bu bilgilerle size net bir sonraki adım önerebiliriz.',
      ],
    },
  },
  consultation: {
    en: {
      title: 'Book a consultation', slug: 'free-consultation',
      intro: 'A first conversation is a chance to organise your options, priorities and practical next steps.',
      paragraphs: [
        'You do not need a finished plan before you contact us. Tell us your goal, timing and main questions, and we can use the conversation to narrow the realistic routes and identify what should happen next.',
      ],
    },
    tr: {
      title: 'Ön görüşme planlayın', slug: 'ucretsiz-danismanlik',
      intro: 'İlk görüşme seçeneklerinizi, önceliklerinizi ve pratik sonraki adımları düzenlemek için bir başlangıçtır.',
      paragraphs: [
        'Bizimle iletişime geçmeden önce bitmiş bir plana ihtiyacınız yoktur. Hedefinizi, zamanlamanızı ve temel sorularınızı paylaşın; görüşmede gerçekçi seçenekleri daraltıp sıradaki adımları birlikte netleştirebiliriz.',
      ],
    },
  },
}

const landingCopy = {
  boardingSchools: {
    en: ['Education in the United Kingdom', 'A strong education and a supported future', ['British boarding schools bring together established academic programmes, a residential environment that builds independence, and structured preparation for university.', 'A good shortlist considers accommodation, supervision, student support, community and admissions requirements alongside academic fit.']],
    tr: ['Birleşik Krallık’ta eğitim', 'Nitelikli eğitim ve güvenli bir gelecek', ['İngiltere’de yatılı okul eğitimi; güçlü akademik programları, öğrencinin bağımsızlığını geliştiren yaşam düzeni ve üniversiteye hazırlık desteğini bir araya getirir.', 'İyi bir kısa liste akademik uyumun yanında konaklama, gözetim, öğrenci desteği, sosyal ortam ve kabul koşullarını da birlikte değerlendirir.']],
  },
  summerIndividual: {
    en: ['Independent participation', 'A summer-school experience in the UK', ['Individual summer schools let students learn English with international peers while the school arranges accommodation, activities, excursions and on-site supervision.', 'Age range, dates, accommodation, teaching and supervision should all be checked together before choosing a programme.']],
    tr: ['Bireysel katılım', 'İngiltere’de yaz okulu deneyimi', ['Bireysel yaz okulları, öğrencinin kendi yaş grubundaki uluslararası katılımcılarla İngilizce öğrenmesini; konaklama, aktivite ve gezileri okulun gözetiminde deneyimlemesini sağlar.', 'Program seçerken yaş aralığı, tarih, konaklama düzeni, ders içeriği ve gözetim şartları birlikte değerlendirilmelidir.']],
  },
  summerGroup: {
    en: ['Accompanied programmes', 'Learn and explore together', ['Group summer schools combine English lessons, workshops, sport, social activities, excursions and an international student environment in a planned programme.', 'Groups travel with a group leader. Exact dates, capacity, campus, accommodation and excursions are confirmed for each group.']],
    tr: ['Refakatli programlar', 'Birlikte öğrenin, birlikte keşfedin', ['Grup yaz okulları; İngilizce derslerini, atölyeleri, spor ve sosyal etkinlikleri, şehir gezilerini ve uluslararası öğrenci ortamını önceden planlanmış bir programda birleştirir.', 'Gruplar refakatçi eşliğinde seyahat eder. Kesin tarih, kontenjan, kampüs, konaklama ve gezi programı her grup için teyit edilir.']],
  },
}

const existingIds = {
  about: {tr: 'page-tr-1271'},
  contact: {tr: 'page-tr-1347'},
  boardingSchools: {tr: 'page-tr-13153'},
  summerIndividual: {tr: 'page-tr-13185'},
  summerGroup: {tr: 'page-tr-13874'},
}

const existingGroups = {
  about: 'tgroup-page-1271',
  contact: 'tgroup-page-1347',
  boardingSchools: 'tgroup-page-13153',
  summerIndividual: 'tgroup-page-13185',
  summerGroup: 'tgroup-page-13874',
}

function portableParagraphs(paragraphs) {
  return paragraphs.map((text, index) => ({
    _key: `p${index + 1}`,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_key: `s${index + 1}`, _type: 'span', marks: [], text}],
  }))
}

function groupId(pageKey) {
  return existingGroups[pageKey] ?? `tgroup-page-${pageKey}`
}

function pageId(pageKey, locale) {
  return existingIds[pageKey]?.[locale] ?? `page-${locale}-${pageKey}`
}

const records = []
for (const [pageKey, languages] of Object.entries(sectionPages)) {
  for (const [locale, [title, slug, intro]] of Object.entries(languages)) {
    records.push({pageKey, locale, title, slug, intro})
  }
}
for (const [pageKey, languages] of Object.entries(fixedPages)) {
  for (const [locale, value] of Object.entries(languages)) {
    records.push({...value, pageKey, locale, body: portableParagraphs(value.paragraphs)})
  }
}
for (const [pageKey, languages] of Object.entries(landingCopy)) {
  for (const [locale, [landingEyebrow, landingTitle, landingIntro]] of Object.entries(languages)) {
    const existing = records.find((record) => record.pageKey === pageKey && record.locale === locale)
    if (existing) Object.assign(existing, {landingEyebrow, landingTitle, landingIntro})
    else {
      const title = pageKey === 'summerIndividual'
        ? (locale === 'en' ? 'Individual summer schools' : 'Bireysel yaz okulları')
        : (locale === 'en' ? 'Group summer schools' : 'Grup yaz okulları')
      const slug = pageKey === 'summerIndividual'
        ? (locale === 'en' ? 'individual' : 'bireysel')
        : (locale === 'en' ? 'group' : 'grup')
      records.push({pageKey, locale, title, slug, intro: landingIntro[0], landingEyebrow, landingTitle, landingIntro})
    }
  }
}

console.log(`${apply ? 'Applying' : 'Dry run:'} ${records.length} bilingual page records across ${new Set(records.map((record) => record.pageKey)).size} public page groups.`)
for (const record of records) console.log(`- ${record.locale.toUpperCase()} ${record.pageKey}: ${record.title}`)

if (!apply) {
  console.log('\nNo changes made. Re-run with --apply to write these records.')
  process.exit(0)
}

let transaction = client.transaction()
for (const pageKey of new Set(records.map((record) => record.pageKey))) {
  transaction = transaction.createIfNotExists({
    _id: groupId(pageKey),
    _type: 'translationGroup',
    title: `Page — ${pageKey}`,
  })
}

for (const record of records) {
  const id = pageId(record.pageKey, record.locale)
  const fields = {
    _type: 'page',
    locale: record.locale,
    title: record.title,
    slug: {_type: 'slug', current: record.slug},
    pageKey: record.pageKey,
    intro: record.intro,
    translationGroup: {_type: 'reference', _ref: groupId(record.pageKey)},
    ...(record.body ? {body: record.body} : {}),
    ...(record.landingEyebrow ? {
      landingEyebrow: record.landingEyebrow,
      landingTitle: record.landingTitle,
      landingIntro: record.landingIntro,
    } : {}),
  }
  transaction = transaction
    .createIfNotExists({_id: id, ...fields})
    .patch(id, (patch) => patch.set(fields))
}

const result = await transaction.commit()
console.log(`Updated ${records.length} page records. Transaction: ${result.transactionId}`)
