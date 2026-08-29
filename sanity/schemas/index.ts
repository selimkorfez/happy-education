import { seo } from './objects/seo'
import { imageWithMeta } from './objects/imageWithMeta'
import { richText } from './objects/richText'
import { source, reviewMeta, faqItem, cta, sourcedFact } from './objects/editorial'
import {
  translationGroup, siteSettings, category, author, teamMember, office,
  testimonial, partner, redirect, legalPage,
} from './documents/core'
import {
  destination, institution, languageSchool, boardingSchool, summerProgramme,
  tour, article, service, guide, page, appointmentType, paymentService,
} from './documents/content'
import { socialPost } from './documents/community'

/** Every type registered with the Studio. Order here drives the default desk list. */
export const schemaTypes = [
  // Objects
  seo, imageWithMeta, richText, source, reviewMeta, faqItem, cta, sourcedFact,
  // Documents
  siteSettings, translationGroup,
  destination, institution, languageSchool, boardingSchool, summerProgramme, tour,
  article, category, author, guide, service, page, socialPost,
  teamMember, office, testimonial, partner,
  appointmentType, paymentService,
  legalPage, redirect,
]
