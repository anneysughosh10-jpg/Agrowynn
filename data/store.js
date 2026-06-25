/* =====================================================================
   Agrowynn — central data store
   Single source of truth for BOTH the customer app and the admin panel.
   - Mock data seeded on first run
   - Persisted to localStorage (web) so edits survive a refresh
   - Tiny pub/sub so any screen re-renders when data changes
   ===================================================================== */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'agrowynn_db_v2';

/* ---------------- cross-platform persistence ----------------
   Web: synchronous localStorage (instant first paint, no flash).
   Native (iOS/Android): AsyncStorage — the store seeds synchronously
   in memory, then hydrates from disk right after first paint. Every
   change is written back so edits survive an app restart.          */
const isWeb = Platform.OS === 'web' && typeof localStorage !== 'undefined';

function readSync() {
  if (!isWeb) return null;
  try { return localStorage.getItem(KEY); } catch { return null; }
}
function persist(str) {
  if (isWeb) { try { localStorage.setItem(KEY, str); } catch { /* quota / private mode */ } }
  else { AsyncStorage.setItem(KEY, str).catch(() => {}); }
}

/* ---------------- seed data ---------------- */
const seed = () => ({
  categories: [
    { id: 'veg', name: 'Vegetables', emoji: '🥕', hidden: false },
    { id: 'greens', name: 'Leafy Greens', emoji: '🥬', hidden: false },
    { id: 'fruit', name: 'Fruits', emoji: '🍎', hidden: false },
    { id: 'grain', name: 'Grains & Millets', emoji: '🌾', hidden: false },
    { id: 'dairy', name: 'Dairy', emoji: '🥛', hidden: false },
    { id: 'herb', name: 'Herbs & Spices', emoji: '🌿', hidden: false },
  ],
  products: [
    p(1, 'Tomatoes', '🍅', 'veg', 54, 70, '1 kg', 'Lakshmi', 'Chevella', 4.8, 212, 'Vine-ripened naati tomatoes, picked the morning of delivery.', 'Bestseller'),
    p(2, 'Okra (Bhindi)', '🫛', 'veg', 62, 80, '500 g', 'Ramesh', 'Shankarpally', 4.6, 98, 'Tender okra grown without a single chemical spray.', 'Fresh today'),
    p(3, 'Brinjal', '🍆', 'veg', 44, 55, '500 g', 'Naresh', 'Chevella', 4.5, 64, 'Small purple variety, grown the traditional way.', null),
    p(4, 'Spinach (Palak)', '🥬', 'greens', 28, 35, '1 bunch', 'Anjamma', 'Vikarabad', 4.9, 154, 'Cut to order so the leaves reach you crisp.', 'Bestseller'),
    p(5, 'Coriander', '🌿', 'greens', 18, 25, '1 bunch', 'Anjamma', 'Vikarabad', 4.7, 73, 'Fragrant coriander, fresh from the bed.', null),
    p(6, 'Bananas', '🍌', 'fruit', 48, 60, '1 dozen', 'Saroja', 'Nagarkurnool', 4.6, 187, 'Naturally ripened, never carbide-treated.', 'Fresh today'),
    p(7, 'Guava', '🍐', 'fruit', 72, 90, '1 kg', 'Venkatesh', 'Moinabad', 4.7, 56, 'Sweet, seed-light guava, ripened on the tree.', null),
    p(8, 'Pomegranate', '🔴', 'fruit', 140, 180, '1 kg', 'Venkatesh', 'Moinabad', 4.8, 90, 'Deep-red arils from a sun-rich orchard.', null),
    p(9, 'Foxtail Millet', '🌾', 'grain', 110, 130, '1 kg', 'Ramulu', 'Zaheerabad', 4.9, 132, 'From a women farmers collective.', 'Bestseller'),
    p(10, 'A2 Gir Cow Milk', '🥛', 'dairy', 90, 90, '1 litre', 'Yadagiri', 'Sangareddy', 4.9, 220, 'Fresh A2 milk from free-grazing Gir cows.', 'New'),
    p(11, 'A2 Curd', '🍶', 'dairy', 70, 80, '500 g', 'Yadagiri', 'Sangareddy', 4.8, 76, 'Set fresh daily from A2 Gir-cow milk.', null),
    p(12, 'Turmeric', '🟡', 'herb', 95, 120, '250 g', 'Srinivas', 'Nizamabad', 4.7, 60, 'High-curcumin Nizamabad turmeric, sun-dried.', null),
    p(13, 'Carrots', '🥕', 'veg', 50, 65, '1 kg', 'Padma', 'Medak', 4.6, 88, 'Crunchy red carrots, sweet and pesticide-free.', 'Fresh today'),
    p(14, 'Green Peas', '🟢', 'veg', 70, 90, '500 g', 'Padma', 'Medak', 4.5, 41, 'Hand-shelled tender peas from the winter crop.', null),
    p(15, 'Cabbage', '🥬', 'veg', 32, 40, '1 piece', 'Naresh', 'Chevella', 4.4, 52, 'Tight, fresh-cut cabbage heads.', null),
    p(16, 'Mint (Pudina)', '🌿', 'greens', 16, 22, '1 bunch', 'Lakshmamma', 'Vikarabad', 4.8, 64, 'Aromatic mint, cut to order.', null),
    p(17, 'Fenugreek (Methi)', '🍃', 'greens', 24, 30, '1 bunch', 'Lakshmamma', 'Vikarabad', 4.6, 38, 'Fresh methi leaves, slightly bitter and tender.', null),
    p(18, 'Alphonso Mango', '🥭', 'fruit', 220, 280, '1 kg', 'Saroja', 'Nagarkurnool', 4.9, 145, 'Seasonal Alphonso, naturally ripened.', 'New'),
    p(19, 'Papaya', '🫧', 'fruit', 45, 60, '1 piece', 'Venkatesh', 'Moinabad', 4.5, 47, 'Sweet ripe papaya, great for breakfast.', null),
    p(20, 'Little Millet', '🌾', 'grain', 105, 125, '1 kg', 'Ramulu', 'Zaheerabad', 4.7, 59, 'Light, easy-to-digest little millet.', null),
    p(21, 'Brown Rice', '🍚', 'grain', 85, 100, '1 kg', 'Govind', 'Sangareddy', 4.6, 73, 'Unpolished brown rice, fibre-rich.', 'Bestseller'),
    p(22, 'A2 Cow Ghee', '🧈', 'dairy', 650, 720, '500 ml', 'Govind', 'Sangareddy', 4.9, 168, 'Hand-churned bilona ghee from A2 milk.', 'Bestseller'),
    p(23, 'Paneer', '🧀', 'dairy', 110, 130, '250 g', 'Yadagiri', 'Sangareddy', 4.7, 84, 'Soft fresh paneer, made every morning.', 'Fresh today'),
    p(24, 'Black Pepper', '⚫', 'herb', 130, 160, '100 g', 'Srinivas', 'Nizamabad', 4.8, 52, 'Bold, sun-dried black peppercorns.', null),
    p(25, 'Green Chilli', '🌶️', 'veg', 30, 40, '250 g', 'Ramesh', 'Shankarpally', 4.5, 61, 'Spicy fresh green chillies.', null),
    p(26, 'Sweet Lime (Mosambi)', '🍈', 'fruit', 60, 75, '1 kg', 'Venkatesh', 'Moinabad', 4.6, 49, 'Juicy mosambi, perfect for fresh juice.', null),
  ],
  farmers: [
    // photo = farmer portrait, farmPhoto = their field/farm. Admins can replace via upload.
    f('Lakshmi', 'Chevella', '98480 11111', true, 'https://i.pravatar.cc/200?img=45', 'https://picsum.photos/seed/farm-chevella/500/320'),
    f('Ramesh', 'Shankarpally', '98480 22222', true, 'https://i.pravatar.cc/200?img=12', 'https://picsum.photos/seed/farm-shankarpally/500/320'),
    f('Naresh', 'Chevella', '98480 33333', false, 'https://i.pravatar.cc/200?img=33', 'https://picsum.photos/seed/farm-naresh/500/320'),
    f('Anjamma', 'Vikarabad', '98480 44444', true, 'https://i.pravatar.cc/200?img=47', 'https://picsum.photos/seed/farm-vikarabad/500/320'),
    f('Saroja', 'Nagarkurnool', '98480 55555', true, 'https://i.pravatar.cc/200?img=44', 'https://picsum.photos/seed/farm-nagarkurnool/500/320'),
    f('Venkatesh', 'Moinabad', '98480 66666', true, 'https://i.pravatar.cc/200?img=15', 'https://picsum.photos/seed/farm-moinabad/500/320'),
    f('Ramulu', 'Zaheerabad', '98480 77777', true, 'https://i.pravatar.cc/200?img=51', 'https://picsum.photos/seed/farm-zaheerabad/500/320'),
    f('Yadagiri', 'Sangareddy', '98480 88888', true, 'https://i.pravatar.cc/200?img=53', 'https://picsum.photos/seed/farm-sangareddy/500/320'),
    f('Srinivas', 'Nizamabad', '98480 99999', false, 'https://i.pravatar.cc/200?img=59', 'https://picsum.photos/seed/farm-nizamabad/500/320'),
    f('Padma', 'Medak', '98481 10101', true, 'https://i.pravatar.cc/200?img=49', 'https://picsum.photos/seed/farm-medak/500/320'),
    f('Govind', 'Sangareddy', '98481 20202', true, 'https://i.pravatar.cc/200?img=68', 'https://picsum.photos/seed/farm-govind/500/320'),
    f('Lakshmamma', 'Vikarabad', '98481 30303', false, 'https://i.pravatar.cc/200?img=24', 'https://picsum.photos/seed/farm-lakshmamma/500/320'),
  ],
  users: [
    u(1, 'Priya Sharma', '9876500001', 'priya@example.com', 'Gachibowli, Hyderabad', false),
    u(2, 'Arjun Reddy', '9876500002', 'arjun@example.com', 'Madhapur, Hyderabad', false),
    u(3, 'Sneha Rao', '9876500003', 'sneha@example.com', 'Kondapur, Hyderabad', false),
    u(4, 'Karthik N', '9876500004', 'karthik@example.com', 'Banjara Hills, Hyderabad', true),
  ],
  orders: [
    o('AGW100001', 1, 'Priya Sharma', [{ id: 1, name: 'Tomatoes', emoji: '🍅', farmer: 'Lakshmi', village: 'Chevella', price: 54, q: 2 }, { id: 4, name: 'Spinach (Palak)', emoji: '🥬', farmer: 'Anjamma', village: 'Vikarabad', price: 28, q: 1 }], 136, 'Today, 6-8 PM', 2, 'upi'),
    o('AGW100002', 2, 'Arjun Reddy', [{ id: 10, name: 'A2 Gir Cow Milk', emoji: '🥛', farmer: 'Yadagiri', village: 'Sangareddy', price: 90, q: 2 }], 180, 'Tomorrow, 7-9 AM', 0, 'cod'),
    o('AGW100003', 3, 'Sneha Rao', [{ id: 9, name: 'Foxtail Millet', emoji: '🌾', farmer: 'Ramulu', village: 'Zaheerabad', price: 110, q: 1 }, { id: 8, name: 'Pomegranate', emoji: '🔴', farmer: 'Venkatesh', village: 'Moinabad', price: 140, q: 1 }], 250, 'Tomorrow, 6-8 PM', 3, 'card'),
  ],
  coupons: [
    { code: 'FRESH10', type: 'percent', value: 10, cap: 50, minOrder: 0, expiry: '2026-12-31', active: true, used: 42, desc: '10% off, up to ₹50' },
    { code: 'FARMER50', type: 'flat', value: 50, cap: 50, minOrder: 499, expiry: '2026-12-31', active: true, used: 18, desc: '₹50 off over ₹499' },
  ],
  areas: ['Gachibowli', 'Madhapur', 'Kondapur', 'Banjara Hills', 'Jubilee Hills', 'Kukatpally', 'Manikonda', 'Begumpet'],
  slots: ['Today, 6-8 PM', 'Tomorrow, 7-9 AM', 'Tomorrow, 6-8 PM', 'Sat, 7-9 AM'],
  payments: { upi: true, card: true, cod: true },
  settings: {
    tagline: '100% organic produce, brought straight from named farmers near you, with the story of who grew it.',
    bannerTitle: 'Free delivery over ₹299',
    bannerSub: 'Use code FRESH10 for 10% off your first order',
    freeDeliveryThreshold: 299,
    deliveryFee: 29,
    supportPhone: '1800-AGROWYNN',
    supportEmail: 'help@agrowynn.com',
    maintenance: false,
  },
  admins: [
    // Super admin — the master account. Username: superadmin / Password: agrowynn@123
    { id: 1, name: 'Super Admin', username: 'superadmin', password: 'agrowynn@123', role: 'super', active: true, modules: ALL_MODULES() },
  ],
  activity: [],
});

