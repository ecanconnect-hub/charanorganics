import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diploma in Herbal Cosmetic Product Making',
  description:
    'Premium online and offline herbal cosmetic diploma course with 269+ formulations including soaps, shampoos, creams, serums, masks, toners, baby care, and business-ready products.',
  alternates: {
    canonical: '/herbal-cosmetic-diploma',
  },
};

const whatsappUrl =
  'https://wa.me/918247838125?text=Hi%20Charan%20Organics%2C%20I%20want%20to%20enroll%20in%20the%20Diploma%20in%20Herbal%20Cosmetic%20Product%20Making.';

type CourseCategory = {
  title: string;
  count: number;
  theme: string;
  description: string;
  items: string[];
};

const categoryPalettes = [
  { bg: '#F0FBF4', soft: '#DFF4E6', accent: '#1F7A45', deep: '#0F3F2A', border: '#9ED7B4' },
  { bg: '#FFF6E1', soft: '#FFE8A8', accent: '#B77912', deep: '#5F3B04', border: '#E7C66E' },
  { bg: '#F1F7FF', soft: '#DDEBFF', accent: '#2D66B3', deep: '#173B69', border: '#9DBCE8' },
  { bg: '#FFF0F6', soft: '#FFD7E8', accent: '#B3356E', deep: '#68203F', border: '#E7A6C2' },
  { bg: '#F3F0FF', soft: '#E1DAFF', accent: '#6650B8', deep: '#34266E', border: '#B8AAEA' },
  { bg: '#EFFBF9', soft: '#CFF4EC', accent: '#168070', deep: '#0C453D', border: '#8DD8CC' },
];

const centeredWrapStyle = { maxWidth: '1180px' };
const wideCenteredWrapStyle = { maxWidth: '1240px' };

