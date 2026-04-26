/**
 * Per-service-type wizard config. Each entry defines the steps a vendor walks
 * through to publish a listing of that type. The shared <OnboardingWizard>
 * component reads from this config — we add a new service type by adding a
 * new key here, no component code changes.
 *
 * Field shape: each step has a list of fields with `key`, `label`, `type`
 * (text/textarea/number/select/multiselect/file/etc), and optional
 * `required`. Type-specific fields (flavoursOffered, genres, traditions, ...)
 * use `target: 'typeAttributes'` so the create/update payload nests them
 * under typeAttributes rather than the parent.
 *
 * KYC docs are surfaced as their own step with `type: 'kyc-doc'`. The wizard
 * uploads them via uploadServiceListingKyc() and validates against the per-
 * type required-doc list before submit.
 */

export type WizardFieldType =
  | 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'boolean' | 'kyc-doc';

export type WizardField = {
  key: string;
  label: string;
  type: WizardFieldType;
  target?: 'shared' | 'typeAttributes';     // default 'shared' — goes onto parent
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  // For kyc-doc only:
  documentType?: string;                     // FSSAI, AADHAAR, PAN, etc.
};

export type WizardStep = {
  key: string;
  title: string;
  description?: string;
  fields: WizardField[];
};

export type WizardConfig = {
  serviceType: string;                       // ServiceListingType enum name
  displayName: string;
  hero: { emoji: string; tagline: string };
  pricingPattern: string;                    // PER_UNIT_TIERED, PER_TIME_BLOCK, FLAT_PER_ITEM, QUOTE_ON_REQUEST
  calendarMode: 'DAY_GRAIN' | 'SLOT_GRAIN';
  defaultLeadTimeHours: number;
  requiredKyc: string[];                     // documentType values that must be uploaded before submit
  steps: WizardStep[];
};

const COMMON_BUSINESS_FIELDS: WizardField[] = [
  { key: 'businessName',  label: 'Business name',           type: 'text',     required: true,  placeholder: 'e.g. Sweet Symphony Bakery' },
  { key: 'vendorSlug',    label: 'URL slug (lowercase, dashes)', type: 'text', required: true, placeholder: 'sweet-symphony-bakery', helpText: 'Lives at /services/{type}/{slug}' },
  { key: 'tagline',       label: 'Tagline (one line)',      type: 'text',     placeholder: 'Bespoke wedding cakes since 2018' },
  { key: 'aboutMd',       label: 'About / story',           type: 'textarea', helpText: 'Tell customers what makes you unique. Markdown supported.' },
  { key: 'foundedYear',   label: 'Founded year',            type: 'number' },
  { key: 'heroImageUrl',  label: 'Hero photo URL',          type: 'text',     helpText: 'Upload to media-service first, paste S3 URL here. (V1 — image picker comes V2.)' },
];

const COMMON_COVERAGE_FIELDS: WizardField[] = [
  { key: 'homeCity',          label: 'Home city',         type: 'text',  required: true, placeholder: 'Hyderabad' },
  { key: 'homePincode',       label: 'Pincode',           type: 'text' },
  { key: 'deliveryRadiusKm',  label: 'Delivery radius (km from home)', type: 'number', helpText: 'Beyond this, customer must arrange pickup' },
  { key: 'outstationCapable', label: 'Will you travel outstation for weddings?', type: 'boolean' },
];

