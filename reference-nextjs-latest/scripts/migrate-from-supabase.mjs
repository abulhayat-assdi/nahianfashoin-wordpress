import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migration শুরু হচ্ছে...\n');

  // 1. Brand Story
  await prisma.brandStory.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      eyebrow: 'A LEGACY OF 90 YEARS',
      title: 'Our Story',
      body: "I started VAHDAM® India with a vision to make available India's finest teas, spices & herbs - sourced direct from farmers, packaged fresh at origin and delivered to consumers globally without unnecessary middlemen. A process which helps retain value at source and ensures farmers get a better price for their produce in the long run.",
      body2: "And just in case you were wondering, VAHDAM is the reverse anagram of my father's first name 'MADHAV'.",
      cta_text: 'READ OUR ENTIRE STORY',
      founder_name: 'Md. Nesar Uddin',
      founder_title: 'Tea Master',
      founder_signature: '/uploads/signature-1778037784153.png',
      founder_image: '/uploads/1778037786507-133733792.png',
      care_eyebrow: '',
      care_title: '',
      impact1_title: "Education our Farmers' Children  1% of revenue is directed towards the education of our farmers' children in India",
      impact1_body: '',
      impact2_title: 'Climate & Plastic Neutral  We offset our entire carbon footprint via Investments in renewable energy. Additionally, we recover & recycle an amount of plastic equivalent to our packaging',
      impact2_body: '',
      impact3_title: 'Certified for social and environmental performance  We meets high standards of social and environmental impact.',
      impact3_body: '',
      farmers_image: '/uploads/1778038362917-125667092.webp',
    },
  });
  console.log('✓ brand_story');

  // 2. Categories
  await prisma.category.upsert({
    where: { id: '926c6de6-826f-4db6-b594-4ac4e72a62a0' },
    update: {},
    create: {
      id: '926c6de6-826f-4db6-b594-4ac4e72a62a0',
      name: 'Black Tea',
      slug: 'black-tea',
      image_url: '/uploads/1778219048262-252112627.jpeg',
      is_active: true,
      display_order: 1,
      created_at: new Date('2026-05-08T05:44:11.917307+00:00'),
    },
  });
  console.log('✓ categories (1 row)');

  // 3. Customers
  await prisma.customer.upsert({
    where: { id: '6159fbab-287e-4daf-994e-7ac6dc454fca' },
    update: {},
    create: {
      id: '6159fbab-287e-4daf-994e-7ac6dc454fca',
      name: 'Maruf',
      email: 'mnumaruf@gmail.com',
      phone: '',
      address: null,
      role: 'super_admin',
      created_at: new Date('2026-05-07T04:54:12.685665+00:00'),
    },
  });

  await prisma.customer.upsert({
    where: { id: '366a6215-cd72-4d8c-8823-b7e0eccc29ad' },
    update: {},
    create: {
      id: '366a6215-cd72-4d8c-8823-b7e0eccc29ad',
      name: 'Abul Hayat',
      email: 'mohammadabulhayatt@gmail.com',
      phone: '01862534626',
      address: 'Feni',
      role: 'super_admin',
      created_at: new Date('2026-05-05T02:16:49.98372+00:00'),
    },
  });
  console.log('✓ customers (2 rows)');

  // 4. Home Config
  await prisma.homeConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      banners: [{ id: '1', title: 'Hero ', image_url: '/uploads/1778197872712-785354180.jpeg' }],
      ticker_items: ['1 Thousand+ Customers', '500+ 4.9 Star Ratings'],
      data: null,
      updated_at: new Date('2026-05-07T23:51:14.726+00:00'),
    },
  });
  console.log('✓ home_config');

  // 5. Footer Config
  await prisma.footerConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      columns: [
        { id: '1', heading: 'Learn', links: [{ label: 'Blog' }] },
        { id: '2', heading: 'Shop', links: [{ label: 'Flower Tea' }, { label: 'Green Tea' }, { label: 'Black Tea' }, { label: 'Matcha' }] },
        { id: '3', heading: 'Support', links: [{ label: 'Returns & Exchanges' }, { label: 'Bulk Order' }] },
        { id: '4', heading: 'My Account', links: [{ label: 'Account' }, { label: 'Orders' }] },
      ],
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      social: 'Show Us Some Love On',
      ticker: null,
    },
  });
  console.log('✓ footer_config');

  // 6. Products
  await prisma.product.upsert({
    where: { id: 'd82f5e3b-6af5-4975-8ed4-8559cfef6dab' },
    update: {},
    create: {
      id: 'd82f5e3b-6af5-4975-8ed4-8559cfef6dab',
      slug: 'sample-product',
      name: 'Sample Product',
      detail: '150 Cups',
      description: '🎁 ফ্রি গ্রিন টি (২৫ কাপ) এবং 🚚 ডেলিভারি চার্জ 🔰 মোট সাশ্রয় ৩০০৳\n\nসুরমা ভ্যালি ক্লাসিক চা\n\nঝরঝরে দানাদার চা পাতা—নাকের কাছে নিলেই সতেজ চায়ের ঘ্রাণ। ✨\n\nআমাদের উদ্যোক্তা একজন সার্টিফাইড টি মাস্টার, বহু বছরের অভিজ্ঞতায় বাছাই করা চা পাতা দিয়ে তৈরি এই চা।\n\nদুধ চায়ের জন্য আদর্শ—\nঅল্প পাতায় কড়া লিকার মনকাড়া স্বাদ ও সুগন্ধ, তাই প্রতিদিনের চায়ে সাশ্রয়ী।\n\n🌿 কোনো কৃত্রিম রং বা ফ্লেভার নেই।\n\n🇧🇩 সারাদেশে হোম ডেলিভারি।\n\n👉 এখনই অর্ডার করুন।',
      price: '930',
      original_price: '',
      discount: '',
      per_cup_price: '',
      packaging: '',
      media_urls: [
        '/uploads/1778197690507-372073556.webp',
        '/uploads/1778197690346-368853964.webp',
        '/uploads/1778197690424-203156326.webp',
      ],
      category: 'Black Tea',
      is_available: true,
      is_featured: false,
      is_gift: true,
      faqs: [],
      steeping: {
        enabled: false,
        hot_brew: [
          { id: '1', step: 'Step 1', text: 'Place 1 Tea Spoon Leaves in a Cup or Tea Pot', iconType: 'cup-spoon' },
          { id: '2', step: 'Step 2', text: '200 ml Freshly Boiled Water over the Leaves', iconType: 'pour' },
          { id: '3', step: 'Step 3', text: 'Water Temperature - 194°F-212°F | 90°C-100°C', iconType: 'thermo' },
          { id: '4', step: 'Step 4', text: 'Brew for 3-5 mins & Strain the Leaves', iconType: 'teapot' },
          { id: '5', step: 'Step 5', text: 'Can be served with or without milk & sugar', iconType: 'milk' },
        ],
        iced_brew: [
          { id: '1', step: 'Step 1', text: 'For Iced Tea, use 2 Tea Spoons & Brew for 5 mins', iconType: 'iced-spoon' },
          { id: '2', step: 'Step 2', text: 'Refrigerate for 3-4 hours. Add ice cubes & sweetener', iconType: 'iced-drink' },
        ],
        image_url: 'https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=1200&auto=format&fit=crop',
      },
      created_at: new Date('2026-05-07T23:48:21.48277+00:00'),
    },
  });
  console.log('✓ products (1 row)');

  console.log('\n✅ Migration সফলভাবে শেষ হয়েছে!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
