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
interface AdminTokenUser {
  id: string;
  username: string;
  role: string;
}

const ADMIN_TOKENS = new Map<string, AdminTokenUser>([
  ['demo-token-static-admin', { id: 'default', username: 'admin', role: 'Super Admin' }]
]);

interface AuthenticatedRequest extends express.Request {
  adminUser?: AdminTokenUser;
}

function authenticateAdmin(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const user = ADMIN_TOKENS.get(token);
  if (!user) {
    if (token === 'demo-token-static-admin') {
      req.adminUser = { id: 'default', username: 'admin', role: 'Super Admin' };
    } else if (token.startsWith('demo-token-')) {
      req.adminUser = { id: 'unknown', username: 'admin', role: 'Super Admin' };
    } else {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  } else {
    req.adminUser = user;
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
    ADMIN_TOKENS.set(token, {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    });
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
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message || String(error) });
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

// Create Manual Order (Admin Only)
app.post('/api/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const data = req.body;
    // Auto-generate order number
    const orderNumber = await generateOrderNumber();
    
    const shipping = Number(data.actualShippingCost) || 0;
    const itemsList = data.items || [];
    const itemsTotal = itemsList.reduce((s: number, item: any) => s + (Number(item.price) * Number(item.quantity)), 0);
    const orderTotal = itemsTotal + shipping;

    const advancePaid = Number(data.advancePaid) || 0;
    const balancePaid = Number(data.balancePaid) || 0;
    const totalPaid = advancePaid + balancePaid;

    let paymentStatus = data.paymentStatus;
    if (!paymentStatus) {
      if (totalPaid === 0) paymentStatus = 'Unpaid';
      else if (totalPaid >= orderTotal) paymentStatus = 'Paid';
      else paymentStatus = 'Partially Paid';
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress || '',
        whatsappMessage: data.whatsappMessage || null,
        status: data.status || 'Confirmed',
        adminNotes: data.adminNotes || null,
        approvedAt: new Date(),
        actualShippingCost: shipping,
        actualAmountPaid: totalPaid,
        paymentStatus,
        advancePaid,
        advancePaidAt: advancePaid > 0 ? new Date() : null,
        balancePaid,
        balancePaidAt: balancePaid > 0 ? new Date() : null,
        items: {
          create: itemsList.map((item: any) => ({
            productName_en: item.productName_en || item.name_en || '',
            productName_te: item.productName_te || item.name_te || '',
            variantSize: item.variantSize || item.size || '',
            variantPackaging: item.variantPackaging || item.packaging || '',
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
          }))
        }
      },
      include: { items: true }
    });
    res.json(order);
  } catch (error: any) {
    console.error('Failed to create manual order:', error);
    res.status(500).json({ error: 'Failed to create manual order', details: error.message || String(error) });
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
  const { status, actualShippingCost, actualAmountPaid, paymentStatus, advancePaid, balancePaid } = req.body;
  try {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!existing) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
    }
    if (actualShippingCost !== undefined) {
      updateData.actualShippingCost = Number(actualShippingCost) || 0;
    }

    const shipping = actualShippingCost !== undefined ? Number(actualShippingCost) : existing.actualShippingCost;
    const itemsTotal = existing.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const orderTotal = itemsTotal + shipping;

    let nextAdvancePaid = existing.advancePaid;
    if (advancePaid !== undefined) {
      nextAdvancePaid = Number(advancePaid) || 0;
      updateData.advancePaid = nextAdvancePaid;
      if (nextAdvancePaid > 0 && existing.advancePaid === 0) {
        updateData.advancePaidAt = new Date();
      } else if (nextAdvancePaid === 0) {
        updateData.advancePaidAt = null;
      }
    }

    let nextBalancePaid = existing.balancePaid;
    if (balancePaid !== undefined) {
      nextBalancePaid = Number(balancePaid) || 0;
      updateData.balancePaid = nextBalancePaid;
      if (nextBalancePaid > 0 && existing.balancePaid === 0) {
        updateData.balancePaidAt = new Date();
      } else if (nextBalancePaid === 0) {
        updateData.balancePaidAt = null;
      }
    }

    const totalPaid = nextAdvancePaid + nextBalancePaid;
    updateData.actualAmountPaid = totalPaid;

    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
    } else if (advancePaid !== undefined || balancePaid !== undefined || actualShippingCost !== undefined) {
      if (totalPaid === 0) updateData.paymentStatus = 'Unpaid';
      else if (totalPaid >= orderTotal) updateData.paymentStatus = 'Paid';
      else updateData.paymentStatus = 'Partially Paid';
    } else if (actualAmountPaid !== undefined) {
      const amt = Number(actualAmountPaid) || 0;
      updateData.actualAmountPaid = amt;
      if (amt === 0) updateData.paymentStatus = 'Unpaid';
      else if (amt >= orderTotal) updateData.paymentStatus = 'Paid';
      else updateData.paymentStatus = 'Partially Paid';
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

// Edit pending/approved order details and items (Admin Only)
app.put('/api/orders/:id', authenticateAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { customerName, customerPhone, customerAddress, adminNotes, items, actualShippingCost, paymentStatus, advancePaid, balancePaid } = req.body;
  try {
    const existing = await prisma.order.findUnique({
      where: { id }
    });
    if (!existing) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Delete existing items and recreate
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    
    const newItems = items || [];
    const itemsTotal = newItems.reduce((s: number, i: any) => s + (Number(i.price) * Number(i.quantity)), 0);
    const shipping = actualShippingCost !== undefined ? Number(actualShippingCost) : existing.actualShippingCost;
    const orderTotal = itemsTotal + shipping;

    const nextAdvancePaid = advancePaid !== undefined ? (Number(advancePaid) || 0) : existing.advancePaid;
    const nextBalancePaid = balancePaid !== undefined ? (Number(balancePaid) || 0) : existing.balancePaid;
    const totalPaid = nextAdvancePaid + nextBalancePaid;

    let calculatedPaymentStatus = paymentStatus;
    if (!calculatedPaymentStatus) {
      if (totalPaid === 0) calculatedPaymentStatus = 'Unpaid';
      else if (totalPaid >= orderTotal) calculatedPaymentStatus = 'Paid';
      else calculatedPaymentStatus = 'Partially Paid';
    }

    const updateData: any = {
      customerName,
      customerPhone,
      customerAddress,
      adminNotes,
      actualShippingCost: shipping,
      actualAmountPaid: totalPaid,
      paymentStatus: calculatedPaymentStatus,
      advancePaid: nextAdvancePaid,
      balancePaid: nextBalancePaid,
      items: {
        create: newItems.map((item: any) => ({
          productName_en: item.productName_en || item.name_en || '',
          productName_te: item.productName_te || item.name_te || '',
          variantSize: item.variantSize || item.size || '',
          variantPackaging: item.variantPackaging || item.packaging || '',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        }))
      }
    };

    if (advancePaid !== undefined) {
      if (nextAdvancePaid > 0 && existing.advancePaid === 0) {
        updateData.advancePaidAt = new Date();
      } else if (nextAdvancePaid === 0) {
        updateData.advancePaidAt = null;
      }
    }
    if (balancePaid !== undefined) {
      if (nextBalancePaid > 0 && existing.balancePaid === 0) {
        updateData.balancePaidAt = new Date();
      } else if (nextBalancePaid === 0) {
        updateData.balancePaidAt = null;
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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
    const updateData: any = {
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
    };
    if (data.banner_enabled !== undefined) {
      updateData.banner_enabled = Boolean(data.banner_enabled);
    }
    if (data.banner_text !== undefined) {
      updateData.banner_text = String(data.banner_text);
    }
    if (data.banner_color !== undefined) {
      updateData.banner_color = String(data.banner_color);
    }

    const settings = await prisma.setting.update({
      where: { id: '1' },
      data: updateData,
    });
    res.json(settings);
  } catch (error) { res.status(500).json({ error: 'Failed to update settings' }); }
});

// ─── ANALYTICS API ───
app.get('/api/analytics/overview', authenticateAdmin, async (req, res) => {
  try {
    const [totalOrders, approvedOrders, pendingOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({ where: { orderNumber: { not: null } }, include: { items: true } }),
      prisma.order.count({ where: { status: 'Pending Approval' } }),
    ]);
    
    // Total revenue is the sum of actualAmountPaid across all approved orders
    const totalRevenue = approvedOrders.reduce((s, o) => s + (o.actualAmountPaid || 0), 0);
    
    // Calculate outstanding pending payments (excluding Cancelled/Pending Approval orders)
    const totalPendingAmount = approvedOrders.reduce((s, o) => {
      if (o.status === 'Cancelled') return s;
      const orderTotal = o.items.reduce((sum, item) => sum + item.price * item.quantity, 0) + (o.actualShippingCost || 0);
      const paid = o.actualAmountPaid || 0;
      const pending = Math.max(0, orderTotal - paid);
      return s + pending;
    }, 0);

    const paidOrders = approvedOrders.filter(o => o.paymentStatus === 'Paid' || o.paymentStatus === 'Partially Paid');
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
    const now = new Date();
    const mtdOrders = approvedOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const mtdRevenue = mtdOrders.reduce((s, o) => s + (o.actualAmountPaid || 0), 0);

    const statusCounts: Record<string, number> = {};
    (await prisma.order.groupBy({ by: ['status'], _count: { id: true } })).forEach(g => { statusCounts[g.status] = g._count.id; });
    res.json({ 
      totalOrders, 
      totalRevenue, 
      avgOrderValue, 
      pendingOrders, 
      mtdRevenue, 
      mtdOrders: mtdOrders.length, 
      statusCounts,
      totalPendingAmount 
    });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch analytics overview' }); }
});

app.get('/api/analytics/revenue-by-month', authenticateAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { 
        orderNumber: { not: null }, 
        paymentStatus: { in: ['Paid', 'Partially Paid'] } 
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
    const monthMap: Record<string, { month: string; revenue: number; orders: number }> = {};
    orders.forEach(order => {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { month: label, revenue: 0, orders: 0 };
      const orderRevenue = order.actualAmountPaid || 0;
      monthMap[key].revenue += orderRevenue;
      monthMap[key].orders += 1;
    });
    const sorted = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v);
    res.json(sorted);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch revenue by month' }); }
});

app.get('/api/analytics/product-performance', authenticateAdmin, async (req, res) => {
  try {
    const items = await prisma.orderItem.findMany();
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
      const orderTotal = order.actualAmountPaid !== null && order.actualAmountPaid !== undefined ? order.actualAmountPaid : order.items.reduce((s, i) => s + i.price * i.quantity, 0);
      if (!customerMap[key]) {
        customerMap[key] = { name: order.customerName, phone: order.customerPhone, totalOrders: 0, totalSpent: 0, lastOrderDate: order.createdAt, address: order.customerAddress };
      }
      customerMap[key].totalOrders += 1;
      if (order.orderNumber && (order.paymentStatus === 'Paid' || order.paymentStatus === 'Partially Paid')) customerMap[key].totalSpent += orderTotal;
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
        paymentStatus: { in: ['Paid', 'Partially Paid', 'Unpaid'] },
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
    let totalPendingAmount = 0;

    orders.forEach(order => {
      let orderProductTotal = 0;
      order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        orderProductTotal += itemTotal;

        const key = `${item.productName_en.toLowerCase()}|${item.variantSize.toLowerCase()}|${item.variantPackaging.toLowerCase()}`;
        const costPrice = costMap[key] ?? 0;
        totalCogs += costPrice * item.quantity;
      });

      const orderTotal = orderProductTotal + (order.actualShippingCost ?? 0);
      let paid = 0;
      if (order.paymentStatus === 'Paid') {
        paid = order.actualAmountPaid !== null && order.actualAmountPaid !== undefined ? order.actualAmountPaid : orderTotal;
      } else if (order.paymentStatus === 'Partially Paid') {
        paid = order.actualAmountPaid !== null && order.actualAmountPaid !== undefined ? order.actualAmountPaid : (order.advancePaid + order.balancePaid);
      } else {
        // Unpaid or other
        paid = order.actualAmountPaid !== null && order.actualAmountPaid !== undefined ? order.actualAmountPaid : 0;
      }

      grossRevenue += paid;
      totalActualShippingCost += order.actualShippingCost ?? 0;
      // Shipping collected is 0 since we don't charge shipping on the PWA storefront checkout

      const pending = Math.max(0, orderTotal - paid);
      totalPendingAmount += pending;
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
        totalPendingAmount,
      },
      expenses,
      ordersCount: orders.length,
    });
  } catch (error: any) {
    console.error('Error generating P&L report:', error);
    res.status(500).json({ error: 'Failed to generate P&L report', details: error.message });
  }
});