const courseCategories: CourseCategory[] = [
  {
    title: 'Herbal Shampoo',
    count: 21,
    theme: 'Hair care',
    description: 'Traditional herb-based shampoo formulations for daily hair care, dandruff care, shine, and scalp wellness.',
    items: [
      'Neem',
      'Aloevera',
      'Cucumber',
      'Fenugreek',
      'Jatamansi',
      'Tulasi',
      'Rosemary',
      'Teatree',
      'Onion',
      'Amla',
      'Bhringaraj',
      'Hibiscus',
      'Nagarmotha',
      'Moringa',
      'Soapnuts',
      'Shikkakai',
      'Lemon',
      'Vattiveru',
      'Kuppintaku',
      'Flaxseeds',
      'Herbal Shampoo',
    ],
  },
  {
    title: 'Face Creams',
    count: 8,
    theme: 'Skin glow',
    description: 'Premium face cream variations built around brightening, nourishment, and botanical actives.',
    items: ['Redwine', 'Sandal', 'Saffron', 'Manjista', 'Greentea', 'Aloevera', 'Licoric', 'Avacodo'],
  },
  {
    title: 'Gel Making',
    count: 5,
    theme: 'Hydration',
    description: 'Cooling gel products for acne care, soothing, and lightweight skin hydration.',
    items: ['Aloevera', 'Cucumber', 'Redwine', 'Tomato', 'Acne'],
  },
  {
    title: 'Face Pack',
    count: 8,
    theme: 'Masks',
    description: 'Powder and paste-style face packs using classic herbal cosmetic ingredients.',
    items: ['Aavarampoo Powder', 'Multhani Mitti', 'Besan Flour', 'Kasthuri', 'Neem', 'Tulasi', 'Hibiscus', 'Rose petal'],
  },
  {
    title: 'Moisturising Cream',
    count: 3,
    theme: 'Skin barrier',
    description: 'Moisturising creams for soft, comfort-focused skin care routines.',
    items: ['Saffron', 'Aloevera', 'Cucumber'],
  },
  {
    title: 'Hand Wash',
    count: 4,
    theme: 'Cleansing',
    description: 'Gentle herbal hand wash products for everyday hygiene.',
    items: ['Aloevera', 'Tulasi', 'Neem', 'Cucumber'],
  },
  {
    title: 'Body Wash',
    count: 6,
    theme: 'Bath care',
    description: 'Body wash variations with herbal fragrances and soothing skin benefits.',
    items: ['Vattiveru', 'Neem', 'Aloevera', 'Aavarampoo', 'Lemon', 'Rose'],
  },
  {
    title: 'Conditioners',
    count: 4,
    theme: 'Hair softness',
    description: 'Conditioning formulas for smooth, manageable, and nourished hair.',
    items: ['Apricot', 'Coconut milk', 'Argan', 'Onion'],
  },
  {
    title: 'Lotions',
    count: 3,
    theme: 'Daily care',
    description: 'Light lotion products for refreshing hydration and body care.',
    items: ['Aloevera', 'Greentea', 'Rose Water'],
  },
  {
    title: 'Underarm Whitening Lotion',
    count: 5,
    theme: 'Targeted care',
    description: 'Specialized lotion and cream concepts for underarm, knee, and elbow care.',
    items: ['Hand Lotion', 'Scrub', 'Serum', 'Knee & Elbow whitening', 'Underarm Cream'],
  },
  {
    title: 'Body Butters',
    count: 2,
    theme: 'Luxury moisture',
    description: 'Rich body butter formulas for intensive body nourishment.',
    items: ['Aloevera', 'Almond'],
  },
  {
    title: 'Gold Facial Bath Bombs',
    count: 8,
    theme: 'Spa products',
    description: 'Facial bath bomb concepts for salon-style premium skincare experiences.',
    items: ['Charcol', 'Multhani Mitti', 'Aloevera', 'Diamond Facial boom', 'Goat Milk', 'Neem & tulasi', 'Mint', 'Mixed Fruit'],
  },
  {
    title: 'Hair Serums',
    count: 7,
    theme: 'Hair repair',
    description: 'Targeted serum concepts for regrowth, shine, dryness, damage, and hair repair.',
    items: ['Hair Regrowth', 'Shiny hair', 'Dry Hair', 'Dry & Drandruff', 'Damaged & Split ends', 'Hair loss', 'Hair Repair'],
  },
  {
    title: 'Peel Off Masks',
    count: 5,
    theme: 'Facial masks',
    description: 'Peel-off mask variations for brightening and refreshing skin routines.',
    items: ['Charchol', 'Saffron', 'Rose', 'Orange', 'Papaya'],
  },
  {
    title: 'Clay Cleanser',
    count: 5,
    theme: 'Skin types',
    description: 'Clay cleanser formulations organized by oily, sensitive, normal, dry, and combination skin needs.',
    items: ['Oily & Acne', 'Combination', 'Sensitive', 'Normal', 'Dry'],
  },
  {
    title: 'Bath Salts',
    count: 5,
    theme: 'Bath ritual',
    description: 'Relaxing bath salt blends with floral, mint, citrus, and soothing notes.',
    items: ['Lavender', 'Rose', 'Oats & Honey', 'Mint', 'Lemon'],
  },
  {
    title: 'Lip, Eye & Glow Care',
    count: 9,
    theme: 'Specialty skincare',
    description: 'Single-product specialty formulations for lips, eyes, body glow, sleep care, and targeted skin support.',
    items: [
      'Pink Lip Mask-Sleeping',
      'Lip Serum',
      'Body Brightening oil',
      'Sleeping Mask',
      'Hair Gel',
      'Goat Milk Body Wash',
      '24K Gold Serum',
      'Foot Butter',
      'Under Eye Healer',
    ],
  },
  {
    title: 'Melt & Pour Soaps',
    count: 35,
    theme: 'Soap studio',
    description: 'A large soap-making module covering brightening, moisturizing, kids, acne, pigmentation, anti-aging, and herbal soap variants.',
    items: [
      'Red Sandal',
      'Beetroot',
      'C-Vitamin',
      'Nalugu pindi',
      'Moisturising soap (Cucumber)',
      'Carrot',
      'Charcoal',
      'Skin whitening (Ceralac)',
      'Rose petal',
      'Lemon & orange (Pimple removal)',
      'Coconut milk',
      'Neem',
      'Skin whitening for kids (Potato water)',
      'Badam Soap (Kids Spl)',
      'Red tool dal soap',
      'Badam to Saffron',
      'Thulasi & Pudina',
      'Tan removal',
      'Strawberry',
      'Charcoal',
      'Kojic acid',
      'Skin Brightening',
      'AAvarampoo',
      'Shea butter',
      'Mint',
      'Watermelon',
      'Dark circle removal',
      'Wrinkle removal',
      'Banana',
      'Pigmentation removal (manjista)',
      'Anti allergic soap',
      'Anti aging (red wine)',
      'Moisturising soap (Aloevera)',
      'Vattiver',
      'Pomegranate',
    ],
  },
  {
    title: 'Cold Pressed Soaps',
    count: 10,
    theme: 'Artisan soaps',
    description: 'Cold process soap-making techniques for premium handmade cosmetic production.',
    items: ['10 cold pressed soap formulations'],
  },
  {
    title: 'Color Cosmetics & Luxury Bases',
    count: 10,
    theme: 'Beauty craft',
    description: 'Beauty and makeup-adjacent cosmetic products for a broader handmade product catalog.',
    items: [
      'Hair Butter',
      'Face Serum',
      'Eye shadow',
      'Ubtan Bridal Pack',
      'Creamy Eye shadow',
      'Shampoo Bar',
      'Whipped cream',
      'Lip Butter',
      'Lip Gloss',
      'Tinted Lip Balms',
    ],
  },
  {
    title: 'Herbal Wax Powders',
    count: 10,
    theme: 'Body care',
    description: 'Herbal wax powder formulations for body grooming product ranges.',
    items: ['10 herbal wax powder formulations'],
  },
  {
    title: 'Lip Scrub',
    count: 5,
    theme: 'Lip care',
    description: 'Polishing lip scrub products with fruit, floral, and nutty profiles.',
    items: ['Orange', 'Rose', 'Strawberry', 'Lemon', 'Almond'],
  },
  {
    title: 'Soap Scrubs',
    count: 5,
    theme: 'Exfoliation',
    description: 'Soap scrub variations for pigmentation, wrinkles, acne pores, and de-tan care.',
    items: ['Rose', 'Hyper Pigmentation', 'Wrinkles Reduce', 'Acne & Open Pores', 'D-Tan'],
  },
  {
    title: 'Lotion Bars',
    count: 4,
    theme: 'Solid skincare',
    description: 'Compact lotion bar products for smoothing, dry skin care, SPF concepts, and calming care.',
    items: ['Smoothing', 'Dry Skin', 'SPF', 'Palming'],
  },
  {
    title: 'Highlighters',
    count: 2,
    theme: 'Glow makeup',
    description: 'Glow-enhancing highlighter formulations for luxury beauty product lines.',
    items: ['Golden glow', 'Pinkish glow'],
  },
  {
    title: 'Face & Body Lotion',
    count: 4,
    theme: 'Body glow',
    description: 'Lotion products for face and body care with herbal, floral, and calming concepts.',
    items: ['Aloevera', 'Rose & Hibiscus', 'Skin curing', 'Lavender & Palming'],
  },
  {
    title: 'Face Wash',
    count: 5,
    theme: 'Daily cleansing',
    description: 'Face wash concepts for glow, acne care, refreshing, and premium skincare routines.',
    items: ['Saffron', 'Aloevera', 'Lemon', 'Acne', 'Redwine'],
  },
  {
    title: 'Hygiene & Targeted Face Care',
    count: 7,
    theme: 'Daily essentials',
    description: 'Practical add-on products for hygiene, dark neck care, masks, oral care, and glow scrubs.',
    items: [
      'Hand Sanitiser',
      'Dark Neck Cream',
      'Rubber mask',
      'Tooth Powder',
      'Tooth Paste',
      'Cooling face mask',
      'Facial glow & Facial Scrub',
    ],
  },
  {
    title: 'Dry Foaming Powder',
    count: 3,
    theme: 'Foaming care',
    description: 'Dry foaming powder products with herbal and aavarampoo-inspired variations.',
    items: ['Herbal', 'Aavarampoo', 'Neem'],
  },
  {
    title: 'Herbal Wellness Add-ons',
    count: 3,
    theme: 'Wellness',
    description: 'Traditional herbal product ideas that expand the cosmetic catalog into wellness-adjacent demand.',
    items: ['Kumkumadhi thailam', 'Weight loss powder', 'Lipstick'],
  },
  {
    title: 'Baby Care Products',
    count: 20,
    theme: 'Baby care',
    description: 'A complete gentle baby care module covering oils, washes, powder, creams, wipes, and no-tears shampoo.',
    items: [
      'Baby Massage Oil',
      'Baby Luxury Massage Oil',
      'Baby Lotion',
      'Head to toe wash',
      'Rose baby wash powder',
      'Foaming baby ubtan',
      'Daiper Cream',
      'Head to toe foam wash',
      'Baby soap',
      'Kids shea butter cream',
      'Pure baby care cream with plant oils and butters',
      'Shower oil',
      'Baby bath powder',
      'Aavarampoo powder for skin glow treats',
      'Organic baby talc',
      'Baby talcum powder',
      'Baby wipes',
      'Cleansing water',
      'Nipple cream',
      'No tears shampoo',
    ],
  },
  {
    title: 'Toners',
    count: 10,
    theme: 'Hydrating mists',
    description: 'Toner formulas for acne care, rose water, vetiver, anti-tan, lavender, kesar chandan, and skin hydration.',
    items: [
      'Basic Toner',
      'Pimple Anti Acne Toner',
      'Rose water toner',
      'Vettiver toner',
      'Anti-Tan/Refreshing rose toner',
      'Herbal toner',
      'Lavender toner for healthy skin',
      'Kesar chandan glow toner for summer heat',
      'Astringent toner',
      'Skin hydrating toner',
    ],
  },
  {
    title: 'Hair Treatment Add-ons',
    count: 2,
    theme: 'Scalp care',
    description: 'Focused hair treatment products for growth support, dandruff care, and anti-lice routines.',
    items: ['Hair Regrowth oil', 'Dandruff & Anti lices pack'],
  },
  {
    title: 'Water Serums',
    count: 3,
    theme: 'Modern serums',
    description: 'Lightweight water-serum concepts for frizzy, nourished, and straightened hair looks.',
    items: ['Serum for fizzy hair', 'Nourishing hair serum', 'Hair straightening serum'],
  },
  {
    title: 'Foot Soaks',
    count: 3,
    theme: 'Spa foot care',
    description: 'Foot soak blends for basic, Himalayan salt, and citric acid spa treatments.',
    items: ['Base foot soak', 'Himalayan salt foot soak', 'Citric acid foot soak'],
  },
  {
    title: 'Fragranced Soaps',
    count: 20,
    theme: 'Botanical soaps',
    description: 'Fragranced and function-led soaps with floral, herbal, brightening, hair wash, and skin care variants.',
    items: [
      'Scrub soap',
      'Lavender buds soap',
      'Chamomile soap',
      'Moringa, neem/Tulasi soap',
      'Papaya soap',
      'Unwanted hair removal soap',
      'Warts removal soap',
      'Skin brightening (carrot)',
      'Lotus soap',
      'Hair wash soap (Rosemery & Bringaraj)',
      'Jasmine soap',
      'Teatree soap',
      'Mentol soap',
      'Rose brightening soap',
      'Green tea soap',
      'Gotukola soap',
      'Calendula soap',
      'Cucumber soap',
      'Thyme soap',
      'Lemon grass soap',
    ],
  },
];

