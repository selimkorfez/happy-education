# Legal review register

**Status: none of the documents in `content/legal/` has been reviewed by a lawyer.**

Every file in `content/legal/{en,tr}/` carries `solicitorApproved: false` and a draft
notice. `scripts/seed-legal.mjs` refuses to write a published Sanity document while that
flag is false, and seeds unpublished drafts instead. Nothing here reaches a visitor until
somebody qualified has signed it off and the flag is flipped by hand.

The drafts were written by a non-lawyer from published regulator guidance during the
2026 site rebuild. They are deliberately plain and specific rather than vague. That is a
better starting point for a solicitor than boilerplate, but it also means the wording
commits the business to things, and those commitments need checking before they are made
in public.

This register lists every item that needs professional sign-off, why, and what happens if
the text is published as it stands. Each item has an ID that appears in the front matter
(`reviewRefs`) of the documents it affects, so a reviewer can work from either direction.

## How to use this file

1. Send the register and the drafts to the reviewer together. The `reviewRefs` in each
   file tell them which sections carry an open question.
2. Record the outcome against the item below. Do not delete an item, mark it resolved with
   a date and who decided.
3. Only when every item touching a document is closed, set `solicitorApproved: true` in
   that file's front matter and re-run `node scripts/seed-legal.mjs`.
4. Some items need a business decision before a lawyer can advise, for example retention
   periods and the processor list. Those are marked **business input first**.

## Priority order

Ranked by the likelihood of harm multiplied by how bad the harm would be. The first two
are the reason this register exists.

| Rank | ID | Item | Severity |
|---|---|---|---|
| 1 | LR-01 | Immigration wording and IAA registration status | Critical |
| 2 | LR-10 | Safeguarding: split of responsibility for minors | Critical |
| 3 | LR-02 | KVKK: VERBİS registration and a Turkish representative | Critical |
| 4 | LR-09 | Consumer cancellation rights wording | High |
| 5 | LR-23 | Criminal record check wording for staff working with minors | High |
| 6 | LR-06 | Consent banner must block tags before consent, not after | High |
| 7 | LR-03 | Processor list must match what is actually deployed | High |
| 8 | LR-08 | Liability limitation clauses | High |
| 9 | LR-15 | Handling money owed to institutions | High |
| 10 | LR-04 | Retention periods | High |

Items 11 and below are set out in full underneath and still block publication of the
documents they touch.

## The register

### LR-01 Immigration wording and IAA registration status

**Documents** `serviceTerms` section 3, `disclaimer` section 2, `appointments` section 8,
`complaints` escalation list, both languages.

**Question** Does HAPPY EDUCATION CONSULTANCY LTD hold a registration with the Immigration
Advice Authority, at what level, and under what number? If it does not, is any part of what
the business actually does for clients capable of being immigration advice or an
immigration service rather than administrative support?

**Why** Under the Immigration and Asylum Act 1999, providing immigration advice or services
in the course of a business in the UK without registration or an exemption is a criminal
offence. The audit could not confirm any registration, and the register could not be queried
programmatically, so this is unresolved rather than cleared. The legacy website marketed
"vize danışmanlığı" across dozens of pages.

**Risk if published unreviewed** Two directions, both serious. If the drafts understate what
the business does, the disclaimer becomes a false statement and provides no protection at
all: a court looks at the substance of the service, not at the notice. If the business is in
fact doing more than administration, publishing a page describing it is evidence of the
offence. There is also a consumer protection angle: a client who believed they were buying
advice and was not told otherwise may have a misrepresentation claim.

**Needed** A solicitor with immigration regulatory experience, working from a description of
what the business actually does step by step for a visa client, not from the marketing copy.
If a registration exists, section 3 of the service terms changes completely and the number
and level must be published.

**Business input first** A written account of the visa work actually performed, including
what is said to clients on the phone.

### LR-02 KVKK, VERBİS registration and a Turkish representative

**Documents** `privacy` section 12, both languages. Affects the whole Turkish site.

