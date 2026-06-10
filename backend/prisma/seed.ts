import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nir_db';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  // Simple SHA-256 hash for local dev admin
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data
  await prisma.variant.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.setting.deleteMany({});

  // 2. Create Admin
  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
      password_hash: hashPassword('nir@admin2024'),
      role: 'Super Admin',
    },
  });
  console.log('Created Admin:', admin.username);

  // 3. Create Settings
  const settings = await prisma.setting.create({
    data: {
      id: '1',
      business_name: 'Neralla Inti Ruchulu',
      whatsapp_number: '8247843466',
      free_shipping_limit: 999,
      shipping_charge: 80,
      address: 'Sector-2 MVP Colony, Visakhapatnam',
      business_hours: '9 AM - 9 PM',
    },
  });
  console.log('Created Settings:', settings.business_name);

  // 4. Create Categories
  const c1 = await prisma.category.create({ data: { name_en: 'Pickles', name_te: 'పచ్చళ్లు', order: 1 } });
  const c2 = await prisma.category.create({ data: { name_en: 'Powders', name_te: 'పొడులు', order: 2 } });
  const c3 = await prisma.category.create({ data: { name_en: 'Chutneys', name_te: 'చట్నీలు', order: 3 } });
  console.log('Created Categories');

  // 5. Create Products & Variants
  // Product 1: Avakaya
  await prisma.product.create({
    data: {
      categoryId: c1.id,
      name_en: 'Avakaya (Raw Mango Pickle)',
      name_te: 'అవకాయ',
      description_en: 'Traditional spicy Andhra raw mango pickle, sun-dried with sesame oil.',
      description_te: 'సాంప్రదాయ ఆంధ్ర ముతక మామిడికాయ పచ్చడి, నువ్వుల నూనెతో.',
      status: 'Available',
      label: 'Bestseller',
      inventory: 50,
      variants: {
        create: [
          { size: '250g', packaging: 'Bottle', variantPrice: 120, packagingCharge: 20 },
          { size: '500g', packaging: 'Bottle', variantPrice: 220, packagingCharge: 20 },
          { size: '1kg', packaging: 'Jar', variantPrice: 400, packagingCharge: 30 },
        ],
      },
    },
  });

  // Product 2: Gongura
  await prisma.product.create({
    data: {
      categoryId: c1.id,
      name_en: 'Gongura (Sorrel Leaves Pickle)',
      name_te: 'గోంగూర పచ్చడి',
      description_en: 'Sour and tangy sorrel leaves pickle — an Andhra classic.',
      description_te: 'పులుపు గోంగూర పచ్చడి — ఆంధ్ర సాంప్రదాయం.',
      status: 'Available',
      label: 'New Arrival',
      inventory: 30,
      variants: {
        create: [
          { size: '250g', packaging: 'Bottle', variantPrice: 130, packagingCharge: 20 },
          { size: '500g', packaging: 'Bottle', variantPrice: 240, packagingCharge: 20 },
        ],
      },
    },
  });

  // Product 3: Tomato Pickle
  await prisma.product.create({
    data: {
      categoryId: c1.id,
      name_en: 'Tomato Pickle',
      name_te: 'టమాట పచ్చడి',
      description_en: 'Sweet and tangy homemade tomato pickle with traditional spices.',
      description_te: 'తియ్యని మరియు పులుపైన ఇంట తయారు చేసిన టమాట పచ్చడి.',
      status: 'Available',
      inventory: 20,
      variants: {
        create: [
          { size: '250g', packaging: 'Bottle', variantPrice: 100, packagingCharge: 20 },
        ],
      },
    },
  });

  // Product 4: Kandi Podi
  await prisma.product.create({
    data: {
      categoryId: c2.id,
      name_en: 'Kandi Podi (Toor Dal Powder)',
      name_te: 'కంది పొడి',
      description_en: 'Aromatic toor dal powder, perfect with hot rice and ghee.',
      description_te: 'సుగంధ కంది పొడి, వేడి అన్నం మరియు నెయ్యితో చాలా రుచిగా ఉంటుంది.',
      status: 'Available',
      label: 'Bestseller',
      inventory: 40,
      variants: {
        create: [
          { size: '200g', packaging: 'Packet', variantPrice: 80, packagingCharge: 10 },
          { size: '500g', packaging: 'Packet', variantPrice: 180, packagingCharge: 10 },
        ],
      },
    },
  });

  // Product 5: Coconut Chutney Powder
  await prisma.product.create({
    data: {
      categoryId: c3.id,
      name_en: 'Coconut Chutney Powder',
      name_te: 'కొబ్బరి చట్నీ పొడి',
      description_en: 'Dry coconut chutney powder — just add water for instant chutney.',
      description_te: 'పొడి కొబ్బరి చట్నీ పొడి — నీళ్ళు కలిపితే వెంటనే చట్నీ తయారు.',
      status: 'Coming Soon',
      inventory: 0,
      variants: {
        create: [
          { size: '150g', packaging: 'Packet', variantPrice: 60, packagingCharge: 10 },
        ],
      },
    },
  });

  // Product 6: Nellore Chicken Pickle
  await prisma.product.create({
    data: {
      categoryId: c1.id,
      name_en: 'Nellore Chicken Pickle',
      name_te: 'నెల్లూరు చికెన్ పచ్చడి',
      description_en: 'Spicy boneless chicken pickle slow-cooked with Andhra spices.',
      description_te: 'ఆంధ్ర మసాలాతో నెమ్మదిగా వండిన కారమైన చికెన్ పచ్చడి.',
      status: 'Available',
      inventory: 15,
      variants: {
        create: [
          { size: '250g', packaging: 'Bottle', variantPrice: 299, packagingCharge: 25 },
          { size: '500g', packaging: 'Bottle', variantPrice: 549, packagingCharge: 25 },
        ],
      },
    },
  });

  console.log('Created Products & Variants');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