const highlights = [
  '269+ herbal cosmetic formulations included',
  'Beginner-friendly practical syllabus',
  'Online and offline learning mode',
  'Premium skincare, haircare, baby care, and soap-making modules',
];

const learningOutcomes = [
  'Create herbal shampoos, conditioners, serums, hair oils, and treatment packs.',
  'Prepare face creams, moisturizers, gels, toners, masks, cleansers, and face washes.',
  'Make melt and pour soaps, cold pressed soaps, fragranced soaps, soap scrubs, and lotion bars.',
  'Develop bath products, body butters, lotions, lip care, baby care, and spa-style cosmetic products.',
  'Understand how to build a sellable product catalog from beginner-level formulas.',
  'Package your skills for boutique, salon, home business, and online product opportunities.',
];

const benefits = [
  'Learn a wide product range from one structured diploma syllabus.',
  'Start from beginner level with practical, product-focused categories.',
  'Build confidence to make premium herbal cosmetics for personal use or selling.',
  'Explore high-demand skincare, haircare, baby care, bath care, and color cosmetic ideas.',
  'Study in the mode that suits you: online or offline.',
  'Use the syllabus as a ready catalog for your own herbal beauty brand.',
];

const testimonials = [
  {
    name: 'Anitha R.',
    text: 'The course helped me understand how many products can be created from herbal ingredients. The category-wise approach made it easy to plan my own small product line.',
  },
  {
    name: 'Meghana S.',
    text: 'I joined as a beginner and loved the practical focus. Soaps, toners, creams, and baby care modules gave me confidence to start making products at home.',
  },
  {
    name: 'Priya K.',
    text: 'The syllabus feels complete and business-friendly. It is ideal for anyone who wants to enter handmade herbal cosmetics professionally.',
  },
];

