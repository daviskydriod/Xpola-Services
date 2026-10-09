// FILE PATH: src/lib/api.ts

export const API_BASE = 'https://xpolaservices.com/api';

const getToken      = () => localStorage.getItem('xpola_token');
const getAdminToken = () => localStorage.getItem('xpola_admin_token');

// ── Core fetch ────────────────────────────────────────────────────────────────
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> ?? {}),
  };
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data as T;
}

const authFetch  = <T>(path: string, init: RequestInit = {}) =>
  apiFetch<T>(path, init, getToken());
const adminFetch = <T>(path: string, init: RequestInit = {}) =>
  apiFetch<T>(path, init, getAdminToken());

// ── Product types ─────────────────────────────────────────────────────────────
export interface ProductImage {
  id:         number;
  product_id: number;
  image_path: string;
  sort_order: number;
}

export interface ProductVariation {
  id:          number;
  product_id:  number;
  type:        string;   // e.g. 'size' | 'color' | 'weight' | 'type'
  label:       string;   // display label e.g. 'Size'
  value:       string;   // option value  e.g. 'XL'
  price_delta: number;
  stock_qty:   number;
  sku:         string | null;
  sort_order:  number;
}

export interface ApiProduct {
  id:            number;
  name:          string;
  description:   string;
  price:         number;
  currency:      'NGN' | 'CAD';
  country:       'NG' | 'CA';
  category_id:   number | null;
  category_name: string | null;
  category_slug: string | null;
  image_path:    string | null;
  stock_status:  'in_stock' | 'out_of_stock';
  featured:      0 | 1;
  rating:        number;
  reviews:       number;
  created_at:    string;
  tags:          string | null;
  images:        ProductImage[];
  variations:    ProductVariation[];
}

export interface ApiCategory {
  id:   number;
  name: string;
  slug: string;
}
export interface Pagination {
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}

// ── User types ────────────────────────────────────────────────────────────────
export interface SavedAddress {
  id:        string;
  label:     string;
  street:    string;
  city:      string;
  state:     string;
  country:   string;
  isDefault: boolean;
}

export interface UserProfile {
  id:            string;
  uid:           string;
  email:         string;
  firstName:     string;
  lastName:      string;
  phone:         string;
  country:       string;
  avatar:        string | null;
  addresses:     SavedAddress[];
  emailVerified: boolean;
  referralCode:  string | null;
  referredBy:    string | null;
}

export interface WishlistItem {
  id:              string;
  productId:       string;
  product:         ApiProduct;
  addedAt:         string;
  notifyOnRestock: boolean;
}

export interface LoyaltyTransaction {
  id:          string;
  type:        string;
  points:      number;
  description: string;
  createdAt:   string;
}

export interface Notification {
  id:        string;
  type:      string;
  title:     string;
  message:   string;
  read:      boolean;
  data?:     Record<string, unknown>;
  createdAt: string;
}

export interface Referral {
  id:            string;
  referredEmail: string;
  status:        'completed' | 'failed';
  bonusEarned:   number;
  createdAt:     string;
}

// ── Support types ─────────────────────────────────────────────────────────────
export interface SupportMessage {
  id:        string;
  sender:    'user' | 'admin';
  body:      string;
  createdAt: string;
  created_at?: string;
}

export interface SupportTicket {
  id:           string;
  reference:    string;
  subject:      string;
  category:     string;
  message:      string;
  status:       'open' | 'in_progress' | 'resolved';
  createdAt:    string;
  created_at?:  string;
  messages:     SupportMessage[];
  replies:      SupportMessage[]; // alias kept for compat
}

// ── Order types ───────────────────────────────────────────────────────────────
export interface OrderItem {
  name:      string;
  quantity:  number;
  price:     number;
  currency:  string;
  image?:    string;
}

export interface Order {
  id:              number;
  order_ref:       string;
  status:          'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  payment_status?: string;
  currency:        'NGN' | 'CAD';
  subtotal:        number;
  delivery_fee:    number;
  total:           number;
  items:           OrderItem[];
  delivery_area?:  string;
  delivery_city?:  string;
  delivery_state?: string;
  delivery_address?: string;
  customer_name?:  string;
  trackingNumber?: string;
  statusHistory?:  { status: string; timestamp: string }[];
  created_at:      string;
}