export const WIZARD_CONFIGS: Record<string, WizardConfig> = {

  // ────────────────── CAKE_DESIGNER ──────────────────────
  CAKE_DESIGNER: {
    serviceType: 'CAKE_DESIGNER',
    displayName: 'Cake Designer',
    hero: { emoji: '🎂', tagline: 'Sell bespoke cakes through Safar' },
    pricingPattern: 'PER_UNIT_TIERED',
    calendarMode: 'DAY_GRAIN',
    defaultLeadTimeHours: 48,
    requiredKyc: ['AADHAAR', 'PAN', 'FSSAI'],
    steps: [
      {
        key: 'business',
        title: 'About your bakery',
        description: 'How customers will find and recognize you',
        fields: COMMON_BUSINESS_FIELDS,
      },
      {
        key: 'bakery-details',
        title: 'Bakery details',
        fields: [
          {
            key: 'bakeryType', label: 'Bakery type', type: 'select', target: 'typeAttributes', required: true,
            options: [
              { value: 'HOME_BAKER',  label: 'Home baker' },
              { value: 'COMMERCIAL',  label: 'Commercial bakery' },
              { value: 'CLOUD_KITCHEN', label: 'Cloud kitchen' },
            ],
          },
          { key: 'ovenCapacityKgPerDay', label: 'Daily oven capacity (kg)', type: 'number', target: 'typeAttributes' },
          { key: 'maxTierCount', label: 'Max number of tiers', type: 'number', target: 'typeAttributes', placeholder: '5' },
          { key: 'egglessCapable', label: 'Eggless options available?', type: 'boolean', target: 'typeAttributes' },
          { key: 'veganCapable',   label: 'Vegan options available?',   type: 'boolean', target: 'typeAttributes' },
          {
            key: 'flavoursOffered', label: 'Flavours offered', type: 'multiselect', target: 'typeAttributes',
            options: [
              'CHOCOLATE','VANILLA','RED_VELVET','BUTTERSCOTCH','FRESH_FRUIT','CHEESECAKE',
              'MOUSSE','DRY_FRUIT','MANGO','BLACK_FOREST','PINEAPPLE',
            ].map(v => ({ value: v, label: v.replace(/_/g, ' ').toLowerCase() })),
          },
          {
            key: 'designStyles', label: 'Design styles', type: 'multiselect', target: 'typeAttributes',
            options: ['FONDANT','BUTTERCREAM','CREAM_CHEESE','PHOTO_PRINT','SCULPTED','THEME_CAKE']
              .map(v => ({ value: v, label: v.replace(/_/g,' ').toLowerCase() })),
          },
          {
            key: 'deliveryMode', label: 'How do customers receive cakes?', type: 'select', target: 'typeAttributes',
            options: [
              { value: 'SELF',         label: 'I deliver in person' },
              { value: 'PARTNER',      label: 'Delivery partner (Dunzo / Porter)' },
              { value: 'PICKUP_ONLY',  label: 'Customer picks up' },
            ],
          },
        ],
      },
      {
        key: 'coverage',
        title: 'Service area',
        fields: COMMON_COVERAGE_FIELDS,
      },
      {
        key: 'kyc',
        title: 'KYC documents',
        description: 'FSSAI is legally required to sell food on Safar (Food Safety Act). Aadhaar + PAN are standard ID + tax docs.',
        fields: [
          { key: 'aadhaar', label: 'Aadhaar', type: 'kyc-doc', documentType: 'AADHAAR', required: true },
          { key: 'pan',     label: 'PAN',     type: 'kyc-doc', documentType: 'PAN',     required: true },
          { key: 'fssai',   label: 'FSSAI license', type: 'kyc-doc', documentType: 'FSSAI', required: true,
            helpText: 'Mandatory. Get one at fssai.gov.in if you don\'t have it.' },
          { key: 'gst',     label: 'GST (optional)', type: 'kyc-doc', documentType: 'GST' },
        ],
      },
    ],
  },

  // ────────────────── SINGER ──────────────────────────
  SINGER: {
    serviceType: 'SINGER',
    displayName: 'Singer / Performer',
    hero: { emoji: '🎤', tagline: 'Get booked for weddings, sangeet nights, corporate events' },
    pricingPattern: 'PER_TIME_BLOCK',
    calendarMode: 'SLOT_GRAIN',
    defaultLeadTimeHours: 168,                  // 7 days
    requiredKyc: ['AADHAAR', 'PAN'],
    steps: [
      { key: 'business', title: 'About your act', fields: COMMON_BUSINESS_FIELDS },
      {
        key: 'performance',
        title: 'Performance details',
        fields: [
          {
            key: 'actType', label: 'Act type', type: 'select', target: 'typeAttributes', required: true,
            options: [
              { value: 'SOLO',   label: 'Solo' },
              { value: 'DUO',    label: 'Duo' },
              { value: 'BAND',   label: 'Band' },
              { value: 'TROUPE', label: 'Troupe (3+ performers)' },
            ],
          },
          {
            key: 'genres', label: 'Genres', type: 'multiselect', target: 'typeAttributes',
            options: ['SUFI','QAWALI','BHAJAN','BOLLYWOOD','HINDUSTANI','CARNATIC','PUNJABI','GHAZAL','FOLK','WESTERN']
              .map(v => ({ value: v, label: v })),
          },
          {
            key: 'languages', label: 'Languages', type: 'multiselect', target: 'typeAttributes',
            options: ['HINDI','PUNJABI','URDU','TAMIL','BENGALI','MARATHI','GUJARATI','TELUGU','KANNADA','SANSKRIT','ENGLISH']
              .map(v => ({ value: v, label: v })),
          },
          { key: 'religiousCapable', label: 'Available for religious events (Sufi/Bhajan)?', type: 'boolean', target: 'typeAttributes' },
          {
            key: 'equipmentOwned', label: 'Sound equipment', type: 'select', target: 'typeAttributes',
            options: [
              { value: 'FULL_PA',  label: 'I bring full PA system' },
              { value: 'PARTIAL',  label: 'Partial (mic only)' },
              { value: 'NONE',     label: 'Customer arranges all sound' },
            ],
          },
          { key: 'setupTimeMinutes', label: 'Sound check / setup time (min)', type: 'number', target: 'typeAttributes', placeholder: '30' },
        ],
      },
      { key: 'coverage', title: 'Service area', fields: COMMON_COVERAGE_FIELDS },
      {
        key: 'kyc',
        title: 'KYC documents',
        fields: [
          { key: 'aadhaar', label: 'Aadhaar', type: 'kyc-doc', documentType: 'AADHAAR', required: true },
          { key: 'pan',     label: 'PAN',     type: 'kyc-doc', documentType: 'PAN',     required: true },
          { key: 'gst',     label: 'GST (optional)', type: 'kyc-doc', documentType: 'GST' },
          { key: 'iprs',    label: 'IPRS / PPL music license (optional)', type: 'kyc-doc', documentType: 'IPRS',
            helpText: 'Required for commercial public performance. Defer if you don\'t have one yet.' },
        ],
      },
    ],
  },

  // ────────────────── PANDIT ──────────────────────────
  PANDIT: {
    serviceType: 'PANDIT',
    displayName: 'Pandit / Acharya',
    hero: { emoji: '🪔', tagline: 'Offer pujas through Safar' },
    pricingPattern: 'FLAT_PER_ITEM',
    calendarMode: 'DAY_GRAIN',
    defaultLeadTimeHours: 24,
    requiredKyc: ['AADHAAR', 'PAN', 'LINEAGE_PROOF'],
    steps: [
      { key: 'business', title: 'About you', fields: COMMON_BUSINESS_FIELDS },
      {
        key: 'tradition',
        title: 'Tradition & specialization',
        description: 'Customers filter by tradition + language + puja type — be precise so the right families find you.',
        fields: [
          {
            key: 'tradition', label: 'Tradition / sampradaya', type: 'select', target: 'typeAttributes', required: true,
            options: [
              'SMARTA','VAISHNAV','SHAIVITE','SHAKTA','SINDHI','ARYA_SAMAJ',
              'KASHMIRI_PANDIT','IYER','IYENGAR','MAITHIL','BHATT','SARASWAT',
            ].map(v => ({ value: v, label: v.replace(/_/g, ' ') })),
          },
          { key: 'panditGotra', label: 'Your gotra', type: 'text', target: 'typeAttributes', placeholder: 'Bharadwaj, Kashyap, etc.' },
          {
            key: 'textLanguages', label: 'Languages of recitation', type: 'multiselect', target: 'typeAttributes',
            options: ['SANSKRIT','HINDI','TAMIL','BENGALI','MARATHI','GUJARATI','TELUGU','KANNADA','MALAYALAM','PUNJABI']
              .map(v => ({ value: v, label: v })),
          },
          {
            key: 'shastraSpecializations', label: 'Shastra specializations', type: 'multiselect', target: 'typeAttributes',
            options: ['KARMA_KANDA','JYOTISH','VEDIC','TANTRIC','ASTROLOGY','VASTU']
              .map(v => ({ value: v, label: v.replace(/_/g, ' ') })),
          },
          {
            key: 'pujaTypesOffered', label: 'Pujas you offer', type: 'multiselect', target: 'typeAttributes',
            helpText: 'Pick all that apply. Each can become a service item with its own price + tier.',
            options: [
              'GRIHA_PRAVESH','SATYANARAYAN','WEDDING','MUNDAN','ANNAPRASHAN','ANNIVERSARY',
              'SHRADDHA','NAVAGRAHA','RUDRABHISHEK','GANESH_HOMA','LAKSHMI_PUJA','SARASWATI_PUJA',
            ].map(v => ({ value: v, label: v.replace(/_/g, ' ') })),
          },
          {
            key: 'samagriProvided', label: 'Samagri (puja kit) provided?', type: 'select', target: 'typeAttributes',
            options: [
              { value: 'ALL',     label: 'I bring everything' },
              { value: 'PARTIAL', label: 'I bring some — customer arranges rest' },
              { value: 'NONE',    label: 'Customer arranges all samagri' },
            ],
          },
          {
            key: 'onlineViaVideoCall', label: 'Available for online (video-call) pujas?', type: 'boolean', target: 'typeAttributes',
            helpText: 'Many families have moved to online for daily pujas + Shraddha.',
          },
        ],
      },
      { key: 'coverage', title: 'Service area', fields: COMMON_COVERAGE_FIELDS },
      {
        key: 'kyc',
        title: 'KYC documents',
        description: 'Lineage proof = guru-shishya parampara letter, Vedic institution certificate, or temple affiliation letter. Anything that establishes your right to perform vedic ceremonies.',
        fields: [
          { key: 'aadhaar', label: 'Aadhaar', type: 'kyc-doc', documentType: 'AADHAAR', required: true },
          { key: 'pan',     label: 'PAN',     type: 'kyc-doc', documentType: 'PAN',     required: true },
          { key: 'lineage', label: 'Lineage / institution proof', type: 'kyc-doc', documentType: 'LINEAGE_PROOF', required: true,
            helpText: 'Required. Admin reviews manually.' },
        ],
      },
    ],
  },

  // ────────────────── DECORATOR ──────────────────────────
  DECORATOR: {
    serviceType: 'DECORATOR',
    displayName: 'Decorator',
    hero: { emoji: '🌸', tagline: 'Decorate weddings, sangeet, parties, corporate events' },
    pricingPattern: 'QUOTE_ON_REQUEST',
    calendarMode: 'DAY_GRAIN',
    defaultLeadTimeHours: 72,
    requiredKyc: ['AADHAAR', 'PAN'],
    steps: [
      { key: 'business', title: 'About your service', fields: COMMON_BUSINESS_FIELDS },
      {
        key: 'capabilities',
        title: 'Style & capabilities',
        fields: [
          {
            key: 'decorStyles', label: 'Decoration styles', type: 'multiselect', target: 'typeAttributes', required: true,
            options: ['PUNJABI','SOUTH_INDIAN','MARWARI','BENGALI','MODERN','RUSTIC','FUSION','THEME','MINIMALIST','ROYAL','FLORAL','BOHEMIAN']
              .map(v => ({ value: v, label: v.replace(/_/g, ' ').toLowerCase() })),
          },
          {
            key: 'setupCapabilities', label: 'Setup capabilities', type: 'multiselect', target: 'typeAttributes',
            options: ['FLORAL','LIGHTING','STAGE','MANDAP','SEATING','CENTERPIECES','BACKDROP','PROPS','BALLOONS','LED_WALLS']
              .map(v => ({ value: v, label: v.replace(/_/g, ' ').toLowerCase() })),
          },
          { key: 'indoorCapable',  label: 'Indoor venues?',  type: 'boolean', target: 'typeAttributes' },
          { key: 'outdoorCapable', label: 'Outdoor venues?', type: 'boolean', target: 'typeAttributes' },
          { key: 'largestEventHandledPax', label: 'Largest event handled (guests)', type: 'number', target: 'typeAttributes', placeholder: '500' },
          { key: 'crewSizeDefault', label: 'Default crew size', type: 'number', target: 'typeAttributes', placeholder: '4' },
        ],
      },
      { key: 'coverage', title: 'Service area', fields: COMMON_COVERAGE_FIELDS },
      {
        key: 'kyc',
        title: 'KYC documents',
        fields: [
          { key: 'aadhaar', label: 'Aadhaar', type: 'kyc-doc', documentType: 'AADHAAR', required: true },
          { key: 'pan',     label: 'PAN',     type: 'kyc-doc', documentType: 'PAN',     required: true },
          { key: 'gst',     label: 'GST (optional)', type: 'kyc-doc', documentType: 'GST',
            helpText: 'Required if your turnover crosses ₹20L.' },
          { key: 'insurance', label: 'Liability insurance (optional)', type: 'kyc-doc', documentType: 'INSURANCE',
            helpText: 'Recommended for jobs with electricals or heavy props.' },
        ],
      },
    ],
  },

  // ────────────────── STAFF_HIRE ──────────────────────────
  STAFF_HIRE: {
    serviceType: 'STAFF_HIRE',
    displayName: 'Staff Agency',
    hero: { emoji: '🧑‍🍳', tagline: 'Supply waiters, bartenders, cooks for events' },
    pricingPattern: 'PER_TIME_BLOCK',
    calendarMode: 'SLOT_GRAIN',
    defaultLeadTimeHours: 48,
    requiredKyc: ['AADHAAR', 'PAN', 'POLICE_VERIFICATION'],
    steps: [
      { key: 'business', title: 'About your agency', fields: COMMON_BUSINESS_FIELDS },
      {
        key: 'roster',
        title: 'Roster & capabilities',
        fields: [
          {
            key: 'agencyType', label: 'Agency type', type: 'select', target: 'typeAttributes', required: true,
            options: [
              { value: 'INDIVIDUAL_FREELANCER', label: 'Solo freelancer' },
              { value: 'SMALL_AGENCY',          label: 'Small agency (2-10 staff)' },
              { value: 'LARGE_AGENCY',          label: 'Large agency (10+ staff)' },
            ],
          },
          {
            key: 'rolesOffered', label: 'Roles you supply', type: 'multiselect', target: 'typeAttributes', required: true,
            options: ['WAITER','BARTENDER','SERVER','KITCHEN_HELPER','HOSTESS','VALET','SECURITY','CLEANER','DJ_ASSISTANT','PHOTOGRAPHER_ASSISTANT']
              .map(v => ({ value: v, label: v.replace(/_/g, ' ').toLowerCase() })),
          },
          { key: 'minCountPerBooking', label: 'Minimum staff per booking', type: 'number', target: 'typeAttributes', placeholder: '2' },
          { key: 'maxCountPerBooking', label: 'Maximum staff per booking', type: 'number', target: 'typeAttributes', placeholder: '20' },
          { key: 'experienceYearsAvg', label: 'Average experience of your staff (years)', type: 'number', target: 'typeAttributes', placeholder: '3' },
          { key: 'uniformProvided', label: 'Uniform provided?', type: 'boolean', target: 'typeAttributes' },
          {
            key: 'languagesSpoken', label: 'Languages your staff speak', type: 'multiselect', target: 'typeAttributes',
            options: ['HINDI','ENGLISH','TAMIL','BENGALI','MARATHI','GUJARATI','TELUGU','KANNADA','PUNJABI']
              .map(v => ({ value: v, label: v })),
          },
          {
            key: 'dressCodesSupported', label: 'Dress codes supported', type: 'multiselect', target: 'typeAttributes',
            options: [
              { value: 'FORMAL_BLACK', label: 'Formal black' },
              { value: 'SAREE',        label: 'Saree' },
              { value: 'KURTA',        label: 'Kurta' },
              { value: 'EVENT_THEME',  label: 'Event-theme (custom)' },
            ],
          },
        ],
      },
      { key: 'coverage', title: 'Service area', fields: COMMON_COVERAGE_FIELDS },
      {
        key: 'kyc',
        title: 'KYC documents',
        description: 'Police verification is mandatory because staff enter customer homes. Get it from your local police station.',
        fields: [
          { key: 'aadhaar', label: 'Aadhaar', type: 'kyc-doc', documentType: 'AADHAAR', required: true },
          { key: 'pan',     label: 'PAN',     type: 'kyc-doc', documentType: 'PAN',     required: true },
          { key: 'police',  label: 'Police verification certificate', type: 'kyc-doc', documentType: 'POLICE_VERIFICATION', required: true,
            helpText: 'Required. Cover all staff in your roster.' },
          { key: 'gst',     label: 'GST (if applicable)', type: 'kyc-doc', documentType: 'GST' },
        ],
      },
    ],
  },
};