**Question** Does a UK company that markets to Turkish residents in Turkish, publishes an
Istanbul address and processes the personal data of people in Türkiye have to register with
VERBİS and appoint a Turkish representative under Law No. 6698? If so, what does the
aydınlatma metni have to say and where must it appear?

**Why** UK GDPR compliance does not answer the Turkish question. KVKK builds on explicit
consent in a way UK GDPR does not, has its own transfer regime under Article 9 as amended in
2024, its own 30 day response deadline under Article 13, and its own complaint route to the
Kurul. The obligation to appoint a representative and register in VERBİS falls on controllers
established abroad in defined circumstances, and those circumstances need applying to these
facts by someone who practises in this area.

**Risk if published unreviewed** Administrative fines under KVKK, including a separate fine
head for failing to register with VERBİS where required. Publishing a Turkish language
privacy notice that does not meet the aydınlatma requirements is itself a breach, and the
current draft says the position is being assessed, which is honest but cannot stay on the
site indefinitely.

**Needed** A Turkish data protection lawyer. The answer also determines whether an Istanbul
presence creates a Turkish establishment for other purposes, which overlaps with LR-27.

### LR-03 Processor list must match what is actually deployed

**Documents** `privacy` section 6, `cookies` section 4, both languages.

**Question** Which of Stripe, Vercel, Sanity, Cloudflare, Resend, Google and any CRM are
actually live in production at launch, under what contract, and is there a written processor
agreement with each one containing UK GDPR Article 28 terms?

**Why** A privacy notice must name the categories of recipient accurately. The drafts list the
suppliers in the codebase, but every integration in this project degrades gracefully when it
is not configured, so the deployed set may be smaller. The legacy site also sends form data to
Salesforce, which does not appear in the new stack and must not silently survive.

**Risk if published unreviewed** A notice that names a processor which is not used is
inaccurate. A notice that omits one that is used is worse: it is a transparency breach and, if
the processor is outside the UK, an undisclosed international transfer.

**Business input first** Confirmation of the live integration list and copies of the data
processing terms. Cross-check against `src/lib/env.ts` and `isConfigured` at deploy time.

### LR-04 Retention periods

**Documents** `privacy` section 8, `appointments` section 12, `complaints` section 7, both
languages.

**Question** Are the proposed periods right for how this business actually works?

**Why** The drafts propose: 12 months for unconverted enquiries, 6 years for client files and
accounting records, deletion of identity and financial documents once an application is
decided, 24 months for appointment notes, 12 months for security logs, 6 months for the cookie
consent record, 6 years for complaint files. Six years tracks the limitation period for a
contract claim and HMRC record keeping. They are defensible, but they are proposals, not
decisions, and a period that is published and then not honoured is worse than one that was
never published.

**Risk if published unreviewed** Publishing a schedule the business does not follow is a
storage limitation breach and hands a complainant a ready made case. The safeguarding line is
currently left open on purpose, see LR-24.

**Business input first** Confirm each period, then confirm there is a way to actually delete
at the end of it, including in the CRM and in email.

### LR-05 International transfers to Türkiye

**Documents** `privacy` section 7, both languages.

**Question** Does client data move to anyone in Türkiye, and on what legal basis?

**Why** Türkiye is not covered by UK adequacy regulations. The draft relies on the transfer
being necessary to perform the client's contract, or on explicit consent. Contract necessity
is a narrow derogation intended for occasional transfers, not for a systematic flow, and
regulators read it narrowly. If there is a regular flow to a Turkish team, the correct
instrument is probably an International Data Transfer Agreement plus a transfer risk
assessment.

**Risk if published unreviewed** Systematic transfers dressed up as a derogation are a
recognised enforcement target, and the notice would be describing an unlawful transfer.

**Business input first** Who in Türkiye sees client data, how often, and under what contract.

### LR-06 Consent banner must block tags before consent

**Documents** `cookies` sections 2 and 4, both languages. Also an engineering item.