// The order is created before payment starts, so older API responses can have
// status=pending while payment_status already contains the authoritative result.
export const normalizeOrderStatus = (order: Pick<Order, 'status' | 'payment_status'>): Order['status'] => {
  const payment = String(order.payment_status ?? '').toLowerCase();
  if (['failed', 'failure', 'declined', 'cancelled', 'canceled'].includes(payment)) return 'failed';
  if (['paid', 'success', 'successful', 'captured', 'completed'].includes(payment) && order.status === 'pending') return 'paid';
  return order.status;
};

// ── Admin types ───────────────────────────────────────────────────────────────
export interface Customer {
  id:            string;
  email:         string;
  firstName:     string;
  lastName:      string;
  phone:         string;
  country:       string;
  tags:          string[];
  status:        'active' | 'suspended' | 'blocked';
  totalOrders:   number;
  totalSpent:    number;
  emailVerified: boolean;
  referralCode:  string | null;
  referredBy:    string | null;
  createdAt:     string;
}

export interface AdminUser {
  id:            number;
  username:      string;
  email:         string | null;
  is_super_admin: boolean;
  otp_enabled:   boolean;
  created_at:    string;
}

export interface DeliveryZone {
  id:       number;
  name:     string;
  country:  string;
  fee:      number;
  min_days: number;
  max_days: number;
   // ✅ ADD THESE
  isActive?: boolean;
  area?: string;
}

export interface Category {
  id:   number;
  name: string;
  slug: string;
}

export interface Coupon {
  id:         number;
  code:       string;
  type:       'percent' | 'fixed';
  value:      number;
  minOrder:   number;
  maxUses:    number;
  usedCount:  number;
  expiresAt:  string;
  isActive:   boolean;
}

export interface SiteSettings {
  siteName:       string;
  supportEmail:   string;
  supportPhone:   string;
  facebookUrl:    string;
  twitterUrl:     string;
  instagramUrl:   string;
  maintenanceMode: boolean;
}

export interface AnnouncementBanner {
  text:       string;
  link?:      string;
  bgColor?:   string;
  isActive:   boolean;
  expiresAt?: string;
}

export interface AdminStats {
  totalOrders:    number;
  totalRevenue:   number;
  totalCustomers: number;
  totalProducts:  number;
  recentOrders?:  Order[];
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  sector: string | null;
  country: 'NG' | 'CA';
  image_url: string | null;
  client_name: string | null;
  project_year: string | null;
  sort_order: number;
  is_published: 0 | 1;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id:              string;
  adminId:         string;
  adminUsername?:  string;
  action:          string;
  target:          string;
  details:         string;
  ipAddress?:      string;
  createdAt:       string;
  actorType?:      'admin' | 'user' | 'system';
  actorId?:        string;
  actorName?:      string;
  actorEmail?:     string;
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: {
    email: string; password: string; firstName: string; lastName: string;
    phone: string; country: string; referralCode?: string;
  }) =>
    apiFetch<{ token: string; user: UserProfile }>('/auth.php?action=register', {
      method: 'POST', body: JSON.stringify(body),
    }),

  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: UserProfile }>('/auth.php?action=login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  getProfile: () =>
    authFetch<UserProfile>('/auth.php?action=profile'),

  updateProfile: (data: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'phone'>>) =>
    authFetch<{ success: boolean }>('/auth.php?action=update_profile', { method: 'PUT', body: JSON.stringify(data) }),

  uploadAvatar: (file: File) => {
    const fd = new FormData(); fd.append('avatar', file);
    return authFetch<{ url: string }>('/auth.php?action=upload_avatar', { method: 'POST', body: fd });
  },

  resetPassword: (email: string) =>
    apiFetch<{ success: boolean }>('/auth.php?action=reset_password', { method: 'POST', body: JSON.stringify({ email }) }),

  changePassword: (current: string, next: string) =>
    authFetch<{ success: boolean }>('/auth.php?action=change_password', { method: 'POST', body: JSON.stringify({ current, next }) }),

  deleteAccount: (password: string) =>
    authFetch<{ success: boolean }>('/auth.php?action=delete_account', { method: 'DELETE', body: JSON.stringify({ password }) }),

  addAddress: (addr: Omit<SavedAddress, 'id'>) =>
    authFetch<{ id: string }>('/auth.php?action=add_address', { method: 'POST', body: JSON.stringify(addr) }),

  updateAddress: (id: string, addr: Partial<SavedAddress>) =>
    authFetch<{ success: boolean }>(`/auth.php?action=update_address&id=${id}`, { method: 'PUT', body: JSON.stringify(addr) }),

  deleteAddress: (id: string) =>
    authFetch<{ success: boolean }>(`/auth.php?action=delete_address&id=${id}`, { method: 'DELETE' }),

  setDefaultAddress: (id: string) =>
    authFetch<{ success: boolean }>(`/auth.php?action=set_default_address&id=${id}`, { method: 'POST' }),
};