function p(id, name, emoji, cat, price, mrp, unit, farmer, village, rating, reviews, desc, tag) {
  return { id, name, emoji, image: null, cat, price, mrp, unit, farmer, village, rating, reviews, desc, tag, inStock: true };
}
function f(name, village, phone, verified, photo, farmPhoto) {
  return { id: name.toLowerCase().replace(/\s+/g, '-'), name, village, phone, photo: photo || null, farmPhoto: farmPhoto || null, verified };
}
function u(id, name, phone, email, address, blocked) {
  return { id, name, phone, email, address, blocked, joined: '2026-05-01' };
}
function o(id, userId, userName, lines, payable, slot, status, pay) {
  return { id, userId, userName, lines, payable, slot, status, pay, date: '2026-06-20' };
}
function ALL_MODULES() {
  return ['products', 'categories', 'farmers', 'orders', 'users', 'coupons', 'delivery', 'settings', 'reports', 'admins'];
}
export const MODULE_LIST = [
  { key: 'products', label: 'Products', icon: 'box' },
  { key: 'categories', label: 'Categories', icon: 'grid' },
  { key: 'farmers', label: 'Farmers', icon: 'user-check' },
  { key: 'orders', label: 'Orders', icon: 'package' },
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'coupons', label: 'Coupons', icon: 'tag' },
  { key: 'delivery', label: 'Delivery', icon: 'truck' },
  { key: 'settings', label: 'App Settings', icon: 'settings' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart-2' },
  { key: 'admins', label: 'Admins', icon: 'shield', superOnly: true },
];