**Question** Do analytics and marketing tags genuinely stay unloaded until the visitor
consents, and is refusing as easy as accepting?

**Why** PECR requires prior consent for non-essential storage. The consent model in
`src/lib/consent.ts` is built correctly, with no pre-ticked categories and a first party
cookie the server can read. The audit found the legacy site loaded GTM and the Meta pixel
regardless of the banner state. The new site must be verified, not assumed.

**Risk if published unreviewed** The cookie policy would state something untrue. Unconsented
tracking is one of the most commonly enforced breaches, and a policy claiming otherwise is
evidence of intent rather than oversight.

**Needed** A technical verification at launch, recorded with a date, plus a check that the
published table matches the tags in the container.

### LR-07 Governing law and jurisdiction for consumers outside the UK

**Documents** `terms` section 9, `serviceTerms` section 12, both languages.

**Question** Is an English law and exclusive English jurisdiction clause enforceable against a
consumer resident in Türkiye, and is the carve out in the drafts drawn correctly?

**Why** Most of the client base is outside the UK. A consumer normally keeps the protection of
the mandatory rules of their country of residence, and may be able to sue there. The drafts
say so rather than hiding it, which is the honest position, but the exact wording decides
whether the clause is useful or void.

**Risk if published unreviewed** An overreaching clause can be struck out as unfair, taking
the rest of the protection with it, and can attract regulatory attention on its own.

### LR-08 Liability limitation clauses

**Documents** `terms` section 8, `serviceTerms` section 9, `disclaimer` section 10, both
languages.

**Question** Are the limits enforceable under the Consumer Rights Act 2015 Part 2 and the
Unfair Contract Terms Act 1977, and should there be a financial cap?

**Why** The drafts limit liability to foreseeable loss, exclude business loss, and preserve
the non-excludable heads. They deliberately do not cap liability at the fee paid, because a
cap needs to be justified as fair rather than simply asserted.

**Risk if published unreviewed** An unfair term is unenforceable and its presence can render
the trader's whole approach suspect. Equally, no cap at all may expose the business beyond
what its insurance covers, which links to LR-28.

### LR-09 Consumer cancellation rights wording

**Documents** `refunds` sections 2, 3 and 4, `serviceTerms` section 10, `paymentTerms` section
7, `appointments` section 6, both languages.

**Question** Is the 14 day cancellation right, the proportionate payment rule for services
started early, and the loss of the right when a service is fully performed inside the period,
stated correctly for both a UK consumer and a Turkish resident consumer?

**Why** These are the Consumer Contracts (Information, Cancellation and Additional Charges)
Regulations 2013. The right only ends on full performance if the consumer made an express
request and acknowledged the loss of the right, and the trader can only charge for work done
if it gave the required information beforehand. Turkish distance selling rules reach a similar
result by a different route, and the Turkish text needs checking against them rather than
being a translation of the English.

**Risk if published unreviewed** Getting this wrong is the single most common consumer law
failure on service websites. If the pre contract information is not given properly, the
cancellation period extends by up to twelve months and the trader cannot charge for the work
done at all. It is also a Trading Standards enforcement priority.

### LR-10 Safeguarding: split of responsibility for minors

**Documents** `safeguarding` sections 3, 4 and 5, both languages.

**Question** Is the division between what the programme provider is responsible for and what
Happy Education is responsible for accurate, and is any part of it a term that a court would
refuse to enforce?

**Why** Minors travel abroad on summer schools and boarding placements arranged through this
business. The draft says the provider is responsible for care and supervision and that Happy
Education is responsible for accurate information, faithful transmission of what parents tell
us, and acting on concerns. It makes no safety guarantee. That is the honest position, but the
line between "we introduced you to them" and "we placed your child with them" is a legal
question, and the answer may depend on how the service is sold.

**Risk if published unreviewed** Two failure modes. Claiming too little responsibility in a
consumer contract can be an unfair term, and it does not protect the business anyway if the
substance of the arrangement says otherwise. Claiming too much creates a duty the business
cannot discharge and probably cannot insure. Either way the exposure involves children, so
this ranks with LR-01 whatever the numbers say.