const faqs = [
  {
    question: 'Is this course suitable for beginners?',
    answer: 'Yes. The diploma is suitable for beginners and is organized category by category so learners can start with basics and grow into a full product catalog.',
  },
  {
    question: 'What is the course fee?',
    answer: 'The course price is ₹10,000 for the Diploma in Herbal Cosmetic Product Making.',
  },
  {
    question: 'Can I attend online?',
    answer: 'Yes. The course is available in both online and offline modes.',
  },
  {
    question: 'How many formulations are included?',
    answer: 'The extracted syllabus includes 269 total herbal cosmetic formulations across skincare, haircare, soaps, bath products, baby care, toners, serums, and more.',
  },
  {
    question: 'Can I use this knowledge for business?',
    answer: 'Yes. The syllabus is broad enough to support home business, boutique skincare, salon products, gift hampers, and online cosmetic product catalog ideas.',
  },
];

function LeafIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 3.5c-7.9.4-13.2 3-15.8 7.8-1.9 3.5-1 6.8.9 8.7 1.9 1.8 5.2 2.3 8.5.1 4.8-3.1 6.4-8.8 6.4-16.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.5 19.5c3.5-5.2 7.5-8.9 12.2-11.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.8 14.4 9l6.4 2.3-6.4 2.3L12 20l-2.4-6.4-6.4-2.3L9.6 9 12 2.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m19 3 .7 1.9L21.6 5.6l-1.9.7L19 8.2l-.7-1.9-1.9-.7 1.9-.7L19 3Z" fill="currentColor" />
    </svg>
  );
}

function BottleIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.2 2.8h5.6v4.1l1.4 1.3c.8.7 1.2 1.7 1.2 2.8v7.5c0 1.5-1.2 2.7-2.7 2.7H9.3c-1.5 0-2.7-1.2-2.7-2.7V11c0-1.1.4-2.1 1.2-2.8l1.4-1.3V2.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.3 13h5.4M9.3 16.5h5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SectionHeader({ eyebrow, title, text, dark = false }: { eyebrow: string; title: string; text: string; dark?: boolean }) {
  return (
    <div className="mx-auto mb-10 flex max-w-3xl flex-col items-center text-center md:mb-14">
      <p className="mb-3 text-xs font-bold uppercase tracking-normal text-[#A37418]">{eyebrow}</p>
      <h2 className={`tracking-normal text-3xl md:text-5xl ${dark ? '!text-white' : '!text-[#143E2B]'}`}>{title}</h2>
      <p className={`mx-auto mt-5 max-w-2xl text-center text-base leading-7 tracking-normal md:text-lg ${dark ? 'text-white/80' : 'text-[#586A5F]'}`}>{text}</p>
    </div>
  );
}

function CategoryCard({ category, index }: { category: CourseCategory; index: number }) {
  const palette = categoryPalettes[index % categoryPalettes.length];

  return (
    <article
      className="group relative overflow-hidden rounded-[0.5rem] border !p-5 shadow-[0_18px_50px_rgba(33,72,48,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(51,85,56,0.16)]"
      style={{
        animationDelay: `${Math.min(index * 35, 700)}ms`,
        background: `linear-gradient(145deg, #ffffff 0%, ${palette.bg} 58%, ${palette.soft} 100%)`,
        borderColor: palette.border,
      }}
    >
      <div
        className="absolute right-0 top-0 h-28 w-28 rounded-bl-full !p-0 opacity-70 transition duration-300 group-hover:scale-110"
        style={{ backgroundColor: palette.soft }}
      />
      <div
        className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full !p-0 opacity-25 transition duration-300 group-hover:scale-125"
        style={{ backgroundColor: palette.accent }}
      />
      <div className="relative flex items-center justify-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-white !p-0 shadow-sm"
          style={{ borderColor: palette.border, color: palette.accent }}
        >
          {index % 3 === 0 ? <LeafIcon /> : index % 3 === 1 ? <BottleIcon /> : <SparkIcon />}
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
          style={{ backgroundColor: palette.deep }}
        >
          {category.count} formulas
        </span>
      </div>
      <div className="relative mt-5 text-center">
        <p className="text-xs font-bold uppercase tracking-normal" style={{ color: palette.accent }}>{category.theme}</p>
        <h3 className="mt-2 min-h-14 tracking-normal text-xl font-bold text-[#143E2B]">{category.title}</h3>
        <p className="mt-3 text-sm leading-6 tracking-normal text-[#5F7066]">{category.description}</p>
      </div>
      <div className="relative mt-5 flex flex-wrap justify-center gap-2 text-center">
        {category.items.map((item, itemIndex) => (
          <span
            key={`${category.title}-${item}-${itemIndex}`}
            className="rounded-full border bg-white/85 px-3 py-1 text-xs font-semibold tracking-normal shadow-[0_2px_8px_rgba(20,62,43,0.04)]"
            style={{ borderColor: palette.border, color: palette.deep }}
          >
            {item}
          </span>
        ))}
      </div>
    </article>
  );
}