/* ---------------- the store ---------------- */
let state = load();
const listeners = new Set();

function load() {
  const raw = readSync(); // web only; native returns null and hydrates below
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // shallow-merge missing top-level keys from a fresh seed (forward-compat)
      return { ...seed(), ...parsed };
    } catch { /* fall through to seed */ }
  }
  const s = seed();
  if (isWeb) persist(JSON.stringify(s)); // native persists after hydration check
  return s;
}

/* Native: hydrate from AsyncStorage after first paint. If nothing is
   saved yet, persist the seed once. (Reads/writes are async on device.) */
if (!isWeb) {
  AsyncStorage.getItem(KEY).then((raw) => {
    if (raw) {
      try { state = { ...seed(), ...JSON.parse(raw) }; listeners.forEach((l) => l()); return; } catch { /* corrupt */ }
    }
    persist(JSON.stringify(state));
  }).catch(() => {});
}

function commit(next) {
  state = next;
  persist(JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function getState() { return state; }

export function setState(patch) {
  const next = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
  commit(next);
}

/** Replace one collection (array) by key with an updater fn. */
export function update(key, updater) {
  commit({ ...state, [key]: updater(state[key]) });
}

/** Wipe everything and re-seed (used by the "Reset demo data" button). */
export function resetAll() {
  commit(seed());
}

/** React hook — re-renders the component whenever the store changes. */
export function useStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);
  return state;
}

/* ---------------- helpers shared across modules ---------------- */
export function logActivity(who, action) {
  update('activity', (a) => [{ who, action, at: stamp() }, ...a].slice(0, 200));
}
function stamp() {
  // Avoid Date.now()/new Date() restrictions in some runtimes by guarding.
  try { return new Date().toLocaleString(); } catch { return 'recently'; }
}
export function nextId(arr) {
  return arr.reduce((m, x) => Math.max(m, typeof x.id === 'number' ? x.id : 0), 0) + 1;
}
export const STATUS = ['Confirmed', 'Packed at farm', 'Out for delivery', 'Delivered'];
export const PAY_LABELS = { upi: 'UPI', card: 'Card', cod: 'Cash on delivery' };