**Needed** A solicitor, and ideally a safeguarding professional reading the same draft.

### LR-11 EU representative under Article 27 of the EU GDPR

**Documents** `privacy`, both languages.

**Question** Does the business offer services to people in the EU or EEA in a way that brings
it within the territorial scope of the EU GDPR, and if so must it appoint an Article 27
representative in a member state?

**Why** The site describes study destinations across Europe and is published in two languages.
Monitoring or offering services to EU residents triggers Article 3(2), and Article 27 then
requires a representative unless an exemption applies.

**Risk if published unreviewed** A gap no one has looked at. If the answer is yes, the privacy
notice must name the representative, which changes the document.

### LR-12 Legitimate interests assessments

**Documents** `privacy` section 5, both languages.

**Question** The draft relies on legitimate interests for enquiry handling, security logging,
complaint handling and defending claims. Has a legitimate interests assessment been written
for each?

**Why** UK GDPR requires the balancing exercise to be done and documented, and the notice
invites data subjects to ask for the reasoning. Right now there is nothing to give them.

**Risk if published unreviewed** An accountability failure that is easy to find and cheap to
fix in advance, expensive to explain afterwards.

### LR-13 Commission disclosure

**Documents** `serviceTerms` section 7, both languages.

**Question** Does the business receive commission from institutions, and can it actually
comply with the published promise to tell a client before they accept an offer?

**Why** The draft states a rule rather than asserting a fact, which is the right approach for
an unverified point. But once published it is a contractual commitment and a representation to
consumers.

**Risk if published unreviewed** Publishing a transparency promise and not keeping it is worse
than saying nothing, and undisclosed commission in an advisory relationship raises both
consumer protection and conflict of interest concerns.

**Business input first** Confirm the commercial arrangements with institutions.

### LR-14 VAT status

**Documents** `paymentTerms` section 1, both languages.

**Question** Is the company VAT registered, and are published prices inclusive or exclusive?
Does the place of supply for a consultancy service to a consumer outside the UK change the
answer?

**Why** The draft states a rule ("where VAT applies, the amount is shown before you pay")
because the registration status is unconfirmed. Consumer pricing law requires the total price
including taxes to be given up front.

**Risk if published unreviewed** A pricing display breach, and invoices that do not match the
site.

**Business input first** The accountant, not the solicitor, answers this first.

### LR-15 Handling money owed to institutions

**Documents** `paymentTerms` section 6, `refunds` section 5, both languages.

**Question** Does the business ever receive tuition, deposits or other institution fees into
its own account, and if so what protects that money if the business fails?

**Why** The draft tells clients to pay institutions directly wherever possible and states that
the business is not a regulated holder of client money. That is protective and honest, but if
money does pass through, the arrangement may raise regulated payment services questions and
certainly raises an insolvency risk for the client.

**Risk if published unreviewed** Client money held without protection and without disclosure is
a serious consumer harm, and describing the practice inaccurately compounds it.

**Business input first** Bank records showing whether institution fees pass through the
company account.

### LR-16 Payment processor identity

**Documents** `paymentTerms` section 3, `privacy` section 6, `cookies` section 4, both
languages.

**Question** Which Stripe entity is the contracting party, in which country, and what does that
mean for the international transfer statement in the privacy notice?

**Why** The privacy notice names the processor and the transfer safeguard. Naming the wrong
entity makes both wrong.

### LR-17 Cancellation stage percentages

**Documents** `refunds` section 4, both languages.

**Question** Do the proposed stage percentages (up to 25, 50, 75 per cent, then full fee)
reflect the real proportion of work done at each point?

**Why** A pre estimate of the trader's costs must be genuine. A schedule that front loads the
charge beyond the work actually done is an unfair term, and the draft was written without cost
data.

**Business input first** How the work actually divides across a typical engagement.