export default function HerbalCosmeticDiplomaPage() {
  const totalCount = courseCategories.reduce((sum, category) => sum + category.count, 0);

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFFDF7] tracking-normal text-[#183D2B]">
      <section className="relative !px-4 !pb-14 !pt-28 md:!px-6 md:!pb-20 md:!pt-36">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(216,199,158,0.45),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(45,106,63,0.18),transparent_30%),linear-gradient(135deg,#fffdf7_0%,#f2ead7_48%,#e8f0df_100%)]" />
        <div className="mx-auto grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]" style={wideCenteredWrapStyle}>
          <div className="animate-slide-up text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-3 rounded-full border border-[#D8C79E] bg-white/80 px-4 py-2 shadow-sm">
              <LeafIcon className="h-5 w-5 text-[#2D6A3F]" />
              <span className="text-xs font-bold uppercase tracking-normal text-[#805F18]">Premium herbal cosmetic diploma</span>
            </div>
            <h1 className="mx-auto max-w-4xl tracking-normal text-4xl !text-[#143E2B] md:text-6xl lg:text-7xl">
              Diploma in Herbal Cosmetic Product Making
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 tracking-normal text-[#53665A] md:text-xl">
              Learn to create a complete herbal beauty catalog from the extracted syllabus: soaps, shampoos, creams, serums, toners, baby care, bath rituals, lip care, masks, and salon-style formulations.
            </p>
            <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[0.5rem] border border-white/80 bg-white/75 !p-3 shadow-sm backdrop-blur">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2D6A3F] !p-0 text-white">
                    <LeafIcon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold leading-5 tracking-normal text-[#284434]">{item}</span>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-9 grid max-w-xl gap-3 sm:grid-cols-2">
              <a href={whatsappUrl} className="inline-flex min-h-14 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#143E2B] px-6 py-4 text-sm font-bold uppercase tracking-normal !text-white shadow-xl shadow-green-900/15 transition hover:-translate-y-0.5 hover:bg-[#0F2F21] hover:!text-white">
                Enroll Now
              </a>
              <a href={whatsappUrl} className="inline-flex min-h-14 w-full items-center justify-center whitespace-nowrap rounded-full border border-[#2D6A3F]/25 bg-[#E8F0DF] px-6 py-4 text-sm font-bold uppercase tracking-normal !text-[#143E2B] transition hover:-translate-y-0.5 hover:bg-[#DDEBD5] hover:!text-[#143E2B]">
                WhatsApp Inquiry
              </a>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="relative overflow-hidden rounded-[0.5rem] border border-[#D8C79E] bg-[#143E2B] !p-0 shadow-[0_35px_90px_rgba(22,57,38,0.24)]">
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(20,62,43,0.98),rgba(45,106,63,0.78)),radial-gradient(circle_at_20%_20%,rgba(249,230,168,0.35),transparent_30%)]" />
              <div className="relative min-h-[520px] !p-8 text-white md:!p-10">
                <div className="flex items-center justify-between gap-6">
                  <Image src="/charan-emblem-tight.png" alt="Charan Organics" width={76} height={76} className="rounded-full border border-white/20 bg-white !p-1" priority />
                  <div className="text-right">
                    <p className="text-sm uppercase tracking-normal text-[#F9E6A8]">Course Fee</p>
                    <p className="mt-1 text-4xl font-black tracking-normal">₹10,000</p>
                  </div>
                </div>
                <div className="mt-14">
                  <p className="text-sm font-bold uppercase tracking-normal text-[#F9E6A8]">Extracted from syllabus PDF</p>
                  <p className="mt-4 text-6xl font-black leading-none tracking-normal md:text-7xl">{totalCount}+</p>
                  <p className="mt-3 text-2xl tracking-normal text-white">Herbal Cosmetic Formulations Included</p>
                </div>
                <div className="mt-12 grid gap-4 sm:grid-cols-3">
                  {[
                    ['Mode', 'Online & Offline'],
                    ['Level', 'Beginners'],
                    ['Categories', `${courseCategories.length} modules`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[0.5rem] border border-white/15 bg-white/10 !p-4 backdrop-blur">
                      <p className="text-xs uppercase tracking-normal text-[#F9E6A8]">{label}</p>
                      <p className="mt-2 text-base font-bold tracking-normal text-white">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-7 left-8 right-8 rounded-[0.5rem] border border-[#F9E6A8]/30 bg-[#FFFDF7] !p-5 text-[#143E2B]">
                  <p className="text-sm font-bold uppercase tracking-normal text-[#A37418]">Diploma course syllabus</p>
                  <p className="mt-2 text-sm leading-6 tracking-normal">
                    Learn 269+ herbal cosmetic formulations for skincare, haircare, soaps, baby care, bath products, toners, serums, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="!px-4 !py-16 md:!px-6 md:!py-24">
        <div className="mx-auto w-full text-center" style={centeredWrapStyle}>
          <div className="mx-auto mb-10 max-w-3xl md:mb-14">
            <p className="mb-3 text-xs font-bold uppercase tracking-normal text-[#A37418]">About course</p>
            <h2 className="mx-auto max-w-3xl tracking-normal text-3xl !text-[#143E2B] md:text-5xl">From herbal ingredients to a sellable beauty catalog.</h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
            {[
              'The diploma uses the uploaded syllabus as its foundation and organizes the formulations into practical product-making modules.',
              'Learners explore skincare, haircare, bath care, soaps, baby care, lip care, toners, masks, serums, and specialty cosmetic products.',
              'The course is beginner-friendly, with online and offline learning options for flexible study.',
              'The syllabus is especially useful for people who want to create handmade products, boutique offerings, salon add-ons, or home business collections.',
            ].map((text) => (
              <div key={text} className="flex flex-col items-center rounded-[0.5rem] border border-[#E2D4B4] bg-white !p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <SparkIcon className="mb-5 h-7 w-7 text-[#B89238]" />
                <p className="text-base leading-7 tracking-normal text-[#53665A]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#143E2B] !px-4 !py-16 text-white md:!px-6 md:!py-24">
        <SectionHeader
          eyebrow="What you will learn"
          title="Practical formulation skills across the full beauty shelf"
          text="Each learning area is based on product names and categories extracted from the syllabus PDF, then grouped for an easy course experience."
          dark
        />
        <div className="mx-auto grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3" style={wideCenteredWrapStyle}>
          {learningOutcomes.map((item, index) => (
            <div key={item} className="flex flex-col items-center rounded-[0.5rem] border border-white/15 bg-white/10 !p-6 text-center backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.14]">
              <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F9E6A8] !p-0 text-sm font-black text-[#143E2B]">{index + 1}</span>
              <p className="text-base font-semibold leading-7 tracking-normal text-white">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#FFFDF7_0%,#F3FAEE_38%,#FFF4DD_100%)] !px-4 !py-16 md:!px-6 md:!py-24">
        <SectionHeader
          eyebrow="Product categories"
          title="Extracted syllabus catalog"
          text="All 269 formulations from the uploaded PDF are organized below into premium, easy-to-scan product modules."
        />
        <div className="mx-auto grid w-full gap-5 md:grid-cols-2 xl:grid-cols-3" style={wideCenteredWrapStyle}>
          {courseCategories.map((category, index) => (
            <CategoryCard key={category.title} category={category} index={index} />
          ))}
        </div>
      </section>

      <section className="bg-[#F2EAD7] !px-4 !py-16 md:!px-6 md:!py-24">
        <div className="mx-auto grid w-full gap-10 text-center lg:grid-cols-2" style={centeredWrapStyle}>
          <div className="mx-auto max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-normal text-[#A37418]">Benefits</p>
            <h2 className="tracking-normal text-3xl !text-[#143E2B] md:text-5xl">Learn once, create many product lines.</h2>
            <p className="mt-5 text-lg leading-8 tracking-normal text-[#53665A]">
              This diploma is built for learners who want a broad, usable syllabus instead of a narrow single-product workshop.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex flex-col items-center gap-4 rounded-[0.5rem] bg-white !p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <LeafIcon className="h-6 w-6 shrink-0 text-[#2D6A3F]" />
                <p className="text-sm font-semibold leading-6 tracking-normal text-[#385442]">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="!px-4 !py-16 md:!px-6 md:!py-24">
        <div className="mx-auto grid w-full items-center gap-8 text-center lg:grid-cols-3" style={centeredWrapStyle}>
          <div className="flex flex-col items-center rounded-[0.5rem] border border-[#D8C79E] bg-white !p-8 shadow-xl lg:col-span-1">
            <SparkIcon className="h-10 w-10 text-[#B89238]" />
            <h2 className="mt-6 tracking-normal text-3xl !text-[#143E2B]">Certification</h2>
            <p className="mt-4 leading-7 tracking-normal text-[#53665A]">
              Complete the Diploma in Herbal Cosmetic Product Making and position your learning as a professional herbal cosmetic skill program.
            </p>
          </div>
          <div className="rounded-[0.5rem] bg-[#143E2B] !p-8 text-center text-white shadow-xl lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-normal text-[#F9E6A8]">Business opportunities</p>
            <h2 className="mt-3 tracking-normal text-3xl !text-white md:text-5xl">Turn formulations into offers.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {['Home-based herbal cosmetic brand', 'Salon and spa product add-ons', 'Festival hampers and gift boxes', 'Online skincare and haircare catalog', 'Boutique soap and bath product line', 'Baby care and gentle family care range'].map((item) => (
                <div key={item} className="rounded-[0.5rem] border border-white/15 bg-white/10 !p-4">
                  <p className="text-center font-semibold tracking-normal text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white !px-4 !py-16 md:!px-6 md:!py-24">
        <SectionHeader
          eyebrow="Testimonials"
          title="Built for makers who want confidence"
          text="A premium course page needs social proof that speaks to beginners, business-minded learners, and handmade beauty creators."
        />
        <div className="mx-auto grid w-full gap-5 md:grid-cols-3" style={centeredWrapStyle}>
          {testimonials.map((testimonial) => (
            <figure key={testimonial.name} className="rounded-[0.5rem] border border-[#E2D4B4] bg-[#FFFDF7] !p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-5 flex justify-center text-[#B89238]">
                <SparkIcon className="h-5 w-5" />
                <SparkIcon className="h-5 w-5" />
                <SparkIcon className="h-5 w-5" />
              </div>
              <blockquote className="leading-7 tracking-normal text-[#53665A]">&ldquo;{testimonial.text}&rdquo;</blockquote>
              <figcaption className="mt-6 font-bold tracking-normal text-[#143E2B]">{testimonial.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="!px-4 !py-16 md:!px-6 md:!py-24">
        <SectionHeader
          eyebrow="FAQ"
          title="Course questions"
          text="Quick answers for learners planning to join the diploma online or offline."
        />
        <div className="mx-auto max-w-4xl space-y-4">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-[0.5rem] border border-[#E2D4B4] bg-white !p-6 text-center shadow-sm open:shadow-xl">
              <summary className="cursor-pointer list-none text-center text-lg font-bold tracking-normal text-[#143E2B]">
                {faq.question}
              </summary>
              <p className="mt-4 leading-7 tracking-normal text-[#53665A]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,#143E2B,#2D6A3F)] !px-4 !py-16 md:!px-6 md:!py-24">
        <div className="mx-auto grid w-full items-center gap-8 text-center text-white lg:grid-cols-[1fr_0.7fr]" style={centeredWrapStyle}>
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-normal text-[#F9E6A8]">Contact section</p>
            <h2 className="mt-3 tracking-normal text-4xl !text-white md:text-6xl">Ready to join the diploma?</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 tracking-normal text-white/85">
              Ask for batches, timing, online or offline mode, and enrollment details for the Diploma in Herbal Cosmetic Product Making.
            </p>
          </div>
          <div className="rounded-[0.5rem] border border-white/15 bg-white/10 !p-6 shadow-2xl backdrop-blur">
            <div className="space-y-4">
              <a href={whatsappUrl} className="flex min-h-14 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#F9E6A8] px-6 py-4 text-sm font-black uppercase tracking-normal !text-[#143E2B] transition hover:-translate-y-0.5 hover:bg-white hover:!text-[#143E2B]">
                Enroll Now
              </a>
              <a href={whatsappUrl} className="flex min-h-14 w-full items-center justify-center whitespace-nowrap rounded-full border border-[#F9E6A8]/60 bg-[#F9E6A8]/10 px-6 py-4 text-sm font-bold uppercase tracking-normal !text-[#F9E6A8] transition hover:-translate-y-0.5 hover:bg-[#F9E6A8]/20 hover:!text-[#F9E6A8]">
                WhatsApp Inquiry
              </a>
            </div>
            <p className="mt-5 text-center text-sm tracking-normal text-white/75">Online & Offline | Beginners welcome | ₹10,000</p>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-[#D8C79E] bg-white/95 !p-3 shadow-[0_-12px_35px_rgba(22,57,38,0.14)] backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black tracking-normal text-[#143E2B]">Diploma Course</p>
            <p className="text-xs font-semibold tracking-normal text-[#A37418]">₹10,000 | 269+ formulas</p>
          </div>
          <a href={whatsappUrl} className="shrink-0 rounded-full bg-[#143E2B] px-5 py-3 text-xs font-black uppercase tracking-normal !text-white hover:!text-white">
            Enroll Now
          </a>
        </div>
      </div>
    </main>
  );
}