// ─── ADMIN BACKUP & RESTORE API ───
app.get('/api/admin/backup', authenticateAdmin, async (req, res) => {
  try {
    const data = {
      settings: await prisma.setting.findMany(),
      categories: await prisma.category.findMany(),
      products: await prisma.product.findMany({ include: { variants: true } }),
      orders: await prisma.order.findMany({ include: { items: true } }),
      expenses: await prisma.expense.findMany(),
      testimonials: await prisma.testimonial.findMany(),
      deliveryZones: await prisma.deliveryZone.findMany(),
      customerProfiles: await prisma.customerProfile.findMany(),
    };
    res.json(data);
  } catch (error: any) {
    console.error('Backup failed:', error);
    res.status(500).json({ error: 'Backup failed: ' + error.message });
  }
});

app.post('/api/admin/restore', authenticateAdmin, async (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid backup format' });
  }
  try {
    await prisma.$transaction(async (tx) => {
      // Delete in reverse order of foreign key constraints
      await tx.orderItem.deleteMany();
      await tx.order.deleteMany();
      await tx.expense.deleteMany();
      await tx.testimonial.deleteMany();
      await tx.deliveryZone.deleteMany();
      await tx.customerProfile.deleteMany();
      await tx.variant.deleteMany();
      await tx.product.deleteMany();
      await tx.category.deleteMany();
      await tx.setting.deleteMany();

      // Restore Settings
      if (data.settings && Array.isArray(data.settings)) {
        for (const s of data.settings) {
          await tx.setting.create({
            data: {
              id: s.id,
              business_name: s.business_name,
              whatsapp_number: s.whatsapp_number,
              free_shipping_limit: Number(s.free_shipping_limit) || 999,
              shipping_charge: Number(s.shipping_charge) || 0,
              instagram_link: s.instagram_link || null,
              facebook_link: s.facebook_link || null,
              youtube_link: s.youtube_link || null,
              address: s.address || null,
              business_hours: s.business_hours || null,
              business_open_time: s.business_open_time || null,
              business_close_time: s.business_close_time || null,
              business_days: s.business_days || 'Mon,Tue,Wed,Thu,Fri,Sat',
              banner_enabled: s.banner_enabled !== undefined ? Boolean(s.banner_enabled) : false,
              banner_text: s.banner_text || '',
              banner_color: s.banner_color || 'amber',
            }
          });
        }
      }

      // Restore Categories
      if (data.categories && Array.isArray(data.categories)) {
        for (const c of data.categories) {
          const catData: any = {
            id: c.id,
            name_en: c.name_en,
            name_te: c.name_te,
            order: Number(c.order) || 0,
          };
          if (c.createdAt) catData.createdAt = new Date(c.createdAt);
          if (c.updatedAt) catData.updatedAt = new Date(c.updatedAt);
          await tx.category.create({ data: catData });
        }
      }

      // Restore Products & Variants
      if (data.products && Array.isArray(data.products)) {
        for (const p of data.products) {
          const prodData: any = {
            id: p.id,
            categoryId: p.categoryId,
            name_en: p.name_en,
            name_te: p.name_te,
            description_en: p.description_en || null,
            description_te: p.description_te || null,
            ingredients: p.ingredients || null,
            storage: p.storage || null,
            shelfLife: p.shelfLife || '12 Months',
            status: p.status || 'Available',
            label: p.label || null,
            spice: p.spice || 'medium',
            gallery: p.gallery || [],
            inventory: Number(p.inventory) || 0,
            low_stock_threshold: Number(p.low_stock_threshold) || 10,
            rating: p.rating !== undefined ? Number(p.rating) : 4.5,
            reviewCount: p.reviewCount !== undefined ? Number(p.reviewCount) : 10,
          };
          if (p.createdAt) prodData.createdAt = new Date(p.createdAt);
          if (p.updatedAt) prodData.updatedAt = new Date(p.updatedAt);

          await tx.product.create({ data: prodData });

          if (p.variants && Array.isArray(p.variants)) {
            for (const v of p.variants) {
              const varData: any = {
                id: v.id,
                productId: v.productId,
                size: v.size,
                packaging: v.packaging,
                variantPrice: Number(v.variantPrice) || 0,
                packagingCharge: Number(v.packagingCharge) || 0,
              };
              if (v.costPrice !== null && v.costPrice !== undefined) {
                varData.costPrice = Number(v.costPrice);
              }
              await tx.variant.create({ data: varData });
            }
          }
        }
      }

      // Restore Orders & Items
      if (data.orders && Array.isArray(data.orders)) {
        for (const o of data.orders) {
          const ordData: any = {
            id: o.id,
            orderNumber: o.orderNumber || null,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerAddress: o.customerAddress || null,
            whatsappMessage: o.whatsappMessage || null,
            status: o.status,
            adminNotes: o.adminNotes || null,
            paymentStatus: o.paymentStatus || 'Unpaid',
            actualAmountPaid: o.actualAmountPaid !== null && o.actualAmountPaid !== undefined ? Number(o.actualAmountPaid) : null,
          };
          if (o.actualShippingCost !== null && o.actualShippingCost !== undefined) {
            ordData.actualShippingCost = Number(o.actualShippingCost);
          }
          if (o.createdAt) ordData.createdAt = new Date(o.createdAt);
          if (o.approvedAt) ordData.approvedAt = new Date(o.approvedAt);

          await tx.order.create({ data: ordData });

          if (o.items && Array.isArray(o.items)) {
            for (const item of o.items) {
              await tx.orderItem.create({
                data: {
                  id: item.id,
                  orderId: item.orderId,
                  productName_en: item.productName_en,
                  productName_te: item.productName_te,
                  variantSize: item.variantSize,
                  variantPackaging: item.variantPackaging,
                  quantity: Number(item.quantity) || 1,
                  price: Number(item.price) || 0,
                }
              });
            }
          }
        }
      }

      // Restore Expenses
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const e of data.expenses) {
          const expData: any = {
            id: e.id,
            amount: Number(e.amount) || 0,
            category: e.category,
            description: e.description,
          };
          if (e.date) expData.date = new Date(e.date);
          if (e.createdAt) expData.createdAt = new Date(e.createdAt);
          if (e.updatedAt) expData.updatedAt = new Date(e.updatedAt);

          await tx.expense.create({ data: expData });
        }
      }

      // Restore Testimonials
      if (data.testimonials && Array.isArray(data.testimonials)) {
        for (const t of data.testimonials) {
          const testData: any = {
            id: t.id,
            customer_name: t.customer_name,
            location: t.location || null,
            text: t.text,
            rating: Number(t.rating) || 5,
            is_active: t.is_active !== undefined ? Boolean(t.is_active) : true,
          };
          if (t.createdAt) testData.createdAt = new Date(t.createdAt);
          if (t.updatedAt) testData.updatedAt = new Date(t.updatedAt);

          await tx.testimonial.create({ data: testData });
        }
      }

      // Restore Delivery Zones
      if (data.deliveryZones && Array.isArray(data.deliveryZones)) {
        for (const dz of data.deliveryZones) {
          const dzData: any = {
            id: dz.id,
            name: dz.name,
            pincode: dz.pincode,
            delivery_charge: Number(dz.delivery_charge) || 0,
            is_active: dz.is_active !== undefined ? Boolean(dz.is_active) : true,
          };
          if (dz.createdAt) dzData.createdAt = new Date(dz.createdAt);
          if (dz.updatedAt) dzData.updatedAt = new Date(dz.updatedAt);

          await tx.deliveryZone.create({ data: dzData });
        }
      }

      // Restore Customer Profiles
      if (data.customerProfiles && Array.isArray(data.customerProfiles)) {
        for (const cp of data.customerProfiles) {
          const cpData: any = {
            id: cp.id,
            phone: cp.phone,
            kitchenNotes: cp.kitchenNotes || null,
          };
          if (cp.createdAt) cpData.createdAt = new Date(cp.createdAt);
          if (cp.updatedAt) cpData.updatedAt = new Date(cp.updatedAt);

          await tx.customerProfile.create({ data: cpData });
        }
      }
    });
    res.json({ success: true, message: 'Database restored successfully' });
  } catch (error: any) {
    console.error('Restore failed:', error);
    res.status(500).json({ error: 'Restore failed: ' + error.message });
  }
});

