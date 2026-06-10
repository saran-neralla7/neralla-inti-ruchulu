import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import crypto from 'crypto';

dotenv.config();

const app = express();

function getPoolerConnectionString(url: string): string {
  if (url.includes('db.tszdohiultzzvqhebwsq.supabase.co')) {
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@db\.tszdohiultzzvqhebwsq\.supabase\.co:5432\/(.+)/);
    if (match) {
      const [, user, password, db] = match;
      const formatted = `postgresql://${user}.tszdohiultzzvqhebwsq:${password}@aws-1-ap-northeast-1.pooler.supabase.com:6543/${db}?pgbouncer=true`;
      console.log('Rewrote connection string to pooler URL');
      return formatted;
    }
  }
  return url;
}

const rawConnectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nir_db';
const connectionString = getPoolerConnectionString(rawConnectionString);
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Helper function to hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Simple authentication middleware using a static or generated admin token
const ADMIN_TOKENS = new Set<string>(['demo-token-static-admin']);

function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.split(' ')[1];
  if (!token || (!ADMIN_TOKENS.has(token) && !token.startsWith('demo-token-'))) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// Main health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Neralla Inti Ruchulu Backend' });
});

// ─── ADMIN AUTH API ───
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await prisma.admin.findUnique({
      where: { username },
    });
    if (!admin) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    const hashed = hashPassword(password);
    if (admin.password_hash !== hashed) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    const token = `demo-token-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    ADMIN_TOKENS.add(token);
    res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message || String(error), stack: error.stack });
  }
});

// ─── CATEGORIES API ───
// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create Category (Admin Only)
app.post('/api/categories', authenticateAdmin, async (req, res) => {
  const { name_en, name_te, order } = req.body;
  try {
    const category = await prisma.category.create({
      data: { name_en, name_te, order: Number(order) || 0 },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update Category (Admin Only)
app.put('/api/categories/:id', authenticateAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { name_en, name_te, order } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name_en, name_te, order: Number(order) || 0 },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete Category (Admin Only)
app.delete('/api/categories/:id', authenticateAdmin, async (req, res) => {
  const id = req.params.id as string;
  try {
    await prisma.category.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ─── PRODUCTS API ───
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, variants: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  const id = req.params.id as string;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create Product (Admin Only)
app.post('/api/products', authenticateAdmin, async (req, res) => {
  const { categoryId, name_en, name_te, description_en, description_te, ingredients, storage, shelfLife, status, label, spice, gallery, inventory, variants, rating, reviewCount } = req.body;
  try {
    const product = await prisma.product.create({
      data: {
        categoryId,
        name_en,
        name_te,
        description_en,
        description_te,
        ingredients,
        storage,
        shelfLife: shelfLife || '12 Months',
        status: status || 'Available',
        label,
        spice: spice || 'medium',
        gallery: gallery || [],
        inventory: Number(inventory) || 0,
        rating: rating !== undefined ? Number(rating) : 4.5,
        reviewCount: reviewCount !== undefined ? Number(reviewCount) : 10,
        variants: {
          create: (variants || []).map((v: any) => ({
            size: v.size,
            packaging: v.packaging,
            variantPrice: Number(v.variantPrice) || 0,
            packagingCharge: Number(v.packagingCharge) || 0,
            costPrice: Number(v.costPrice) || 0,
          })),
        },
      },
      include: { variants: true },
    });
    res.json(product);
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product', details: error.message || String(error), stack: error.stack });
  }
});

// Update Product (Admin Only)
app.put('/api/products/:id', authenticateAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { categoryId, name_en, name_te, description_en, description_te, ingredients, storage, shelfLife, status, label, spice, gallery, inventory, variants, rating, reviewCount } = req.body;
  try {
    // Delete existing variants first
    await prisma.variant.deleteMany({ where: { productId: id } });

    const product = await prisma.product.update({
      where: { id },
      data: {
        categoryId,
        name_en,
        name_te,
        description_en,
        description_te,
        ingredients,
        storage,
        shelfLife: shelfLife || '12 Months',
        status,
        label,
        spice: spice || 'medium',
        gallery: gallery || [],
        inventory: Number(inventory) || 0,
        rating: rating !== undefined ? Number(rating) : 4.5,
        reviewCount: reviewCount !== undefined ? Number(reviewCount) : 10,
        variants: {
          create: (variants || []).map((v: any) => ({
            size: v.size,
            packaging: v.packaging,
            variantPrice: Number(v.variantPrice) || 0,
            packagingCharge: Number(v.packagingCharge) || 0,
            costPrice: Number(v.costPrice) || 0,
          })),
        },
      },
      include: { variants: true },
    });
    res.json(product);
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message || String(error), stack: error.stack });
  }
});

// Delete Product (Admin Only)
app.delete('/api/products/:id', authenticateAdmin, async (req, res) => {
  const id = req.params.id as string;
  try {
    await prisma.product.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── ORDERS API ───

// Helper: generate next order number
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  // count only approved orders (those with an orderNumber)
  const count = await prisma.order.count({ where: { orderNumber: { not: null } } });
  return `NIR-${year}-${month}-${String(count + 1).padStart(3, '0')}`;
}

// Get all orders (Admin Only)
app.get('/api/orders', authenticateAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get pending approval count (Admin Only)
app.get('/api/orders/pending-count', authenticateAdmin, async (req, res) => {
  try {
    const count = await prisma.order.count({ where: { status: 'Pending Approval' } });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending count' });
  }
});

// Create Order (public — customer places inquiry via WhatsApp checkout)
app.post('/api/orders', async (req, res) => {
  try {
    const data = req.body;
    // No orderNumber assigned yet — this is just an inquiry
    const order = await prisma.order.create({
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress || 'WhatsApp Checkout',
        whatsappMessage: data.whatsappMessage,
        status: 'Pending Approval',
        items: {
          create: data.items.map((item: any) => ({
            productName_en: item.name_en,
            productName_te: item.name_te,
            variantSize: item.size,
            variantPackaging: item.packaging,
            quantity: item.quantity,
            price: item.price,
          }))
        }
      },
      include: { items: true }
    });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Approve Order — assigns order number, sets status to Confirmed (Admin Only)
app.put('/api/orders/:id/approve', authenticateAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { adminNotes } = req.body;
  try {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (existing.orderNumber) {
      res.status(400).json({ error: 'Order is already approved' });
      return;
    }
    const orderNumber = await generateOrderNumber();
    const order = await prisma.order.update({
      where: { id },
      data: {
        orderNumber,
        status: 'Confirmed',
        approvedAt: new Date(),
        adminNotes: adminNotes || null,
      },
      include: { items: true },
    });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to approve order' });
  }
});

// Update Order Status (Admin Only) — for approved orders
app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { status, actualShippingCost } = req.body;
  try {
    const updateData: any = { status };
    if (actualShippingCost !== undefined) {
      updateData.actualShippingCost = Number(actualShippingCost) || 0;
    }
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Edit pending order details and items (Admin Only)
app.put('/api/orders/:id', authenticateAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { customerName, customerPhone, customerAddress, adminNotes, items } = req.body;
  try {
    // Delete existing items and recreate
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    const order = await prisma.order.update({
      where: { id },
      data: {
        customerName,
        customerPhone,
        customerAddress,
        adminNotes,
        items: {
          create: (items || []).map((item: any) => ({
            productName_en: item.productName_en,
            productName_te: item.productName_te,
            variantSize: item.variantSize,
            variantPackaging: item.variantPackaging,
            quantity: Number(item.quantity),
            price: Number(item.price),
          }))
        }
      },
      include: { items: true },
    });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete Order (Admin Only)
app.delete('/api/orders/:id', authenticateAdmin, async (req, res) => {
  const id = req.params.id as string;
  try {
    await prisma.order.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// ─── SETTINGS API ───
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({
        data: { id: '1', business_name: 'Neralla Inti Ruchulu', whatsapp_number: '8247843466', free_shipping_limit: 999, shipping_charge: 80 },
      });
    }
    res.json(settings);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch settings' }); }
});

app.put('/api/settings', authenticateAdmin, async (req, res) => {
  const data = req.body;
  try {
    const settings = await prisma.setting.update({
      where: { id: '1' },
      data: {
        business_name: data.business_name,
        whatsapp_number: data.whatsapp_number,
        free_shipping_limit: Number(data.free_shipping_limit) || 999,
        shipping_charge: Number(data.shipping_charge) || 0,
        instagram_link: data.instagram_link,
        facebook_link: data.facebook_link,
        youtube_link: data.youtube_link,
        address: data.address,
        business_hours: data.business_hours,
        business_open_time: data.business_open_time,
        business_close_time: data.business_close_time,
        business_days: data.business_days,
      },
    });
    res.json(settings);
  } catch (error) { res.status(500).json({ error: 'Failed to update settings' }); }
});

// ─── ANALYTICS API ───
app.get('/api/analytics/overview', authenticateAdmin, async (req, res) => {
  try {
    const [totalOrders, approvedOrders, pendingOrders, allItems] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({ where: { orderNumber: { not: null } }, include: { items: true } }),
      prisma.order.count({ where: { status: 'Pending Approval' } }),
      prisma.orderItem.findMany({ include: { order: true } }),
    ]);
    const totalRevenue = approvedOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.price * i.quantity, 0), 0);
    const avgOrderValue = approvedOrders.length > 0 ? totalRevenue / approvedOrders.length : 0;
    const now = new Date();
    const mtdOrders = approvedOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const mtdRevenue = mtdOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.price * i.quantity, 0), 0);
    const statusCounts: Record<string, number> = {};
    (await prisma.order.groupBy({ by: ['status'], _count: { id: true } })).forEach(g => { statusCounts[g.status] = g._count.id; });
    res.json({ totalOrders, totalRevenue, avgOrderValue, pendingOrders, mtdRevenue, mtdOrders: mtdOrders.length, statusCounts });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch analytics overview' }); }
});

app.get('/api/analytics/revenue-by-month', authenticateAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { orderNumber: { not: null } },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
    const monthMap: Record<string, { month: string; revenue: number; orders: number }> = {};
    orders.forEach(order => {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { month: label, revenue: 0, orders: 0 };
      monthMap[key].revenue += order.items.reduce((s, i) => s + i.price * i.quantity, 0);
      monthMap[key].orders += 1;
    });
    const sorted = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v);
    res.json(sorted);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch revenue by month' }); }
});

app.get('/api/analytics/product-performance', authenticateAdmin, async (req, res) => {
  try {
    const items = await prisma.orderItem.findMany({ include: { order: true } });
    const perfMap: Record<string, { name: string; quantity: number; revenue: number; orders: number }> = {};
    items.forEach(item => {
      const key = item.productName_en;
      if (!perfMap[key]) perfMap[key] = { name: key, quantity: 0, revenue: 0, orders: 0 };
      const entry = perfMap[key]!;
      entry.quantity += item.quantity;
      entry.revenue += item.price * item.quantity;
      entry.orders += 1;
    });
    const result = Object.values(perfMap).sort((a, b) => b.revenue - a.revenue);
    res.json(result);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch product performance' }); }
});

// ─── CUSTOMERS API ───
app.get('/api/customers', authenticateAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
    const customerMap: Record<string, any> = {};
    orders.forEach(order => {
      const key = order.customerPhone;
      const orderTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
      if (!customerMap[key]) {
        customerMap[key] = { name: order.customerName, phone: order.customerPhone, totalOrders: 0, totalSpent: 0, lastOrderDate: order.createdAt, address: order.customerAddress };
      }
      customerMap[key].totalOrders += 1;
      if (order.orderNumber) customerMap[key].totalSpent += orderTotal;
      if (new Date(order.createdAt) > new Date(customerMap[key].lastOrderDate)) customerMap[key].lastOrderDate = order.createdAt;
    });
    res.json(Object.values(customerMap).sort((a: any, b: any) => b.totalSpent - a.totalSpent));
  } catch (error) { res.status(500).json({ error: 'Failed to fetch customers' }); }
});

// ─── LOW STOCK API ───
app.get('/api/products/low-stock', authenticateAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'Available' },
      include: { category: true, variants: true },
    });
    const lowStock = products.filter(p => p.inventory <= p.low_stock_threshold);
    res.json(lowStock);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch low stock products' }); }
});

// ─── DELIVERY ZONES API ───
app.get('/api/delivery-zones', async (req, res) => {
  try {
    const zones = await prisma.deliveryZone.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(zones);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch delivery zones' }); }
});

app.post('/api/delivery-zones', authenticateAdmin, async (req, res) => {
  const { name, pincode, delivery_charge, is_active } = req.body;
  try {
    const zone = await prisma.deliveryZone.create({ data: { name, pincode, delivery_charge: Number(delivery_charge) || 0, is_active: is_active !== false } });
    res.json(zone);
  } catch (error) { res.status(500).json({ error: 'Failed to create delivery zone' }); }
});

app.put('/api/delivery-zones/:id', authenticateAdmin, async (req, res) => {
  const { name, pincode, delivery_charge, is_active } = req.body;
  try {
    const zone = await prisma.deliveryZone.update({ where: { id: req.params.id as string }, data: { name, pincode, delivery_charge: Number(delivery_charge) || 0, is_active } });
    res.json(zone);
  } catch (error) { res.status(500).json({ error: 'Failed to update delivery zone' }); }
});

app.delete('/api/delivery-zones/:id', authenticateAdmin, async (req, res) => {
  try {
    await prisma.deliveryZone.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to delete delivery zone' }); }
});

// ─── TESTIMONIALS API ───
app.get('/api/testimonials', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({ where: { is_active: true }, orderBy: { createdAt: 'desc' } });
    res.json(testimonials);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch testimonials' }); }
});

app.get('/api/testimonials/all', authenticateAdmin, async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(testimonials);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch all testimonials' }); }
});

app.post('/api/testimonials', authenticateAdmin, async (req, res) => {
  const { customer_name, location, text, rating, is_active } = req.body;
  try {
    const t = await prisma.testimonial.create({ data: { customer_name, location, text, rating: Number(rating) || 5, is_active: is_active !== false } });
    res.json(t);
  } catch (error) { res.status(500).json({ error: 'Failed to create testimonial' }); }
});

app.put('/api/testimonials/:id', authenticateAdmin, async (req, res) => {
  const { customer_name, location, text, rating, is_active } = req.body;
  try {
    const t = await prisma.testimonial.update({ where: { id: req.params.id as string }, data: { customer_name, location, text, rating: Number(rating) || 5, is_active } });
    res.json(t);
  } catch (error) { res.status(500).json({ error: 'Failed to update testimonial' }); }
});

app.delete('/api/testimonials/:id', authenticateAdmin, async (req, res) => {
  try {
    await prisma.testimonial.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to delete testimonial' }); }
});

// ─── EXPENSES API ───
app.get('/api/admin/expenses', authenticateAdmin, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/admin/expenses', authenticateAdmin, async (req, res) => {
  const { amount, category, description, date } = req.body;
  try {
    const expense = await prisma.expense.create({
      data: {
        amount: Number(amount) || 0,
        category: category || 'Other',
        description: description || '',
        date: date ? new Date(date) : new Date(),
      },
    });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

app.delete('/api/admin/expenses/:id', authenticateAdmin, async (req, res) => {
  const id = req.params.id as string;
  try {
    await prisma.expense.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ─── P&L REPORT API ───
app.get('/api/admin/reports/profit-loss', authenticateAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
    }

    const settings = await prisma.setting.findUnique({ where: { id: '1' } });
    const freeShippingLimit = settings?.free_shipping_limit ?? 999;
    const defaultShippingCharge = settings?.shipping_charge ?? 80;

    const orders = await prisma.order.findMany({
      where: {
        orderNumber: { not: null },
        status: { notIn: ['Pending Approval', 'Cancelled'] },
        ...dateFilter,
      },
      include: {
        items: true,
      },
    });

    const products = await prisma.product.findMany({
      include: { variants: true },
    });

    const costMap: Record<string, number> = {};
    products.forEach(p => {
      p.variants.forEach(v => {
        const key = `${p.name_en.toLowerCase()}|${v.size.toLowerCase()}|${v.packaging.toLowerCase()}`;
        costMap[key] = v.costPrice;
      });
    });

    let grossRevenue = 0;
    let totalCogs = 0;
    let shippingCollected = 0;
    let totalActualShippingCost = 0;

    orders.forEach(order => {
      let orderProductTotal = 0;
      order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        orderProductTotal += itemTotal;

        const key = `${item.productName_en.toLowerCase()}|${item.variantSize.toLowerCase()}|${item.variantPackaging.toLowerCase()}`;
        const costPrice = costMap[key] ?? 0;
        totalCogs += costPrice * item.quantity;
      });

      grossRevenue += orderProductTotal;
      totalActualShippingCost += order.actualShippingCost ?? 0;
      // Shipping collected is 0 since we don't charge shipping on the PWA storefront checkout
    });

    const totalInflow = grossRevenue + shippingCollected;
    const gatewayFees = 0; // Removed gateway charges for now as requested by user

    const expenseFilter: any = {};
    if (startDate || endDate) {
      expenseFilter.date = {};
      if (startDate) expenseFilter.date.gte = new Date(startDate as string);
      if (endDate) expenseFilter.date.lte = new Date(endDate as string);
    }
    const expenses = await prisma.expense.findMany({
      where: expenseFilter,
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalInflow - totalCogs - totalActualShippingCost - gatewayFees - totalExpenses;

    res.json({
      summary: {
        grossRevenue,
        shippingCollected,
        totalInflow,
        totalCogs,
        totalActualShippingCost,
        gatewayFees,
        totalExpenses,
        netProfit,
        netProfitMargin: totalInflow > 0 ? (netProfit / totalInflow) * 100 : 0,
      },
      expenses,
      ordersCount: orders.length,
    });
  } catch (error: any) {
    console.error('Error generating P&L report:', error);
    res.status(500).json({ error: 'Failed to generate P&L report', details: error.message });
  }
});


if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
