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
  'form.success.reference': 'Your reference',
  'form.success.emailNote': 'We have emailed you a copy of what you sent.',

  'form.submitConsultation': 'Request a consultation',
  'form.legend.aboutYou': 'About you',
  'form.legend.plans': 'What you are planning',
  'form.legend.message': 'Your message',
  'form.legend.consent': 'Staying in touch',
  'form.choose': 'Please choose',

  'form.hint.name': 'The student’s name, if you are asking on someone else’s behalf.',
  'form.hint.email': 'We reply here first.',
  'form.hint.phone': 'Include your country code so we can call you back.',
  'form.hint.country': 'Where you are living now.',
  'form.hint.destination': 'A country or a city, if you have one in mind.',
  'form.hint.message': 'Grades, budget, timing: anything that helps us answer properly.',
  'form.hint.noDocuments':
    'Please do not send passport, bank or medical details through this form.',

  'form.interest.universities': 'Universities',
  'form.interest.languageSchools': 'Language schools',
  'form.interest.summerSchools': 'Summer schools',
  'form.interest.boardingSchools': 'Boarding schools',
  'form.interest.tours': 'Campus tours',
  'form.interest.other': 'Something else',

  'form.level.secondary': 'Secondary school',
  'form.level.highSchool': 'High school',
  'form.level.foundation': 'Foundation year',
  'form.level.undergraduate': 'Undergraduate',
  'form.level.postgraduate': 'Postgraduate',
  'form.level.adultLearner': 'Adult learner',
  'form.level.other': 'Something else',

  'form.start.asSoonAsPossible': 'As soon as possible',
  'form.start.withinSixMonths': 'Within six months',
  'form.start.nextAcademicYear': 'Next academic year',
  'form.start.undecided': 'Not decided yet',

  'form.contactMethod.email': 'Email',
  'form.contactMethod.phone': 'Telephone',
  'form.contactMethod.whatsapp': 'WhatsApp',

  'form.consent.explainer':
    'This is separate from your enquiry. We will answer you either way, and you can ask us to stop at any time.',
  'form.privacyLinkLabel': 'Privacy Policy',
  'form.programme.label': 'Your enquiry is about',

  'form.security.label': 'Security check',
  'form.security.pending': 'Please complete the security check before sending.',

  'form.errorPrefix': 'Error:',
  'form.error.required': 'This answer is needed.',
  'form.error.invalid': 'This does not look right. Please check it.',
  'form.error.tooLong': 'This is longer than we can accept.',
  'form.error.tooShort': 'This is shorter than we can accept.',
  'form.error.unsupported': 'We cannot accept this value.',
  'form.error.rateLimit':
    'Several messages have come from this connection in a short time. Please wait a few minutes and try again, or call us.',
  'form.error.captcha':
    'The security check did not pass. Please try again, or contact us by phone or email.',
  'form.error.delivery':
    'We could not deliver your message. Please try again shortly, or contact us by phone or email.',
  'form.error.network': 'Your message did not reach us. Check your connection and try again.',
  'form.error.generic':
    'Something went wrong at our end. Please try again, or contact us by phone or email.',

  'form.status.sending': 'Sending your message.',
  'form.status.sent': 'Your message has been sent.',

  'form.newsletter.legend': 'Occasional guidance by email',
  'form.newsletter.explainer':
    'We write occasionally about applications, deadlines and what studying abroad actually costs. Confirm your address to start, and unsubscribe from any email.',
  'form.newsletter.submit': 'Sign up',
  'form.newsletter.consent': 'Yes, email me occasional guidance on studying abroad.',
  'form.newsletter.success.title': 'Check your inbox',
  'form.newsletter.success.body':
    'We have sent you a link to confirm your address. Nothing is sent until you follow it.',

  // ---- Payments ----------------------------------------------------------
  // Nothing here promises a payment method, a timescale we have not agreed, or a
  // refund term. Amounts and refundability come from the catalogue; the policy
  // pages carry the terms themselves.
  'pay.summaryHeading': 'What you are paying for',
  'pay.serviceLabel': 'Service',
  'pay.amountLabel': 'Amount',
  'pay.coversLabel': 'What this covers',
  'pay.refundLabel': 'Refunds',
  'pay.refundable':
    'Refundable. The refund and cancellation policy sets out the notice period and how to ask.',
  'pay.nonRefundable':
    'Marked as non-refundable. Please read the refund and cancellation policy before you pay.',
  'pay.cancellationHeading': 'Cancelling or changing',
  'pay.cancellationBody':
    'The appointment policy explains how to cancel or move a booking. The refund and cancellation policy explains what is returned.',
  'pay.paidToHeading': 'Who you are paying',
  'pay.registeredOffice': 'Registered office',
  'pay.processorNote':
    'Payment is taken by Stripe on their own secure pages. Happy Education never sees or stores your card details.',
  'pay.methodsNote':
    'Stripe shows the payment methods available for your card, country and device. Which options appear can differ from one device to another.',
  'pay.continue': 'Continue to secure payment',
  'pay.opening': 'Opening secure payment…',
  'pay.errorHeading': 'We could not start the payment',
  'pay.error.generic':
    'Something went wrong at our end. Please try again, or contact us and we will arrange the payment another way.',
  'pay.error.unavailable':
    'Online payment is not available at the moment. Please contact us and we will arrange it with you.',
  'pay.error.rateLimited':
    'Too many attempts in a short time. Please wait a moment and try again.',
  'pay.error.unknownItem':
    'That service cannot be paid for online right now. Please contact us.',
  'pay.error.noPaymentNeeded':
    'This appointment is free, so there is nothing to pay. Please continue to booking instead.',
  'pay.reference': 'Your reference',
  'pay.amountPaid': 'Amount paid',
  'pay.receiptTo': 'Receipt sent to',
  'pay.tryAgain': 'Try again',
  'pay.success.title': 'Payment received',
  'pay.success.body': 'Thank you. Stripe has confirmed your payment and emailed your receipt.',
  'pay.success.next':
    'An adviser will be in touch within one working day to confirm the details with you.',
  'pay.pending.title': 'Payment started',
  'pay.pending.body':
    'The payment method you chose takes a little longer to clear. We will email you as soon as it settles, and there is nothing further for you to do now.',
  'pay.cancelled.title': 'Payment cancelled',
  'pay.cancelled.body':
    'Nothing has been charged. You can start again whenever you are ready, or contact us if you would rather arrange it another way.',
  'pay.failed.title': 'The payment did not go through',
  'pay.failed.body':
    'Nothing has been charged. Your bank may have declined the payment, or the session may have expired. You can try again, or contact us.',
  'pay.unverified.title': 'We could not confirm this payment',
  'pay.unverified.body':
    'We could not match this page to a payment. If money has left your account, contact us with the date and the amount and we will trace it.',

  // ---- Appointment booking -----------------------------------------------
  'booking.dateHeading': 'Choose a date',
  'booking.timeHeading': 'Choose a time',
  'booking.timezoneLabel': 'Times are shown in',
  'booking.businessTimezoneNote': 'Our advisers work to',
  'booking.calendarLabel': 'Appointment dates',
  'booking.previousMonth': 'Previous month',
  'booking.nextMonth': 'Next month',
  'booking.today': 'Today',
  'booking.selectedLabel': 'Selected',
  'booking.selectDateFirst': 'Choose a date to see the times available on it.',
  'booking.noTimesOnDay': 'No times are available on this date.',
  'booking.timesAvailable': 'times available',
  'booking.oneTimeAvailable': '1 time available',
  'booking.unavailableDay': 'no times available',
  'booking.noSlots': 'No times are available in this period.',
  'booking.noSlotsTitle': 'No times available at the moment',
  'booking.noneConfigured.title': 'Appointment times are not published yet',
  'booking.noneConfigured.body':
    'Online booking for this appointment is not open yet. Send us a message or call, and we will arrange a time with you directly.',
  'booking.durationLabel': 'Length',
  'booking.minutes': 'minutes',
  'booking.chosen': 'You have chosen',
  'booking.confirmNote': 'We will send a confirmation by email.',
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
  'form.success.reference': 'Referans numaranız',
  'form.success.emailNote': 'Gönderdiklerinizin bir kopyasını e-posta ile de ilettik.',

  'form.submitConsultation': 'Ön görüşme talep edin',
  'form.legend.aboutYou': 'Sizinle ilgili bilgiler',
  'form.legend.plans': 'Planlarınız',
  'form.legend.message': 'Mesajınız',
  'form.legend.consent': 'İletişimde kalalım',
  'form.choose': 'Lütfen seçin',

  'form.hint.name': 'Bir başkası adına yazıyorsanız öğrencinin adını yazabilirsiniz.',
  'form.hint.email': 'Önce bu adresten dönüş yapıyoruz.',
  'form.hint.phone': 'Ülke kodunu da eklerseniz sizi daha kolay arayabiliriz.',
  'form.hint.country': 'Şu anda yaşadığınız ülke.',
  'form.hint.destination': 'Aklınızda bir ülke veya şehir varsa yazabilirsiniz.',
  'form.hint.message': 'Notlarınız, bütçeniz, takviminiz: doğru yanıt vermemize yarayacak her şey.',
  'form.hint.noDocuments':
    'Lütfen pasaport, banka veya sağlık bilgilerinizi bu form üzerinden göndermeyin.',

  'form.interest.universities': 'Üniversiteler',
  'form.interest.languageSchools': 'Dil okulları',
  'form.interest.summerSchools': 'Yaz okulları',
  'form.interest.boardingSchools': 'Yatılı okullar',
  'form.interest.tours': 'Kampüs turları',
  'form.interest.other': 'Başka bir konu',

  'form.level.secondary': 'Ortaokul',
  'form.level.highSchool': 'Lise',
  'form.level.foundation': 'Hazırlık veya foundation',
  'form.level.undergraduate': 'Lisans',
  'form.level.postgraduate': 'Yüksek lisans veya doktora',
  'form.level.adultLearner': 'Yetişkin öğrenci',
  'form.level.other': 'Diğer',

  'form.start.asSoonAsPossible': 'En kısa sürede',
  'form.start.withinSixMonths': 'Altı ay içinde',
  'form.start.nextAcademicYear': 'Gelecek akademik yıl',
  'form.start.undecided': 'Henüz karar vermedim',

  'form.contactMethod.email': 'E-posta',
  'form.contactMethod.phone': 'Telefon',
  // The product name stays as it is; the noun after it is what makes the option
  // read as an answer to "how should we reach you?" rather than a bare brand.
  'form.contactMethod.whatsapp': 'WhatsApp mesajı',

  'form.consent.explainer':
    'Bu tercih talebinizden bağımsızdır. İzin vermeseniz de size dönüş yaparız; dilediğiniz zaman da listeden çıkabilirsiniz.',
  'form.privacyLinkLabel': 'Gizlilik Politikası',
  'form.programme.label': 'Talebiniz şu program hakkında',

  'form.security.label': 'Güvenlik doğrulaması',
  'form.security.pending': 'Göndermeden önce güvenlik doğrulamasını tamamlayın.',

  'form.errorPrefix': 'Hata:',
  'form.error.required': 'Bu alanı doldurmanız gerekiyor.',
  'form.error.invalid': 'Bu bilgi doğru görünmüyor. Lütfen kontrol edin.',
  'form.error.tooLong': 'Bu alan kabul edebileceğimizden uzun.',
  'form.error.tooShort': 'Bu alan kabul edebileceğimizden kısa.',
  'form.error.unsupported': 'Bu değeri kabul edemiyoruz.',
  'form.error.rateLimit':
    'Bu bağlantıdan kısa sürede birkaç mesaj geldi. Birkaç dakika sonra tekrar deneyin ya da bizi arayın.',
  'form.error.captcha':
    'Güvenlik doğrulaması geçilemedi. Tekrar deneyin ya da telefon veya e-posta ile bize ulaşın.',
  'form.error.delivery':
    'Mesajınızı iletemedik. Kısa süre sonra tekrar deneyin ya da telefon veya e-posta ile bize ulaşın.',
  'form.error.network': 'Mesajınız bize ulaşmadı. Bağlantınızı kontrol edip tekrar deneyin.',
  'form.error.generic':
    'Bizim tarafımızda bir sorun oluştu. Tekrar deneyin ya da telefon veya e-posta ile bize ulaşın.',

  'form.status.sending': 'Mesajınız gönderiliyor.',
  'form.status.sent': 'Mesajınız gönderildi.',

  'form.newsletter.legend': 'Ara sıra e-posta bülteni',
  'form.newsletter.explainer':
    'Başvurular, son tarihler ve yurt dışında okumanın gerçek maliyeti üzerine ara sıra yazıyoruz. Başlamak için adresinizi doğrulayın; her e-postadan tek tıkla çıkabilirsiniz.',
  'form.newsletter.submit': 'Kaydolun',
  'form.newsletter.consent':
    'Evet, yurt dışı eğitimle ilgili bilgilendirmeleri e-posta ile almak istiyorum.',
  'form.newsletter.success.title': 'Gelen kutunuzu kontrol edin',
  'form.newsletter.success.body':
    'Adresinizi doğrulamanız için bir bağlantı gönderdik. Siz onaylamadan hiçbir gönderim yapılmaz.',

  // ---- Payments ----------------------------------------------------------
  'pay.summaryHeading': 'Ödemeniz neleri kapsıyor',
  'pay.serviceLabel': 'Hizmet',
  'pay.amountLabel': 'Tutar',
  'pay.coversLabel': 'Kapsam',
  'pay.refundLabel': 'İade',
  'pay.refundable':
    'İade edilebilir. Bildirim süresi ve başvuru yöntemi iade ve iptal politikamızda açıklanır.',
  'pay.nonRefundable':
    'İade edilmeyen bir ödeme olarak tanımlanmıştır. Ödemeden önce iade ve iptal politikamızı okuyun.',
  'pay.cancellationHeading': 'İptal ve değişiklik',
  'pay.cancellationBody':
    'Randevu politikamız görüşmenizi nasıl iptal edebileceğinizi veya erteleyebileceğinizi, iade ve iptal politikamız ise hangi tutarın geri ödendiğini açıklar.',
  'pay.paidToHeading': 'Ödemeyi kim alıyor',
  'pay.registeredOffice': 'Kayıtlı adres',
  'pay.processorNote':
    'Ödeme, Stripe tarafından kendi güvenli sayfaları üzerinden alınır. Kart bilgileriniz Happy Education tarafından görülmez ve saklanmaz.',
  'pay.methodsNote':
    'Stripe, kartınıza, ülkenize ve cihazınıza uygun ödeme yöntemlerini gösterir. Görünen seçenekler cihazdan cihaza değişebilir.',
  'pay.continue': 'Güvenli ödemeye geçin',
  'pay.opening': 'Güvenli ödeme açılıyor…',
  'pay.errorHeading': 'Ödemeyi başlatamadık',
  'pay.error.generic':
    'Bizim tarafımızda bir sorun oluştu. Yeniden deneyin ya da bize ulaşın, ödemeyi başka bir yolla alalım.',
  'pay.error.unavailable':
    'Çevrim içi ödeme şu anda kullanılamıyor. Bize ulaşın, ödemeyi birlikte planlayalım.',
  'pay.error.rateLimited': 'Kısa sürede çok fazla deneme yapıldı. Biraz bekleyip yeniden deneyin.',
  'pay.error.unknownItem':
    'Bu hizmet için şu anda çevrim içi ödeme alınamıyor. Lütfen bize ulaşın.',
  'pay.error.noPaymentNeeded':
    'Bu görüşme ücretsizdir, ödeme gerekmez. Randevu adımından devam edebilirsiniz.',
  'pay.reference': 'Referans numaranız',
  'pay.amountPaid': 'Ödenen tutar',
  'pay.receiptTo': 'Makbuzun gönderildiği adres',
  'pay.tryAgain': 'Yeniden deneyin',
  'pay.success.title': 'Ödemeniz alındı',
  'pay.success.body': 'Teşekkür ederiz. Stripe ödemenizi onayladı ve makbuzunuzu e-posta ile gönderdi.',
  'pay.success.next':
    'Bir danışmanımız ayrıntıları teyit etmek için en geç bir iş günü içinde size ulaşacak.',
  'pay.pending.title': 'Ödeme başlatıldı',
  'pay.pending.body':
    'Seçtiğiniz ödeme yönteminin hesaba geçmesi biraz zaman alıyor. Tamamlandığında size e-posta göndereceğiz; şu anda yapmanız gereken başka bir şey yok.',
  'pay.cancelled.title': 'Ödeme iptal edildi',
  'pay.cancelled.body':
    'Hesabınızdan herhangi bir tutar çekilmedi. Hazır olduğunuzda yeniden başlayabilir ya da farklı bir yol için bize ulaşabilirsiniz.',
  'pay.failed.title': 'Ödeme tamamlanamadı',
  'pay.failed.body':
    'Hesabınızdan herhangi bir tutar çekilmedi. Bankanız işlemi onaylamamış veya oturum süresi dolmuş olabilir. Yeniden deneyebilir ya da bize ulaşabilirsiniz.',
  'pay.unverified.title': 'Bu ödemeyi doğrulayamadık',
  'pay.unverified.body':
    'Bu sayfayı bir ödemeyle eşleştiremedik. Hesabınızdan tutar çekildiyse tarih ve tutar bilgisiyle bize ulaşın, işlemi izini sürelim.',

  // ---- Appointment booking -----------------------------------------------
  'booking.dateHeading': 'Tarih seçin',
  'booking.timeHeading': 'Saat seçin',
  'booking.timezoneLabel': 'Saatler şu saat diliminde gösteriliyor',
  'booking.businessTimezoneNote': 'Danışmanlarımızın çalışma saat dilimi',
  'booking.calendarLabel': 'Randevu tarihleri',
  'booking.previousMonth': 'Önceki ay',
  'booking.nextMonth': 'Sonraki ay',
  'booking.today': 'Bugün',
  'booking.selectedLabel': 'Seçildi',
  'booking.selectDateFirst': 'Uygun saatleri görmek için bir tarih seçin.',
  'booking.noTimesOnDay': 'Bu tarihte uygun saat bulunmuyor.',
  'booking.timesAvailable': 'uygun saat',
  'booking.oneTimeAvailable': '1 uygun saat',
  'booking.unavailableDay': 'uygun saat yok',
  'booking.noSlots': 'Bu dönemde uygun saat bulunmuyor.',
  'booking.noSlotsTitle': 'Şu anda uygun saat bulunmuyor',
  'booking.noneConfigured.title': 'Randevu saatleri henüz yayımlanmadı',
  'booking.noneConfigured.body':
    'Bu görüşme için çevrim içi randevu henüz açılmadı. Bize yazın veya telefonla ulaşın; uygun bir saati birlikte belirleyelim.',
  'booking.durationLabel': 'Süre',
  'booking.minutes': 'dakika',
  'booking.chosen': 'Seçiminiz',
  'booking.confirmNote': 'Randevunuzu e-posta ile teyit edeceğiz.',
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
