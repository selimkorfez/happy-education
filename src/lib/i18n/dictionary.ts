import type { Locale } from './config'

/**
 * UI chrome strings.
 *
 * These are interface labels only. All editorial content lives in Sanity as two
 * independent locale trees — nothing on this site is machine-translated at runtime.
 *
 * The Turkish here is written as Turkish, not transliterated English: where a
 * literal rendering would read awkwardly, the phrasing differs from the English on
 * purpose. For example "Free Consultation" is "Ücretsiz Ön Görüşme" (literally
 * "free preliminary meeting"), which is how Turkish education agencies actually
 * describe a first appointment, rather than the stilted "Ücretsiz Danışmanlık".
 */

const en = {
  'brand.name': 'Happy Education',
  'brand.tagline': 'International education advisers',

  'meta.defaultTitle': 'Happy Education — study abroad advisers in London',
  'meta.defaultDescription':
    'Independent advice on universities, language schools, summer programmes and boarding schools abroad. Speak to an adviser about your options.',

  'nav.primary': 'Primary',
  'nav.universities': 'Universities',
  'nav.languageSchools': 'Language Schools',
  'nav.summerSchools': 'Summer Schools',
  'nav.boardingSchools': 'Boarding Schools',
  'nav.tours': 'Tours',
  'nav.about': 'About',
  'nav.insights': 'Insights',
  'nav.contact': 'Contact',
  'nav.consultation': 'Book a consultation',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'nav.menu': 'Menu',

  'a11y.skipToContent': 'Skip to main content',
  'a11y.breadcrumb': 'Breadcrumb',
  'a11y.languageSwitcher': 'Change language',
  'a11y.currentPage': 'Current page',
  'a11y.opensInNewTab': 'opens in a new tab',
  'a11y.externalLink': 'external site',

  'lang.switchTo': 'Türkçe',
  'lang.label': 'Language',

  'search.label': 'Search',
  'search.placeholder': 'Search universities, schools and guides',
  'search.submit': 'Search',
  'search.noResults': 'No results found',
  'search.resultsFor': 'Results for',

  'common.readMore': 'Read more',
  'common.lastReviewed': 'Last reviewed',
  'common.published': 'Published',
  'common.updated': 'Updated',
  'common.reviewedBy': 'Reviewed by',
  'common.sources': 'Sources',
  'common.readingTime': 'min read',
  'common.backTo': 'Back to',
  'common.viewAll': 'View all',
  'common.required': 'required',
  'common.optional': 'optional',
  'common.loading': 'Working…',

  'cta.talkToAdviser': 'Speak to an adviser',
  'cta.exploreDestinations': 'Explore destinations',
  'cta.askAboutProgramme': 'Ask about this programme',
  'cta.findLanguageSchool': 'Find a language school',
  'cta.exploreUniversities': 'Explore universities',
  'cta.requestInformation': 'Request more information',

  'footer.company': 'Company',
  'footer.services': 'What we help with',
  'footer.legal': 'Legal',
  'footer.contactUs': 'Contact',
  'footer.followUs': 'Follow',
  'footer.registeredIn': 'Registered in England and Wales',
  'footer.companyNumber': 'Company number',
  'footer.cookiePreferences': 'Cookie preferences',

  'error.404.title': 'We could not find that page',
  'error.404.body':
    'The page may have moved during our website rebuild, or the address may be slightly off. Try a search, or pick one of the sections below.',
  'error.500.title': 'Something went wrong at our end',
  'error.500.body':
    'This is a problem with our website, not with anything you did. Please try again in a moment, or contact us directly if it keeps happening.',
  'error.retry': 'Try again',

  'form.name': 'Full name',
  'form.email': 'Email address',
  'form.phone': 'Telephone or WhatsApp',
  'form.country': 'Country of residence',
  'form.interest': 'What are you interested in?',
  'form.destination': 'Where would you like to study?',
  'form.startDate': 'When would you like to start?',
  'form.educationLevel': 'Your current level of education',
  'form.contactMethod': 'How should we reach you?',
  'form.message': 'Anything else we should know?',
  'form.submit': 'Send enquiry',
  'form.submitting': 'Sending…',
  'form.marketingConsent':
    'Email me occasional guidance on studying abroad. You can unsubscribe at any time.',
  'form.privacyNote': 'We use your details only to answer your enquiry. See our Privacy Policy.',
  'form.errorSummary': 'Please check the following',
  'form.success.title': 'Thank you, your enquiry has reached us',
  'form.success.body': 'An adviser will reply within one working day.',
} as const

