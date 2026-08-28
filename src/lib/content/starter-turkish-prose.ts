import type { ProseDoc } from '@/lib/sanity/queries/content'

function blocks(paragraphs: string[]) {
  return paragraphs.map((text, index) => ({
    _type: 'block',
    _key: `starter-tr-${index}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `text-${index}`, text, marks: [] }],
  }))
}

type Entry = {
  type: 'guide' | 'service'
  slug: string
  title: string
  summary: string
  paragraphs: string[]
}

const ENTRIES: Entry[] = [
  {
    type: 'guide',
    slug: 'universite-secim-rehberi',
    title: 'Yurt dışında üniversite nasıl seçilir?',
    summary: 'Bölüm içeriği, kabul koşulları, konum ve bütçeyi birlikte değerlendirerek gerçekçi bir kısa liste oluşturun.',
    paragraphs: [
      'Üniversite adından önce okuyacağınız bölüme bakın. Ders içerikleri, değerlendirme yöntemi, uygulama imkânları ve mezuniyet sonrası hedeflerinizle uyumu kısa listenin temelini oluşturmalıdır.',
      'Ardından güncel kabul koşullarını, konumu ve toplam eğitim maliyetini karşılaştırın. Sıralamalar yardımcı bir veri olabilir ancak bölüm uyumunun ve resmî kabul bilgilerinin yerini tutmaz.',
      'Başvuru yapmadan önce seçtiğiniz programın güncel koşullarını üniversitenin kendi resmî sayfasından kontrol edin.',
    ],
  },
  {
    type: 'guide',
    slug: 'basvuru-takvimi',
    title: 'Üniversite başvuru takvimi',
    summary: 'Araştırma, belge hazırlığı, başvuru, teklif ve yola çıkış öncesi işlemleri son haftaya bırakmadan planlayın.',
    paragraphs: [
      'Hedeflenen başlangıç tarihinden geriye doğru plan yapın. Program araştırması, belge hazırlığı ve kurumların ek bilgi taleplerine cevap verebilmek için ayrı zaman bırakın.',
      'Kimlik, akademik belgeler ve programın istediği diğer materyalleri erkenden düzenleyin. Kesin belge listesi programdan programa değişebileceği için güncel resmî başvuru talimatlarını esas alın.',
      'Kabul geldikten sonra koşulları dikkatle karşılaştırın; konaklama, seyahat ve varsa ayrı resmî işlemleri kendi takvimleriyle yönetin.',
    ],
  },
  {
    type: 'guide',
    slug: 'dil-okulu-secim-rehberi',
    title: 'Dil okulu seçme rehberi',
    summary: 'Kurs yoğunluğu, şehir, konaklama ve hedefinizi birlikte karşılaştırarak doğru programı seçin.',
    paragraphs: [
      'Önce hedefinizi belirleyin. Genel İngilizce, sınav hazırlığı, akademik İngilizce ve yoğun programlar farklı ihtiyaçlara cevap verir.',
      'Ders saatleri, program yapısı, okulun konumu ve konaklama seçeneklerini birlikte değerlendirin. Ödeme yapmadan önce güncel ücret ve iptal koşullarını yazılı olarak kontrol edin.',
    ],
  },
  {
    type: 'guide',
    slug: 'yurt-disi-butce-rehberi',
    title: 'Yurt dışı eğitim bütçesi nasıl planlanır?',
    summary: 'Eğitim, konaklama, günlük yaşam, seyahat ve ilk kurulum giderlerini ayrı ayrı hesaplayın.',
    paragraphs: [
      'Eğitim ücreti ve konaklama gibi temel giderleri, ilk seyahat ve depozito gibi tek seferlik masraflardan ayırın. Daha sonra yemek, şehir içi ulaşım, eğitim materyalleri ve beklenmeyen giderler için pay ekleyin.',
      'Güvendiğiniz ücret rakamlarını kurumun güncel resmî bilgisinden alın. Eski bir blog yazısındaki fiyatı güncel kabul etmeyin.',
    ],
  },
  {
    type: 'service',
    slug: 'universite-basvuru-destegi',
    title: 'Üniversite başvuru desteği',
    summary: 'Program kısa listesi, başvuru planı ve belge organizasyonunda ilk görüşmeden kabul aşamasına kadar destek.',
    paragraphs: [
      'Hedeflerinize uygun programları karşılaştırmanıza, başvuru için gereken bilgileri düzenlemenize ve süreci bir takvim içinde yönetmenize yardımcı oluyoruz.',
      'Kabul koşullarını ve nihai kabul kararını üniversite belirler. Başvuru desteğimiz herhangi bir kabul sonucu garanti etmez.',
    ],
  },
  {
    type: 'service',
    slug: 'dil-okulu-yerlestirme',
    title: 'Dil okulu yerleştirme desteği',
    summary: 'Seviyenize, hedefinize, tarihinize ve şehir tercihinize göre uygun dil programlarını karşılaştırın.',
    paragraphs: [
      'Kurs türlerini ve şehirleri karşılaştırmanıza, uygun bir seçenek belirlediğinizde eğitim-kayıt işlemlerini organize etmenize yardımcı oluyoruz.',
      'Ödeme öncesinde kurs tarihleri, konaklama, ücret ve iptal koşulları sağlayıcının güncel bilgileri üzerinden teyit edilmelidir.',
    ],
  },
  {
    type: 'service',
    slug: 'yaz-okulu-yerlestirme',
    title: 'Yaz okulu yerleştirme desteği',
    summary: 'Bireysel ve grup yaz programlarını yaş, program yapısı, konaklama ve aktiviteler açısından karşılaştırın.',
    paragraphs: [
      'Ailelerin programları yaş uygunluğu, dersler, konaklama, aktiviteler ve kayıt koşulları açısından karşılaştırmasına yardımcı oluyoruz.',
      'Program sağlayıcısı kendi yerinde yürüttüğü gözetim, öğrenci refahı ve çocuk koruma uygulamalarından sorumludur. Bu düzenlemelerin kayıt öncesinde yazılı olarak incelenmesini öneriyoruz.',
    ],
  },
  {
    type: 'service',
    slug: 'yatili-okul-basvuru-destegi',
    title: 'Yatılı okul başvuru desteği',
    summary: 'Akademik uyum, yaş, konum ve öğrencinin yatılı yaşama hazırlığına göre kısa liste ve başvuru organizasyonu.',
    paragraphs: [
      'Ailelerin okul seçeneklerini akademik yapı ile birlikte konaklama ve öğrenci desteği açısından değerlendirmesine, ardından seçilen okulların başvuru sürecini organize etmesine yardımcı oluyoruz.',
      'Kabul, ücret, kontenjan, pastoral düzenlemeler ve çocuk koruma politikaları okulun sorumluluğundadır ve güncel okul bilgileri üzerinden teyit edilmelidir.',
    ],
  },
  {
    type: 'service',
    slug: 'basvuru-belge-kontrolu',
    title: 'Başvuru belge kontrolü',
    summary: 'Göndermeye hazırladığınız eğitim başvurusu belgeleri için düzenli bir eksiksizlik kontrolü.',
    paragraphs: [
      'Başvuru belgelerini düzenlemenize, belirgin eksikleri fark etmenize ve dosyanın kurumun yayımladığı talimatlara uygun hazırlanmasına yardımcı olabiliriz.',
      'Bu hizmet eğitim başvurusu ve idari süreç desteğidir; ayrıca düzenlemeye tabi profesyonel danışmanlık gereken konuların yerini tutmaz.',
    ],
  },
  {
    type: 'service',
    slug: 'yola-cikis-oncesi-destek',
    title: 'Yola çıkış öncesi destek',
    summary: 'Kesinleşen eğitim planından konaklama, seyahat hazırlığı ve varış organizasyonuna geçiş için pratik destek.',
    paragraphs: [
      'Eğitim yerleşimi kesinleştikten sonra konaklama, kurumla iletişim, seyahat hazırlığı ve varışta hazır bulunması gereken belgeler için pratik bir kontrol listesi oluşturmanıza yardımcı oluyoruz.',
      'Devletlerin giriş ve göçmenlik koşulları eğitim yerleşiminden ayrı süreçlerdir ve değişebilir; bu konularda güncel resmî devlet kaynaklarını esas alın.',
    ],
  },
]

export function listTurkishStarterProse(type: 'guide' | 'service') {
  return ENTRIES.filter((entry) => entry.type === type).map(({ title, slug, summary }) => ({ title, slug, summary }))
}

export function getTurkishStarterProse(type: 'guide' | 'service', slug: string): ProseDoc | null {
  const entry = ENTRIES.find((item) => item.type === type && item.slug === slug)
  if (!entry) return null
  return {
    _id: `starter-${type}-tr-${slug}`,
    title: entry.title,
    slug: entry.slug,
    locale: 'tr',
    summary: entry.summary,
    body: blocks(entry.paragraphs),
    review: { lastReviewed: '2026-08-28', timeSensitive: false },
  }
}
