import 'server-only'

import type { LicensedExternalImage } from './licensed-media'

/** Source licences verified 2026-09-09; see docs/EDITORIAL-IMAGERY.md.
 * Bundled copies retain attribution and pass through the same publication gate. */
export const EDITORIAL_PHOTOS = {
  "notebook": {
    "src": "/media/editorial/notebook.webp",
    "alt": "An open notebook and pencil on a wooden table",
    "creator": "Jan Kahánek",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:A_notebook.jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "heritage-library": {
    "src": "/media/editorial/heritage-library.webp",
    "alt": "Bookshelves and a decorated ceiling in the library at Chantilly, France",
    "creator": "Gabriel Ghnassia",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chantilly_library_study_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "reading-hall": {
    "src": "/media/editorial/reading-hall.webp",
    "alt": "The warmly lit Mortlock Wing of the State Library of South Australia",
    "creator": "Mike Wilson",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Impressive_library_collection_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "bookshelves": {
    "src": "/media/editorial/bookshelves.webp",
    "alt": "Colourful books arranged on library shelves in Uppsala",
    "creator": "Aleksi Tappura",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Uppsala_Library_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "bright-library": {
    "src": "/media/editorial/bright-library.webp",
    "alt": "Tall windows and reading tables in a bright library in Québec City",
    "creator": "Tu Tram Pham",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:White_library_tall_windows_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "course-books": {
    "src": "/media/editorial/course-books.webp",
    "alt": "An open reference book, pencils and a keyboard on a study desk",
    "creator": "Aleks Dorohovich",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Books,_pencils,_laptop,_and_iphone_on_a_desk_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "workspace": {
    "src": "/media/editorial/workspace.webp",
    "alt": "A laptop beside a window on an uncluttered wooden desk",
    "creator": "Norbert Levajsics",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Laptop_on_a_neat_desk_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "study-desk": {
    "src": "/media/editorial/study-desk.webp",
    "alt": "A desk lamp, computer and stacks of books by a bright window",
    "creator": "freddie marriage",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Laptop_on_desk_book_stacks_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "planning-desk": {
    "src": "/media/editorial/planning-desk.webp",
    "alt": "A notebook, pen and ruler beside a laptop and mug",
    "creator": "Oli Dale",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ruler_and_laptop_on_a_desk_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "travel-planning": {
    "src": "/media/editorial/travel-planning.webp",
    "alt": "A map, notebook and camera on a table as a journey is planned",
    "creator": "rawpixel.com",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Planning_a_trip_over_coffee_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "travel",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "reading-break": {
    "src": "/media/editorial/reading-break.webp",
    "alt": "Coffee, flowers and books on a wooden table by a window",
    "creator": "Juja Han",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Coffee,_flowers_and_books_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "open-book": {
    "src": "/media/editorial/open-book.webp",
    "alt": "An open book and pencil beside coffee and cookies",
    "creator": "PICSELI",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Coffee_and_cookies_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "shared-lounge": {
    "src": "/media/editorial/shared-lounge.webp",
    "alt": "Colourful sofas and coffee tables in a shared lounge in Toronto",
    "creator": "Sophia Baboolal",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Coffee_tables_in_front_of_a_comfy_sofa_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "reading-notes": {
    "src": "/media/editorial/reading-notes.webp",
    "alt": "An open book on a wooden table with a cup of coffee",
    "creator": "rawpixel.com",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Reading_in_Bangkok_(Unsplash).jpg",
    "licence": "CC0 1.0",
    "licenceUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "kind": "study",
    "privacy": "no-identifiable-people",
    "cleared": true
  },
  "home-cambridge": {
    "src": "/media/editorial/home-cambridge.webp",
    "alt": "King’s College Chapel and green lawns beside the River Cam, with a punt on the water in Cambridge",
    "creator": "Andrew Dunn",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:KingsCollegeChapelWest.jpg",
    "licence": "CC BY-SA 2.0",
    "licenceUrl": "https://creativecommons.org/licenses/by-sa/2.0/",
    "kind": "campus",
    "privacy": "architecture-or-cityscape",
    "cleared": true
  },
} as const satisfies Record<string, LicensedExternalImage>