const tr: Record<keyof typeof en, string> = {
  'brand.name': 'Happy Education',
  'brand.tagline': 'Yurt dışı eğitim danışmanları',

  'meta.defaultTitle': 'Happy Education — Londra merkezli yurt dışı eğitim danışmanlığı',
  'meta.defaultDescription':
    'Yurt dışında üniversite, dil okulu, yaz okulu ve yatılı okul seçenekleri için bağımsız danışmanlık. Seçeneklerinizi bir danışmanla konuşun.',

  'nav.primary': 'Ana menü',
  'nav.universities': 'Üniversiteler',
  'nav.languageSchools': 'Dil Okulları',
  'nav.summerSchools': 'Yaz Okulları',
  'nav.boardingSchools': 'Yatılı Okullar',
  'nav.tours': 'Turlar',
  'nav.about': 'Hakkımızda',
  'nav.insights': 'Blog',
  'nav.contact': 'İletişim',
  'nav.consultation': 'Ön görüşme planlayın',
  'nav.openMenu': 'Menüyü aç',
  'nav.closeMenu': 'Menüyü kapat',
  'nav.menu': 'Menü',

  'a11y.skipToContent': 'İçeriğe geç',
  'a11y.breadcrumb': 'Sayfa yolu',
  'a11y.languageSwitcher': 'Dili değiştir',
  'a11y.currentPage': 'Bulunduğunuz sayfa',
  'a11y.opensInNewTab': 'yeni sekmede açılır',
  'a11y.externalLink': 'dış bağlantı',

  'lang.switchTo': 'English',
  'lang.label': 'Dil',

  'search.label': 'Arama',
  'search.placeholder': 'Üniversite, okul veya rehber arayın',
  'search.submit': 'Ara',
  'search.noResults': 'Sonuç bulunamadı',
  'search.resultsFor': 'Arama sonuçları',

  'common.readMore': 'Devamını okuyun',
  'common.lastReviewed': 'Son gözden geçirme',
  'common.published': 'Yayımlanma',
  'common.updated': 'Güncelleme',
  'common.reviewedBy': 'Gözden geçiren',
  'common.sources': 'Kaynaklar',
  'common.readingTime': 'dakikalık okuma',
  'common.backTo': 'Geri dön',
  'common.viewAll': 'Tümünü görün',
  'common.required': 'zorunlu',
  'common.optional': 'isteğe bağlı',
  'common.loading': 'İşleniyor…',

  'cta.talkToAdviser': 'Danışmanla görüşün',
  'cta.exploreDestinations': 'Ülkeleri inceleyin',
  'cta.askAboutProgramme': 'Bu program hakkında bilgi alın',
  'cta.findLanguageSchool': 'Dil okulu bulun',
  'cta.exploreUniversities': 'Üniversiteleri inceleyin',
  'cta.requestInformation': 'Bilgi talep edin',

  'footer.company': 'Kurumsal',
  'footer.services': 'Hizmet alanlarımız',
  'footer.legal': 'Yasal',
  'footer.contactUs': 'İletişim',
  'footer.followUs': 'Bizi takip edin',
  'footer.registeredIn': "İngiltere ve Galler'de tescillidir",
  'footer.companyNumber': 'Şirket numarası',
  'footer.cookiePreferences': 'Çerez tercihleri',

  'error.404.title': 'Aradığınız sayfayı bulamadık',
  'error.404.body':
    'Sayfa, web sitemizi yenilerken taşınmış ya da adres eksik yazılmış olabilir. Arama yapabilir veya aşağıdaki bölümlerden birine geçebilirsiniz.',
  'error.500.title': 'Sistemimizde bir sorun oluştu',
  'error.500.body':
    'Bu sorun sizden değil, bizim tarafımızdan kaynaklanıyor. Kısa süre sonra tekrar deneyin; sorun sürerse bize doğrudan ulaşın.',
  'error.retry': 'Tekrar deneyin',

  'form.name': 'Ad soyad',
  'form.email': 'E-posta adresi',
  'form.phone': 'Telefon veya WhatsApp',
  'form.country': 'Yaşadığınız ülke',
  'form.interest': 'Hangi konuda destek istiyorsunuz?',
  'form.destination': 'Nerede okumak istiyorsunuz?',
  'form.startDate': 'Ne zaman başlamayı düşünüyorsunuz?',
  'form.educationLevel': 'Mevcut eğitim durumunuz',
  'form.contactMethod': 'Size nasıl ulaşalım?',
  'form.message': 'Eklemek istedikleriniz',
  'form.submit': 'Mesajı gönderin',
  'form.submitting': 'Gönderiliyor…',
  'form.marketingConsent':
    'Yurt dışı eğitimle ilgili bilgilendirmeleri e-posta ile almak istiyorum. Dilediğiniz zaman çıkabilirsiniz.',
  'form.privacyNote':
    'Bilgilerinizi yalnızca talebinizi yanıtlamak için kullanırız. Gizlilik Politikamızı inceleyebilirsiniz.',
  'form.errorSummary': 'Lütfen aşağıdaki alanları kontrol edin',
  'form.success.title': 'Teşekkürler, mesajınız bize ulaştı',
  'form.success.body': 'Bir danışmanımız en geç bir iş günü içinde size dönecek.',
}

const DICTIONARIES = { en, tr } as const

export type MessageKey = keyof typeof en

/**
 * Look up a UI string. Typed against the English dictionary, so adding a key to
 * `en` without adding it to `tr` is a compile error.
 */
export function t(locale: Locale, key: MessageKey): string {
  return DICTIONARIES[locale][key]
}

/** Bind the locale once for components that need many strings. */
export function translator(locale: Locale) {
  return (key: MessageKey) => t(locale, key)
}