// Unified activity stream. The server should persist actor_type, actor_id,
// actor_name/email, action, target, details, ip_address and created_at.
export const activityApi = {
  record: (body: { action: string; target?: string; details?: string }) =>
    authFetch<{ success: boolean }>('/activity.php', {
      method: 'POST', body: JSON.stringify(body),
    }),
};

// ── Wishlist API ──────────────────────────────────────────────────────────────
export const wishlistApi = {
  getAll: () =>
    authFetch<WishlistItem[]>('/wishlist.php'),

  add: (productId: string) =>
    authFetch<{ id: string }>('/wishlist.php', { method: 'POST', body: JSON.stringify({ productId }) }),

  remove: (id: string) =>
    authFetch<{ success: boolean }>(`/wishlist.php?id=${id}`, { method: 'DELETE' }),

  toggleRestock: (id: string, notify: boolean) =>
    authFetch<{ success: boolean }>(`/wishlist.php?id=${id}`, { method: 'PATCH', body: JSON.stringify({ notifyOnRestock: notify }) }),
};

// ── Loyalty API ───────────────────────────────────────────────────────────────
export const loyaltyApi = {
  getBalance: () =>
    authFetch<{ points: number; tier: string }>('/loyalty.php?action=balance'),

  getHistory: () =>
    authFetch<LoyaltyTransaction[]>('/loyalty.php?action=history'),
};

// ── Notifications API ─────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () =>
    authFetch<Notification[]>('/notifications.php'),

  markRead: (id: string) =>
    authFetch<{ success: boolean }>(`/notifications.php?id=${id}`, { method: 'PATCH' }),

  markAllRead: () =>
    authFetch<{ success: boolean }>('/notifications.php?action=mark_all_read', { method: 'PATCH' }),
};