### LR-18 Missed appointment and late cancellation charges

**Documents** `appointments` section 5, both languages.

**Question** Are any appointments actually charged for, and is keeping the fee on a late
cancellation a genuine pre estimate of loss?

**Why** Same unfair terms analysis as LR-17, at a smaller scale. If every consultation is free,
half of that section can be deleted, which is the better outcome.

### LR-19 Language conflict clause

**Documents** `disclaimer` section 8, `terms` section 9, both languages.

**Question** The draft says that for a contract, the version in the language the client dealt
with governs. Is that workable, and does it hold where a Turkish speaking client is sent
English documents?

**Why** Publishing in two languages without saying which prevails creates ambiguity; saying the
wrong thing creates a different problem. Turkish consumer protection generally favours the
consumer's language.

### LR-20 Accessibility statement accuracy

**Documents** `accessibility` sections 3 and 4, both languages.

**Question** Is every statement in "what we have done" true of the finished site on the day it
launches, and is the list of known gaps complete?

**Why** These are factual claims, not policy. The draft was written alongside the build and
lists real gaps: migrated alternative text, untagged PDFs, third party embeds, the bot
challenge, wide tables. It also says explicitly that no independent audit has been
commissioned.

**Risk if published unreviewed** A statement claiming conformance the site does not achieve is
a misleading commercial practice, and undermines the Equality Act position it was meant to
support. Retest before launch and delete anything that is not true.

**Needed** Engineering verification rather than legal review, then a quick legal read of the
enforcement paragraph.

### LR-21 Alternative dispute resolution

**Documents** `complaints` section 6, both languages.

**Question** Will the business join a certified ADR scheme, and if not, is the disclosure
worded as the ADR Regulations 2015 require at the point a complaint cannot be settled?

**Why** A trader that cannot resolve a complaint must tell the consumer about a certified ADR
body and whether it intends to use it. The draft states the position honestly and promises a
written answer at the end of the procedure.

**Note for the reviewer** Do not reintroduce a link to the EU Online Dispute Resolution
platform. It never applied to a UK trader post Brexit and the platform has closed. Many
template policies still carry it.

### LR-22 Complaint timescales

**Documents** `complaints` sections 3 and 4, both languages.

**Question** Can a business with one director and a small team meet 3 working days to
acknowledge, 15 working days to respond and 15 working days for a review?

**Why** Published timescales are a promise. Missing them creates a second complaint about the
handling of the first.

**Business input first** A realistic answer, then adjust the numbers rather than the intent.

### LR-23 Criminal record check wording

**Documents** `safeguarding` section 8, both languages.

**Question** Do any team members hold a role that requires a DBS check or its Turkish
equivalent, have those checks been carried out, and at what level?