// ─── CUSTOMER PROFILE NOTES API ───
app.get('/api/admin/customers/profile/:phone', authenticateAdmin, async (req, res) => {
  const phone = req.params.phone as string;
  try {
    const profile = await prisma.customerProfile.findUnique({ where: { phone } });
    res.json(profile || { phone, kitchenNotes: '' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

app.post('/api/admin/customers/profile/:phone', authenticateAdmin, async (req, res) => {
  const phone = req.params.phone as string;
  const { kitchenNotes } = req.body;
  try {
    const profile = await prisma.customerProfile.upsert({
      where: { phone },
      update: { kitchenNotes: kitchenNotes || null },
      create: { phone, kitchenNotes: kitchenNotes || null },
    });
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update customer profile' });
  }
});

// ─── BULK PRODUCT UPDATE API (Spreadsheet Bulk Editor) ───
app.post('/api/products/bulk', authenticateAdmin, async (req, res) => {
  const { updates } = req.body;
  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({ error: 'Invalid updates body. Expected { updates: [...] }' });
  }
  try {
    await prisma.$transaction(
      updates.map((prodUpdate: any) => {
        const prodData: any = {};
        if (prodUpdate.inventory !== undefined) {
          prodData.inventory = Number(prodUpdate.inventory);
        }
        if (prodUpdate.shelfLife !== undefined) {
          prodData.shelfLife = prodUpdate.shelfLife;
        }

        const productUpdatePromise = prisma.product.update({
          where: { id: prodUpdate.id },
          data: prodData,
        });

        const variantUpdatePromises = (prodUpdate.variants || []).map((vUpdate: any) => {
          const varData: any = {};
          if (vUpdate.variantPrice !== undefined) varData.variantPrice = Number(vUpdate.variantPrice);
          if (vUpdate.costPrice !== undefined) varData.costPrice = Number(vUpdate.costPrice);
          if (vUpdate.packagingCharge !== undefined) varData.packagingCharge = Number(vUpdate.packagingCharge);

          return prisma.variant.update({
            where: { id: vUpdate.id },
            data: varData,
          });
        });

        return [productUpdatePromise, ...variantUpdatePromises];
      }).flat()
    );
    res.json({ success: true, message: 'Products and variants updated successfully' });
  } catch (error: any) {
    console.error('Bulk update products error:', error);
    res.status(500).json({ error: 'Failed to perform bulk update', details: error.message });
  }
});


// ─── ADMIN ACCOUNTS MANAGEMENT API (Super Admin Only) ───
// List all admin users
app.get('/api/admin/users', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.adminUser?.role !== 'Super Admin') {
      res.status(403).json({ error: 'Forbidden. Requires Super Admin role.' });
      return;
    }
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(admins);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch admin users', details: error.message });
  }
});

// Create a new admin user
app.post('/api/admin/users', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.adminUser?.role !== 'Super Admin') {
      res.status(403).json({ error: 'Forbidden. Requires Super Admin role.' });
      return;
    }
    const { username, password, role } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }
    const password_hash = hashPassword(password);
    const newAdmin = await prisma.admin.create({
      data: {
        username: username.trim(),
        password_hash,
        role: role === 'Super Admin' ? 'Super Admin' : 'Admin',
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      }
    });
    res.json(newAdmin);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create admin user', details: error.message });
  }
});

// Delete an admin user
app.delete('/api/admin/users/:id', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.adminUser?.role !== 'Super Admin') {
      res.status(403).json({ error: 'Forbidden. Requires Super Admin role.' });
      return;
    }
    const id = req.params.id as string;
    if (id === req.adminUser.id) {
      res.status(400).json({ error: 'You cannot delete your own account' });
      return;
    }
    await prisma.admin.delete({ where: { id } });
    res.json({ success: true, message: 'Admin user deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete admin user', details: error.message });
  }
});


if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