// ── Referral API ──────────────────────────────────────────────────────────────
export const referralApi = {
  getCode: () =>
    authFetch<{ code: string; stats: { referred: number; completed: number; bonusEarned: number }; referrals: Referral[] }>('/referral.php'),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminApi = {
  login: (username: string, password: string) =>
    apiFetch<{ success: boolean; token?: string; username?: string; isSuperAdmin?: boolean; otpRequired?: boolean; tempToken?: string }>(
      '/admin/login.php', { method: 'POST', body: JSON.stringify({ username, password }) }),

  verifyOtp: (tempToken: string, otp: string) =>
    apiFetch<{ success: boolean; token: string; username: string; isSuperAdmin: boolean }>(
      '/admin/login.php?action=verify_otp', { method: 'POST', body: JSON.stringify({ tempToken, otp }) }),

  changePassword: (currentPassword: string, newPassword: string) =>
    adminFetch<{ success: boolean }>('/admin/login.php?action=change_password', {
      method: 'POST', body: JSON.stringify({ currentPassword, newPassword }),
    }),

  toggleOtp: (enabled: boolean) =>
    adminFetch<{ success: boolean; otp_enabled: boolean }>('/admin/login.php?action=toggle_otp', {
      method: 'POST', body: JSON.stringify({ enabled }),
    }),

  getStats: () =>
    adminFetch<AdminStats>('/admin/stats.php'),

  getAuditLog: (params?: string) =>
    adminFetch<{ success: boolean; data: AuditLog[]; total: number }>(`/admin/audit.php?scope=all${params ? `&${params}` : ''}`).then(res => ({
      ...res,
      data: (res.data ?? []).map((log: any) => ({
        ...log,
        adminId: log.adminId ?? log.admin_id,
        adminUsername: log.adminUsername ?? log.admin_username,
        ipAddress: log.ipAddress ?? log.ip_address,
        createdAt: log.createdAt ?? log.created_at,
        actorType: log.actorType ?? log.actor_type,
        actorId: log.actorId ?? log.actor_id,
        actorName: log.actorName ?? log.actor_name,
        actorEmail: log.actorEmail ?? log.actor_email,
      })),
    })),
};

export const projectsApi = {
  getPublic: (country?: 'NG' | 'CA') =>
    apiFetch<{ success: boolean; enabled: boolean; data: Project[] }>(`/projects.php${country ? `?country=${country}` : ''}`),
};

export const adminProjectsApi = {
  getAll: () => adminFetch<{ success: boolean; data: Project[] }>('/admin/projects.php'),
  create: (data: Omit<Project, 'id' | 'slug' | 'created_at' | 'updated_at'>) =>
    adminFetch<{ success: boolean; id: number }>('/admin/projects.php', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Omit<Project, 'id' | 'slug' | 'created_at' | 'updated_at'>) =>
    adminFetch<{ success: boolean }>(`/admin/projects.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => adminFetch<{ success: boolean }>(`/admin/projects.php?id=${id}`, { method: 'DELETE' }),
};

export const adminProductsApi = {
  getAll: (params?: string) =>
    adminFetch<{ success: boolean; data: ApiProduct[] }>(`/admin/products.php${params ? `?${params}` : ''}`),

  getOne: (id: number) =>
    adminFetch<{ success: boolean; data: ApiProduct }>(`/admin/products.php?id=${id}`),

  create: (fd: FormData) =>
    adminFetch<{ success: boolean; id: number }>('/admin/products.php?action=create', { method: 'POST', body: fd }),

  update: (fd: FormData) =>
    adminFetch<{ success: boolean }>('/admin/products.php?action=update', { method: 'POST', body: fd }),

  delete: (id: number) =>
    adminFetch<{ success: boolean }>(`/admin/products.php?id=${id}`, { method: 'DELETE' }),

  addImage: (productId: number, file: File) => {
    const fd = new FormData(); fd.append('image', file);
    return adminFetch<{ success: boolean; id: number; image_path: string }>(
      `/admin/products.php?action=add_image&id=${productId}`, { method: 'POST', body: fd });
  },

  deleteImage: (imgId: number) =>
    adminFetch<{ success: boolean }>(`/admin/products.php?action=del_image&img_id=${imgId}`, { method: 'DELETE' }),

  addVariation: (productId: number, variation: Omit<ProductVariation, 'id' | 'product_id'>) =>
    adminFetch<{ success: boolean; id: number }>(
      `/admin/products.php?action=add_variation&id=${productId}`,
      { method: 'POST', body: JSON.stringify(variation) }),

  deleteVariation: (varId: number) =>
    adminFetch<{ success: boolean }>(`/admin/products.php?action=del_variation&var_id=${varId}`, { method: 'DELETE' }),
};


export interface RestockRequest {
  wishlistId: number;
  uid: string;
  productId: number;
  productName: string;
  stockStatus: 'in_stock' | 'out_of_stock';
  email: string;
  customerName: string;
  optedInAt: string;
  lastSentAt: string | null;
}
export interface StockNotification {
  id: number;
  name: string;
  country: 'NG' | 'CA';
  stockStatus: 'low_stock' | 'out_of_stock';
  variationStock: number | null;
}
export interface StockNotificationsResponse {
  lowStock: StockNotification[];
  outOfStock: StockNotification[];
  restockRequests: number;
  total: number;
}
export const adminNotificationsApi = {
  get: () => adminFetch<{ success: boolean; data: StockNotificationsResponse }>('/admin/notifications.php'),
};
export const restockApi = {
  getQueue: () => adminFetch<{ success: boolean; data: RestockRequest[] }>('/admin/restock.php'),
  handle: (wishlistId: number, action: 'send' | 'dismiss') =>
    adminFetch<{ success: boolean; action: string }>(`/admin/restock.php?action=${action}`, {
      method: 'POST', body: JSON.stringify({ wishlistId }),
    }),
};

export const ordersApi = {
  getUserOrders: () =>
    authFetch<{ success: boolean; data: Order[] }>('/orders.php').then(r => r.data),

  requestCancellation: (id: string | number, reason: string) =>
    authFetch<{ success: boolean }>(`/orders.php?id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel', reason }),
    }),

  getAll: (params?: string) =>
    adminFetch<{ data: Order[] }>(`/admin/orders.php${params ? `?${params}` : ''}`),

  updateStatus: (id: number, status: Order['status']) =>
    adminFetch<{ success: boolean }>(`/admin/orders.php?id=${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  delete: (id: number) =>
    adminFetch<{ success: boolean }>(`/admin/orders.php?id=${id}`, { method: 'DELETE' }),
};

export const customersApi = {
  getAll: () =>
    adminFetch<{ success: boolean; data: Customer[] }>('/admin/customers.php').then(r =>
      Array.isArray((r as any).data) ? (r as any).data : (Array.isArray(r) ? r : [])),

  getAdmins: () =>
    adminFetch<{ success: boolean; data: AdminUser[] }>('/admin/customers.php?type=admins'),

  createAdmin: (data: { username: string; password: string; email?: string }) =>
    adminFetch<{ success: boolean; id: number }>('/admin/customers.php?action=create_admin', {
      method: 'POST', body: JSON.stringify(data),
    }),

  deleteAdmin: (id: number) =>
    adminFetch<{ success: boolean }>(`/admin/customers.php?type=admin&id=${id}`, { method: 'DELETE' }),

  updateTag: (id: string, tags: string[]) =>
    adminFetch<{ success: boolean }>(`/admin/customers.php?id=${id}`, { method: 'PATCH', body: JSON.stringify({ tags }) }),

  setStatus: (id: string, status: Customer['status']) =>
    adminFetch<{ success: boolean }>(`/admin/customers.php?id=${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  deleteUser: (id: string) =>
    adminFetch<{ success: boolean }>(`/admin/customers.php?id=${id}`, { method: 'DELETE' }),
};

export const deliveryApi = {
  adminGetAll: () =>
    adminFetch<DeliveryZone[]>('/admin/delivery.php'),

  create: (zone: Omit<DeliveryZone, 'id'>) =>
    adminFetch<{ id: number }>('/admin/delivery.php', { method: 'POST', body: JSON.stringify(zone) }),

  update: (id: number, zone: Partial<DeliveryZone>) =>
    adminFetch<{ success: boolean }>(`/admin/delivery.php?id=${id}`, { method: 'PUT', body: JSON.stringify(zone) }),

  delete: (id: number) =>
    adminFetch<{ success: boolean }>(`/admin/delivery.php?id=${id}`, { method: 'DELETE' }),
};

export const categoriesApi = {
  adminGetAll: () =>
    adminFetch<Category[]>('/admin/categories.php'),

  create: (cat: Omit<Category, 'id'>) =>
    adminFetch<{ id: number }>('/admin/categories.php', { method: 'POST', body: JSON.stringify(cat) }),

  update: (id: number, cat: Partial<Category>) =>
    adminFetch<{ success: boolean }>(`/admin/categories.php?id=${id}`, { method: 'PUT', body: JSON.stringify(cat) }),

  delete: (id: number) =>
    adminFetch<{ success: boolean }>(`/admin/categories.php?id=${id}`, { method: 'DELETE' }),
};

export const couponsApi = {
  adminGetAll: () =>
    adminFetch<Coupon[]>('/admin/coupons.php'),

  create: (coupon: Omit<Coupon, 'id' | 'usedCount'>) =>
    adminFetch<{ id: number }>('/admin/coupons.php', { method: 'POST', body: JSON.stringify(coupon) }),

  update: (id: number, coupon: Partial<Coupon>) =>
    adminFetch<{ success: boolean }>(`/admin/coupons.php?id=${id}`, { method: 'PUT', body: JSON.stringify(coupon) }),

  delete: (id: number) =>
    adminFetch<{ success: boolean }>(`/admin/coupons.php?id=${id}`, { method: 'DELETE' }),
};

export const settingsApi = {
  get: () =>
    adminFetch<SiteSettings>('/admin/settings.php'),

  update: (settings: Partial<SiteSettings>) =>
    adminFetch<{ success: boolean }>('/admin/settings.php', { method: 'PUT', body: JSON.stringify(settings) }),
};

export const maintenanceApi = {
  getStatus: () =>
    adminFetch<{ enabled: boolean; maintenance: boolean; message: string; estimatedBack?: string }>('/admin/maintenance.php'),

  setStatus: (enabled: boolean, message: string, estimatedBack?: string, scheduledAt?: string) =>
    adminFetch<{ success: boolean }>('/admin/maintenance.php', {
      method: 'POST', body: JSON.stringify({ enabled, message, estimatedBack, scheduledAt }),
    }),
};

export const publicMaintenanceApi = {
  getStatus: () =>
    apiFetch<{ enabled: boolean; maintenance: boolean; message: string; estimatedBack?: string }>(`/maintenance.php?ts=${Date.now()}`, {
      cache: 'no-store',
    }),
};

export const commsApi = {
  broadcast: (body: { subject: string; body: string; audience: string }) =>
    adminFetch<{ sent: number }>('/admin/comms.php?action=broadcast', { method: 'POST', body: JSON.stringify(body) }),

  adminSupportAll: () =>
    adminFetch<{ success: boolean; tickets: SupportTicket[] }>('/admin/support.php')
      .then(r => (r as any).tickets ?? r),

  adminSupportReply: (id: string, reply: string, status: string) =>
    adminFetch<{ success: boolean }>(`/admin/support.php?id=${id}`, {
      method: 'POST', body: JSON.stringify({ reply, status }),
    }),
};

export const bannerApi = {
  adminGet: () =>
    adminFetch<AnnouncementBanner | null>('/admin/banner.php'),

  adminSet: (banner: AnnouncementBanner) =>
    adminFetch<{ success: boolean }>('/admin/banner.php', { method: 'POST', body: JSON.stringify(banner) }),

  adminDelete: () =>
    adminFetch<{ success: boolean }>('/admin/banner.php', { method: 'DELETE' }),
};

export const supportApi = {
  getAll: () =>
    authFetch<SupportTicket[]>('/support.php').then(r => {
      const arr = Array.isArray(r) ? r : [];
      // Normalise messages/replies keys
      return arr.map((t: any) => ({
        ...t,
        messages: t.messages ?? t.replies ?? [],
        replies:  t.messages ?? t.replies ?? [],
        createdAt: t.createdAt ?? t.created_at ?? '',
      }));
    }),

  create: (form: { subject: string; category: string; message: string }) =>
    authFetch<{ id: string; reference: string }>('/support.php', {
      method: 'POST',
      body: JSON.stringify({ subject: form.subject, body: form.message, category: form.category }),
    }),

  reply: (ticketId: string, message: string) =>
    authFetch<{ success: boolean }>(`/support.php?id=${ticketId}`, {
      method: 'POST',
      body: JSON.stringify({ body: message }),
    }),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export const productImageUrl = (path: string | null): string => {
  if (!path) return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80';
  if (path.startsWith('http')) return path;
  return `https://xpolaservices.com${path}`;
};

export const formatPrice = (amount: number, currency: string): string => {
  if (currency === 'CAD') return `CA$${Number(amount).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`;
  return `₦${Number(amount).toLocaleString('en-NG')}`;
};


// ── Contact Form API (public, no auth) ────────────────────────────────────────
export const contactApi = {
  submit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    service?: string;
    message: string;
  }) =>
    apiFetch<{ success: boolean; reference: string }>('/contact.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