**Why** The draft deliberately states a policy ("where a role requires a check, we will obtain
one before that role begins") rather than a claim that checks exist. It must not be upgraded to
a claim without evidence.

**Risk if published unreviewed** Claiming checks that were not carried out is a false trust
signal in a child safety context. It would be one of the most damaging possible misstatements
on this site, both legally and reputationally.

### LR-24 Retention of safeguarding records

**Documents** `safeguarding` section 10, `privacy` section 8, both languages.

**Question** How long should a record of a reported safeguarding concern be kept?

**Why** The draft deliberately leaves the period open and says specialist advice is being taken,
because guidance in this area points to long retention that has to be justified against data
minimisation. It cannot stay open indefinitely.

**Needed** Specialist advice, then update both documents together.

### LR-25 Company details disclosure across the site

**Documents** `terms` section 1, plus the site footer.

**Question** Do the company name, registered number, registered office and contact details
appear as required by the Companies Act 2006 and the E-Commerce Regulations 2002, on every
page rather than only in the terms?

**Why** The disclosure is mandatory for a company trading online. The drafts carry it, and the
footer is the other place it must appear.

**Note** The registered office is a serviced address shared with thousands of companies. It must
be labelled as the registered office and never described as an office, headquarters or a place
students can visit. Every draft in `content/legal` follows that rule and it must not be relaxed
in review.

### LR-26 Testimonials, named individuals and consent

**Documents** `terms` section 5, `disclaimer` section 9.

**Question** Is there documented consent for every testimonial and every named individual the
site will publish?

**Why** The drafts promise not to publish a client's name, photo or story without written
agreement, and that the agreement can be withdrawn. The audit found existing testimonials that
cannot be verified and staff names that cannot be confirmed.

**Risk if published unreviewed** Publishing without consent is both a data protection breach and
a broken promise made on the same website.

### LR-27 Istanbul address and Turkish establishment

**Documents** `privacy` sections 1, 7 and 12, `complaints` section 6.

**Question** Is there a Turkish entity, a lease, or staff in Türkiye, and does publishing an
Istanbul address create an establishment for data protection, consumer jurisdiction or tax
purposes?

**Why** The legacy site publishes an Istanbul address that could not be verified and no Turkish
legal entity was found. The privacy and complaints drafts name the UK company as the only
controller and trader. If a Turkish establishment exists, both documents change and LR-02
becomes considerably more likely to require registration.

**Business input first** The factual position, in writing, before any Turkish address is
republished anywhere on the new site.

### LR-28 Professional indemnity insurance

**Documents** cross cutting, affects LR-08 and LR-10.

**Question** Does the business hold professional indemnity cover, at what limit, and does the
policy respond to the liability position taken in these documents, including work involving
minors and applications made on a client's behalf?

**Why** A liability clause is only as useful as the insurance behind it. This is the question
that decides whether an uncapped foreseeable loss position is survivable.

## Documents and their open items

| Document | Open items |
|---|---|
| privacy | LR-02, LR-03, LR-04, LR-05, LR-11, LR-12, LR-16, LR-24, LR-27 |
| cookies | LR-03, LR-06, LR-16 |
| terms | LR-07, LR-08, LR-25, LR-26 |
| serviceTerms | LR-01, LR-07, LR-08, LR-09, LR-13 |
| paymentTerms | LR-14, LR-15, LR-16 |
| refunds | LR-09, LR-15, LR-17 |
| appointments | LR-09, LR-18 |
| disclaimer | LR-01, LR-08, LR-19, LR-26 |
| accessibility | LR-20 |
| complaints | LR-21, LR-22, LR-27 |
| safeguarding | LR-10, LR-23, LR-24 |

## Sign-off record

Fill this in as items close. A document cannot be approved while any of its items is open.

| ID | Reviewer | Date | Outcome | Documents updated |
|---|---|---|---|---|
| LR-01 | | | | |
| LR-02 | | | | |
| LR-03 | | | | |
| LR-04 | | | | |
| LR-05 | | | | |
| LR-06 | | | | |
| LR-07 | | | | |
| LR-08 | | | | |
| LR-09 | | | | |
| LR-10 | | | | |
| LR-11 | | | | |
| LR-12 | | | | |
| LR-13 | | | | |
| LR-14 | | | | |
| LR-15 | | | | |
| LR-16 | | | | |
| LR-17 | | | | |
| LR-18 | | | | |
| LR-19 | | | | |
| LR-20 | | | | |
| LR-21 | | | | |
| LR-22 | | | | |
| LR-23 | | | | |
| LR-24 | | | | |
| LR-25 | | | | |
| LR-26 | | | | |
| LR-27 | | | | |
| LR-28 | | | | |

## Related material

- `src/lib/business-facts.ts` holds the verified facts and `BLOCKED_CLAIMS`, the list of
  assertions that must never be published. The legal drafts were written against it.
- `src/lib/legal.ts` is the source of truth for document keys and slugs. `seed-legal.mjs`
  reads it and fails if a draft disagrees.
- `docs/audit/report-2.md` sets out the evidence behind LR-01, LR-26 and LR-27.
- `docs/audit/report-1.md` sets out the evidence behind LR-06.
