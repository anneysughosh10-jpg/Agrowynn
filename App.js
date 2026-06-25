import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, Pressable, ScrollView, TextInput, Modal,
  SafeAreaView, StatusBar, useWindowDimensions, StyleSheet, Platform,
} from 'react-native';

// On large screens (laptop/desktop web) the app is framed to a phone width
// and centered; this is the max content width and the surrounding gutter color.
const APP_MAX_W = 480;
import { Feather } from '@expo/vector-icons';
import { useStore, STATUS, update, nextId, getState, loadSessionSync, loadSessionAsync, saveSession } from './data/store';
import AdminAuth from './admin/AdminAuth';
import AdminPanel from './admin/AdminPanel';

const LOGO = require('./assets/logo.png');

/* ---------------- brand ---------------- */
const C = {
  paper: '#EEF0E4', card: '#FFFFFF', surface: '#FBFAF3',
  forest: '#2E5A39', leaf: '#60924D', ring: '#688360', harvest: '#D98A2B',
  ink: '#243018', muted: '#8A8F7C', line: '#E4E3D5',
  badge: '#E7EEDF', amberbg: '#FBEFD9', rose: '#C75D5D', white: '#FFFFFF',
};
const Icon = (p) => <Feather {...p} />;

/* ---- reusable presentational components (module scope so they keep a
   stable identity and don't remount on every App render) ---- */
const Pill = ({ t, bg, col }) => (
  <View style={{ backgroundColor: bg || C.badge, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
    <Text style={{ color: col || C.forest, fontSize: 10.5, fontWeight: '700' }}>{t}</Text>
  </View>
);
const Btn = ({ label, onPress, icon, style, textStyle, ghost }) => (
  <Pressable onPress={onPress} style={[s.btn, ghost && s.btnGhost, style]}>
    {icon ? <Icon name={icon} size={18} color={ghost ? C.forest : '#fff'} /> : null}
    <Text style={[s.btnTxt, ghost && { color: C.forest }, textStyle]}>{label}</Text>
  </Pressable>
);
const Row = ({ l, v, col }) => (
  <View style={[s.rowBetween, { marginBottom: 5 }]}>
    <Text style={{ fontSize: 13, color: C.muted }}>{l}</Text>
    <Text style={{ fontSize: 13, color: col || C.ink, fontWeight: col ? '700' : '400' }}>{v}</Text>
  </View>
);
const Card = ({ p, wide, cardW, cart, wish, add, dec, toggleWish, setSel, setModal }) => (
  <View style={[s.card, { width: wide ? 168 : cardW }]}>
    <Pressable onPress={() => { setSel(p); setModal('product'); }} style={s.cardImg}>
      {p.image ? <Image source={{ uri: p.image }} style={{ width: '100%', height: '100%', position: 'absolute' }} /> : <Text style={{ fontSize: 50 }}>{p.emoji}</Text>}
      {p.tag ? <View style={{ position: 'absolute', top: 8, left: 8 }}><Pill t={p.tag} bg={p.tag === 'Bestseller' ? C.amberbg : C.badge} col={p.tag === 'Bestseller' ? C.harvest : C.forest} /></View> : null}
      {p.inStock === false ? <View style={{ position: 'absolute', bottom: 8, left: 8 }}><Pill t="Out of stock" bg="#F3D9D9" col={C.rose} /></View> : null}
      <Pressable onPress={() => toggleWish(p.id)} style={s.heart}>
        <Icon name="heart" size={16} color={wish.includes(p.id) ? C.rose : C.muted} />
      </Pressable>
    </Pressable>
    <View style={{ padding: 11 }}>
      <Text style={{ fontWeight: '700', color: C.ink, fontSize: 14 }}>{p.name}</Text>
      <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>🌱 {p.farmer || '—'} · {p.village || ''}</Text>
      <View style={s.rowBetween}>
        <View>
          <Text style={{ color: C.forest, fontSize: 15, fontWeight: '800' }}>
            ₹{p.price}{p.mrp > p.price ? <Text style={{ fontSize: 11, color: C.muted, fontWeight: '400', textDecorationLine: 'line-through' }}>  ₹{p.mrp}</Text> : null}
          </Text>
          <Text style={{ fontSize: 10.5, color: C.muted }}>{p.unit}</Text>
        </View>
        {p.inStock === false ? (
          <View style={[s.addBtn, { borderColor: C.line }]}><Text style={{ color: C.muted, fontWeight: '700', fontSize: 12.5 }}>SOLD OUT</Text></View>
        ) : cart[p.id] ? (
          <View style={s.stepper}>
            <Pressable onPress={() => dec(p.id)}><Icon name="minus" size={14} color="#fff" /></Pressable>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginHorizontal: 8 }}>{cart[p.id]}</Text>
            <Pressable onPress={() => add(p.id)}><Icon name="plus" size={14} color="#fff" /></Pressable>
          </View>
        ) : (
          <Pressable onPress={() => add(p.id)} style={s.addBtn}><Text style={{ color: C.forest, fontWeight: '700', fontSize: 12.5 }}>ADD</Text></Pressable>
        )}
      </View>
    </View>
  </View>
);

/* ---------------- data ----------------
   Products / categories / coupons / areas / slots / settings now all
   come from the central store (data/store.js) so the admin panel can
   edit them live. STATUS is imported from the store. */
const PAYS = [['upi', 'UPI', 'smartphone'], ['card', 'Credit / Debit card', 'credit-card'], ['cod', 'Cash on delivery', 'dollar-sign']];

/* ---------------- app ---------------- */
export default function App() {
  /* live data from the central store */
  const db = useStore();
  const PRODUCTS = db.products;
  const CATEGORIES = db.categories.filter((c) => !c.hidden);
  const AREAS = db.areas;
  const SLOTS = db.slots;
  const settings = db.settings;
  const today = new Date().toISOString().slice(0, 10);
  const activeCoupons = db.coupons.filter((c) => c.active && (!c.expiry || c.expiry >= today)); // don't offer expired coupons
  const enabledPays = PAYS.filter((p) => db.payments[p[0]]);

  // Responsive: reacts to rotation AND browser resize (unlike a one-time
  // Dimensions.get). On wide screens the content is capped to a phone frame.
  const { width: winW } = useWindowDimensions();
  const contentW = Math.min(winW, APP_MAX_W);
  const cardW = (contentW - 16 * 2 - 12) / 2;
  // maxWidth caps the flex-grown width (RN-web root is flex-row, so flex:1 would
  // otherwise fill the screen); marginHorizontal auto centers it. Full-bleed on
  // phones (width < cap), centered phone frame on laptops/desktops.
  const frameStyle = { width: '100%', maxWidth: APP_MAX_W, alignSelf: 'center', marginHorizontal: 'auto' };

  const initialSession = loadSessionSync(); // web: restore now; native: null (async restore below)
  const hydratedRef = useRef(Platform.OS === 'web');
  const [screen, setScreen] = useState(initialSession && initialSession.user ? 'app' : 'splash');
  const [adminUser, setAdminUser] = useState(null);
  const [logoTaps, setLogoTaps] = useState(0);
  const [user, setUser] = useState(initialSession && initialSession.user ? initialSession.user : null);
  const [authMode, setAuthMode] = useState('phone');
  const [authStep, setAuthStep] = useState('enter');
  const [cred, setCred] = useState({ phone: '', email: '' });
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [address, setAddress] = useState(initialSession && initialSession.address ? initialSession.address : 'Gachibowli, Hyderabad');
  const [tab, setTab] = useState('home');
  const [modal, setModal] = useState(null);
  const [sel, setSel] = useState(null);
  const [selOrder, setSelOrder] = useState(null);
  const [cart, setCart] = useState(initialSession && initialSession.cart ? initialSession.cart : {});
  const [wish, setWish] = useState(initialSession && initialSession.wish ? initialSession.wish : []);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [shopCat, setShopCat] = useState('veg');
  const [query, setQuery] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [payMethod, setPayMethod] = useState('upi');
  const [paying, setPaying] = useState(false);

  const add = (id) => setCart((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const dec = (id) => setCart((p) => { const n = { ...p }; if (!n[id]) return n; n[id]--; if (n[id] <= 0) delete n[id]; return n; });
  // Resolve cart ids to products; skip any an admin has since deleted, so the
  // total never breaks and the badge never counts items that aren't shown.
  const lines = Object.keys(cart)
    .map((id) => { const prod = PRODUCTS.find((x) => x.id === +id); return prod ? { ...prod, q: cart[id] } : null; })
    .filter(Boolean);
  const count = lines.reduce((a, b) => a + b.q, 0);
  const cartHasOOS = lines.some((l) => l.inStock === false);
  const myUserId = user && user.id ? user.id : 0;
  const myOrders = db.orders.filter((o) => o.userId === myUserId);
  const itemTotal = lines.reduce((a, b) => a + b.price * b.q, 0);
  const mrpTotal = lines.reduce((a, b) => a + b.mrp * b.q, 0);
  const saving = mrpTotal - itemTotal;
  const delivery = itemTotal >= settings.freeDeliveryThreshold || itemTotal === 0 ? 0 : settings.deliveryFee;
  let cOff = 0;
  const couponObj = activeCoupons.find((c) => c.code === coupon);
  if (couponObj && itemTotal >= (couponObj.minOrder || 0)) {
    cOff = couponObj.type === 'percent'
      ? Math.min(itemTotal * couponObj.value / 100, couponObj.cap > 0 ? couponObj.cap : Infinity) // cap 0 means "no cap"
      : couponObj.value;
    cOff = Math.min(cOff, itemTotal); // never discount more than the items cost
  }
  const payable = Math.max(0, itemTotal + delivery - cOff);
  const toggleWish = (id) => setWish((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  // If an admin disables the currently-selected payment method, fall back
  // to the first one that's still enabled so checkout stays valid.
  useEffect(() => {
    if (enabledPays.length && !enabledPays.some((p) => p[0] === payMethod)) {
      setPayMethod(enabledPays[0][0]);
    }
  }, [enabledPays, payMethod]);

  // Keep the selected delivery slot valid if an admin removes/renames slots.
  useEffect(() => {
    if (SLOTS.length && !SLOTS.includes(slot)) setSlot(SLOTS[0]);
  }, [SLOTS, slot]);

  // Reset the shop category if an admin hides or deletes the selected one.
  useEffect(() => {
    if (CATEGORIES.length && !CATEGORIES.some((c) => c.id === shopCat)) setShopCat(CATEGORIES[0].id);
  }, [CATEGORIES, shopCat]);

  // Persist the customer session (login, cart, wishlist, address) across restarts.
  useEffect(() => {
    if (hydratedRef.current) saveSession({ user, cart, wish, address });
  }, [user, cart, wish, address]);

  // Native: restore the saved session asynchronously after first paint.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    loadSessionAsync().then((sdata) => {
      if (sdata) {
        if (sdata.cart) setCart(sdata.cart);
        if (sdata.wish) setWish(sdata.wish);
        if (sdata.address) setAddress(sdata.address);
        if (sdata.user) { setUser(sdata.user); setScreen('app'); }
      }
      hydratedRef.current = true;
    }).catch(() => { hydratedRef.current = true; });
  }, []);

  // Web: paint the page background behind the centered phone frame so the
  // gutters on laptop/desktop screens look intentional rather than blank.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined' && document.body) {
      document.body.style.backgroundColor = C.ink;
    }
  }, []);

  /* Customer login — validates against the Users list in the store and
     enforces the admin "blocked" flag. Unknown contacts auto-register. */
  const doVerify = () => {
    if (otp.length !== 4) return;
    const phone = cred.phone.trim();
    const email = cred.email.trim().toLowerCase();
    const users = getState().users;
    let u = users.find((x) => (phone && x.phone === phone) || (email && (x.email || '').toLowerCase() === email));
    if (u && u.blocked) {
      setAuthError('This account has been blocked. Please contact support.');
      return;
    }
    if (!u) {
      const id = nextId(users);
      u = { id, name: authMode === 'phone' ? 'Friend' : (email.split('@')[0] || 'Friend'), phone, email: cred.email.trim(), address: '', blocked: false, joined: 'today' };
      update('users', (arr) => [u, ...arr]);
    }
    setAuthError('');
    setUser(u);
    setScreen('location');
  };

  const placeOrder = () => {
    if (settings.maintenance) return; // ordering paused
    setPaying(true);
    setTimeout(() => {
      // Re-check live state in case the store changed during the payment delay.
      if (getState().settings.maintenance) { setPaying(false); return; }
      const id = 'AGW' + Math.floor(100000 + Math.random() * 900000);
      // Single source of truth: the order lives in the store so the admin
      // panel AND the customer's "My orders" both read the same record.
      const pay = enabledPays.some((p) => p[0] === payMethod) ? payMethod : (enabledPays[0] ? enabledPays[0][0] : payMethod);
      const storeOrder = {
        id, userId: myUserId,
        userName: user && user.name ? user.name : 'Guest',
        lines: lines.map((l) => ({ id: l.id, name: l.name, emoji: l.emoji, farmer: l.farmer, village: l.village, price: l.price, q: l.q })),
        payable, slot, status: 0, pay, date: 'today',
      };
      update('orders', (arr) => [storeOrder, ...arr]);
      // Count the coupon redemption (so admin usage stats are accurate).
      if (couponObj && cOff > 0) update('coupons', (arr) => arr.map((c) => (c.id === couponObj.id ? { ...c, used: (c.used || 0) + 1 } : c)));
      setLastOrderId(id);
      setPaying(false); setCart({}); setCoupon(null); setModal('success');
    }, 1600);
  };

  // Props every Card needs (module-scope Card no longer closes over App scope).
  const cardProps = { cardW, cart, wish, add, dec, toggleWish, setSel, setModal };

  /* ---------- hidden admin routes ---------- */
  if (screen === 'adminAuth') {
    return <AdminAuth
      onSuccess={(a) => { setAdminUser(a); setScreen('admin'); }}
      onExit={() => { setScreen('splash'); setLogoTaps(0); }}
    />;
  }
  if (screen === 'admin' && adminUser) {
    return <AdminPanel admin={adminUser} onLogout={() => { setAdminUser(null); setScreen('splash'); setLogoTaps(0); }} />;
  }

  /* tap the logo 5× quickly on the splash to reveal the admin console */
  const onLogoTap = () => {
    const n = logoTaps + 1;
    if (n >= 5) { setLogoTaps(0); setScreen('adminAuth'); }
    else setLogoTaps(n);
  };
  const splashLogo = settings.logo ? { uri: settings.logo } : LOGO;

  /* ---------- screens ---------- */
  if (screen === 'splash') {
    return (
      <SafeAreaView style={[s.fill, frameStyle, { backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <StatusBar barStyle="dark-content" />
        <Pressable onPress={onLogoTap}>
          <Image source={splashLogo} style={{ width: 230, height: 230, resizeMode: 'contain' }} />
        </Pressable>
        <Text style={{ color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 16, lineHeight: 21 }}>
          {settings.tagline}
        </Text>
        <Btn label="Get started" icon="arrow-right" onPress={() => setScreen('auth')} style={{ marginTop: 28, width: '100%' }} />
        {logoTaps > 0 && logoTaps < 5 ? (
          <Text style={{ color: C.line, fontSize: 11, marginTop: 12 }}>{'•'.repeat(logoTaps)}</Text>
        ) : null}
      </SafeAreaView>
    );
  }

  if (screen === 'auth') {
    const ok = authMode === 'phone' ? cred.phone.length === 10 : cred.email.includes('@');
    return (
      <SafeAreaView style={[s.fill, frameStyle, { backgroundColor: C.paper, padding: 28, justifyContent: 'center' }]}>
        <StatusBar barStyle="dark-content" />
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Image source={LOGO} style={{ width: 120, height: 120, resizeMode: 'contain' }} />
        </View>
        <Text style={s.h1}>Welcome</Text>
        <Text style={{ color: C.muted, fontSize: 13.5, marginTop: 4, marginBottom: 18 }}>Log in or create your account to start ordering.</Text>
        {authStep === 'enter' ? (
          <>
            <View style={s.segment}>
              {['phone', 'email'].map((m) => (
                <Pressable key={m} onPress={() => setAuthMode(m)} style={[s.segBtn, authMode === m && { backgroundColor: C.forest }]}>
                  <Text style={{ fontWeight: '700', fontSize: 13.5, color: authMode === m ? '#fff' : C.muted }}>{m === 'phone' ? 'Phone' : 'Email'}</Text>
                </Pressable>
              ))}
            </View>
            {authMode === 'phone' ? (
              <View style={[s.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }]}>
                <Text style={{ paddingHorizontal: 12, paddingVertical: 13, backgroundColor: C.surface, color: C.ink, fontWeight: '600' }}>+91</Text>
                <TextInput value={cred.phone} onChangeText={(t) => setCred({ ...cred, phone: t.replace(/[^0-9]/g, '').slice(0, 10) })} placeholder="10-digit mobile number" keyboardType="number-pad" placeholderTextColor={C.muted} style={{ flex: 1, paddingHorizontal: 12, fontSize: 14.5, color: C.ink }} />
              </View>
            ) : (
              <TextInput value={cred.email} onChangeText={(t) => setCred({ ...cred, email: t })} placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={C.muted} style={s.input} />
            )}
            <Btn label="Send OTP" onPress={() => ok && setAuthStep('otp')} style={{ marginTop: 16, opacity: ok ? 1 : 0.5 }} />
            <Btn ghost label="Continue as guest" onPress={() => { setUser({ name: 'Guest', id: 'guest-' + Date.now() }); setScreen('location'); }} style={{ marginTop: 12 }} />
          </>
        ) : (
          <>
            <Text style={{ color: C.ink, fontSize: 14, marginBottom: 12 }}>Enter the code sent to {authMode === 'phone' ? '+91 ' + cred.phone : cred.email}</Text>
            <TextInput value={otp} onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="----" keyboardType="number-pad" placeholderTextColor={C.muted} style={[s.input, { textAlign: 'center', letterSpacing: 16, fontSize: 22 }]} />
            <Text style={{ color: C.muted, fontSize: 11.5, marginTop: 8 }}>Demo: type any 4 digits.</Text>
            {authError ? <Text style={{ color: C.rose, fontSize: 13, marginTop: 10, fontWeight: '600' }}>{authError}</Text> : null}
            <Btn label="Verify & continue" onPress={doVerify} style={{ marginTop: 16, opacity: otp.length === 4 ? 1 : 0.5 }} />
            <Pressable onPress={() => { setAuthStep('enter'); setAuthError(''); }} style={{ marginTop: 14, alignItems: 'center' }}><Text style={{ color: C.muted }}>Change number</Text></Pressable>
          </>
        )}
      </SafeAreaView>
    );
  }

  if (screen === 'location') {
    return (
      <SafeAreaView style={[s.fill, frameStyle, { backgroundColor: C.paper, padding: 28, justifyContent: 'center' }]}>
        <StatusBar barStyle="dark-content" />
        <Icon name="map-pin" size={38} color={C.leaf} />
        <Text style={[s.h1, { marginTop: 14 }]}>Where should we deliver?</Text>
        <Text style={{ color: C.muted, fontSize: 13.5, marginTop: 4, marginBottom: 16 }}>We currently deliver across Hyderabad.</Text>
        <ScrollView style={{ maxHeight: 320 }}>
          {AREAS.map((a) => (
            <Pressable key={a} onPress={() => { setAddress(a + ', Hyderabad'); setScreen('app'); }} style={s.areaRow}>
              <Text style={{ color: C.ink, fontSize: 15 }}>📍 {a}</Text>
              <Icon name="chevron-right" size={16} color={C.muted} />
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ---------- main tabs ---------- */
  const Home = () => (
    <ScrollView style={s.fill} contentContainerStyle={{ paddingBottom: 90 }}>
      <View style={s.headerGreen}>
        <View style={s.rowBetween}>
          <Pressable onPress={() => setModal('address')}>
            <Text style={{ color: '#cfe0c8', fontSize: 11, fontWeight: '600' }}>📍 DELIVER TO</Text>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14.5, marginTop: 2 }}>{address} ⌄</Text>
          </Pressable>
          <Pressable onPress={() => setTab('profile')} style={s.avatar}><Icon name="user" size={18} color={C.forest} /></Pressable>
        </View>
        <Pressable onPress={() => setModal('search')} style={s.searchBar}>
          <Icon name="search" size={17} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: 14, marginLeft: 8 }}>Search tomatoes, millet, A2 milk...</Text>
        </Pressable>
      </View>

      <View style={[s.offer, { marginTop: 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.harvest, fontSize: 16, fontWeight: '800' }}>{settings.bannerTitle}</Text>
          <Text style={{ color: C.ink, fontSize: 12, marginTop: 2 }}>{settings.bannerSub}</Text>
        </View>
        <Icon name="truck" size={32} color={C.harvest} />
      </View>

      <Text style={s.section}>Shop by category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {CATEGORIES.map((c) => (
          <Pressable key={c.id} onPress={() => { setShopCat(c.id); setTab('shop'); }} style={{ alignItems: 'center', width: 70 }}>
            <View style={s.catIcon}><Text style={{ fontSize: 26 }}>{c.emoji}</Text></View>
            <Text style={{ fontSize: 10.5, color: C.ink, marginTop: 5, textAlign: 'center' }}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={s.section}>This week's harvest</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {PRODUCTS.filter((p) => p.tag).map((p) => <Card key={p.id} p={p} wide {...cardProps} />)}
      </ScrollView>

      <Text style={s.section}>Bestsellers</Text>
      <View style={s.grid}>{PRODUCTS.filter((p) => p.rating >= 4.7).map((p) => <Card key={p.id} p={p} {...cardProps} />)}</View>
    </ScrollView>
  );

  const Shop = () => {
    const list = PRODUCTS.filter((p) => p.cat === shopCat);
    return (
      <View style={s.fill}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={s.h1}>Shop</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.id} onPress={() => setShopCat(c.id)} style={[s.chip, shopCat === c.id && { backgroundColor: C.forest, borderColor: C.forest }]}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: shopCat === c.id ? '#fff' : C.ink }}>{c.emoji} {c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={{ color: C.muted, fontSize: 12.5, marginTop: 10 }}>{list.length} items · all certified organic</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
          <View style={s.grid}>{list.map((p) => <Card key={p.id} p={p} {...cardProps} />)}</View>
        </ScrollView>
      </View>
    );
  };

  const Cart = () => (
    <View style={s.fill}>
      <ScrollView contentContainerStyle={{ paddingBottom: lines.length ? 170 : 90 }}>
        <Text style={[s.h1, { padding: 16 }]}>Your basket</Text>
        {lines.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }}>
            <Icon name="shopping-bag" size={44} color={C.muted} />
            <Text style={{ color: C.ink, fontWeight: '700', marginTop: 14 }}>Your basket is empty</Text>
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>Add fresh produce from this week's harvest.</Text>
            <Btn label="Start shopping" onPress={() => setTab('home')} style={{ marginTop: 16, paddingHorizontal: 22 }} />
          </View>
        ) : (
          <>
            {delivery > 0 ? (
              <View style={[s.offer, { marginTop: 0 }]}>
                <Text style={{ color: C.ink, fontSize: 12.5 }}>Add ₹{Math.max(0, Math.round(settings.freeDeliveryThreshold - itemTotal))} more for free delivery</Text>
              </View>
            ) : null}
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              {lines.map((it) => (
                <View key={it.id} style={s.cartRow}>
                  <View style={s.cartEmoji}><Text style={{ fontSize: 26 }}>{it.emoji}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: C.ink, fontSize: 14 }}>{it.name}</Text>
                    <Text style={{ fontSize: 11, color: C.muted }}>{it.farmer} · {it.unit}</Text>
                    {it.inStock === false ? <Text style={{ fontSize: 10.5, color: C.rose, fontWeight: '700', marginTop: 1 }}>Out of stock</Text> : null}
                    <Text style={{ color: C.forest, fontWeight: '700', marginTop: 2 }}>₹{it.price * it.q}</Text>
                  </View>
                  <View style={s.stepper}>
                    <Pressable onPress={() => dec(it.id)}><Icon name="minus" size={14} color="#fff" /></Pressable>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginHorizontal: 8 }}>{it.q}</Text>
                    <Pressable onPress={() => add(it.id)}><Icon name="plus" size={14} color="#fff" /></Pressable>
                  </View>
                </View>
              ))}
            </View>
            <View style={s.couponBox}>
              <Text style={{ color: C.forest, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>🏷  Apply a coupon</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {activeCoupons.length === 0 ? <Text style={{ fontSize: 12, color: C.muted }}>No coupons available right now.</Text> : activeCoupons.map((c) => (
                  <Pressable key={c.code} onPress={() => setCoupon(coupon === c.code ? null : c.code)} style={[s.coupon, coupon === c.code && { backgroundColor: C.badge, borderColor: C.forest }]}>
                    <Text style={{ color: C.forest, fontWeight: '700', fontSize: 12 }}>{coupon === c.code ? '✓ ' : ''}{c.code}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{couponObj ? couponObj.desc : 'Tap a code to apply'}</Text>
            </View>
            <View style={s.bill}>
              <Text style={{ fontWeight: '700', color: C.ink, marginBottom: 8 }}>Bill summary</Text>
              <Row l="Item total" v={'₹' + itemTotal} />
              {saving > 0 ? <Row l="Farm savings" v={'- ₹' + saving} col={C.leaf} /> : null}
              <Row l="Delivery" v={delivery ? '₹' + delivery : 'FREE'} col={delivery ? C.ink : C.leaf} />
              {cOff > 0 ? <Row l={'Coupon (' + coupon + ')'} v={'- ₹' + Math.round(cOff)} col={C.leaf} /> : null}
              <View style={[s.rowBetween, { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, marginTop: 3 }]}>
                <Text style={{ fontWeight: '700', color: C.ink }}>To pay</Text>
                <Text style={{ fontWeight: '800', color: C.forest, fontSize: 18 }}>₹{Math.round(payable)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
      {lines.length > 0 ? (
        <View style={s.checkoutBar}>
          {settings.maintenance ? (
            <View style={[s.btn, { backgroundColor: C.muted }]}>
              <Icon name="tool" size={16} color="#fff" />
              <Text style={s.btnTxt}>Ordering paused — maintenance</Text>
            </View>
          ) : cartHasOOS ? (
            <View style={[s.btn, { backgroundColor: C.muted }]}>
              <Text style={s.btnTxt}>Remove out-of-stock items to checkout</Text>
            </View>
          ) : (SLOTS.length === 0 || enabledPays.length === 0) ? (
            <View style={[s.btn, { backgroundColor: C.muted }]}>
              <Text style={s.btnTxt}>Checkout unavailable right now</Text>
            </View>
          ) : (
            <Btn label={'Proceed to checkout · ₹' + Math.round(payable)} onPress={() => setModal('checkout')} />
          )}
        </View>
      ) : null}
    </View>
  );

  const Orders = () => (
    <ScrollView style={s.fill} contentContainerStyle={{ paddingBottom: 90 }}>
      <Text style={[s.h1, { padding: 16 }]}>Your orders</Text>
      {myOrders.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 80 }}>
          <Icon name="package" size={44} color={C.muted} />
          <Text style={{ color: C.ink, fontWeight: '700', marginTop: 14 }}>No orders yet</Text>
        </View>
      ) : myOrders.map((o) => (
        <Pressable key={o.id} onPress={() => { setSelOrder(o); setModal('orderDetail'); }} style={s.orderCard}>
          <View style={s.rowBetween}>
            <Text style={{ fontWeight: '700', color: C.ink }}>#{o.id}</Text>
            <Pill t={o.status === -1 ? 'Cancelled' : STATUS[o.status]} bg={o.status === -1 ? '#F3D9D9' : undefined} col={o.status === -1 ? C.rose : undefined} />
          </View>
          <View style={[s.rowBetween, { marginTop: 8 }]}>
            <Text style={{ fontSize: 20 }}>{o.lines.slice(0, 4).map((l) => l.emoji).join(' ')}</Text>
            <Text style={{ fontWeight: '800', color: C.forest }}>₹{Math.round(o.payable)}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );

  const Profile = () => {
    const PRow = ({ icon, label, onPress, danger }) => (
      <Pressable onPress={onPress} style={s.pRow}>
        <Icon name={icon} size={18} color={danger ? C.rose : C.forest} />
        <Text style={{ flex: 1, marginLeft: 12, color: danger ? C.rose : C.ink, fontSize: 14.5, fontWeight: '600' }}>{label}</Text>
        {!danger ? <Icon name="chevron-right" size={17} color={C.muted} /> : null}
      </Pressable>
    );
    return (
      <ScrollView style={s.fill} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={[s.headerGreen, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={[s.avatar, { width: 56, height: 56 }]}><Icon name="user" size={26} color={C.forest} /></View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 19 }}>{user && user.name ? user.name : 'Friend'}</Text>
            <Text style={{ color: '#cfe0c8', fontSize: 12.5 }}>{user && user.phone ? '+91 ' + user.phone : (user && user.email) || 'Guest account'}</Text>
          </View>
        </View>
        <View style={s.pGroup}>
          <PRow icon="package" label="My orders" onPress={() => setTab('orders')} />
          <PRow icon="map-pin" label="Saved addresses" onPress={() => setModal('address')} />
          <PRow icon="heart" label={'Wishlist (' + wish.length + ')'} onPress={() => { }} />
          <PRow icon="tag" label="Offers & coupons" onPress={() => { }} />
        </View>
        <View style={s.pGroup}>
          <PRow icon="credit-card" label="Payment methods" onPress={() => { }} />
          <PRow icon="phone" label="Help & support" onPress={() => { }} />
          <PRow icon="log-out" label="Log out" danger onPress={() => { setScreen('splash'); setAuthStep('enter'); setAuthMode('phone'); setUser(null); setCart({}); setWish([]); setCoupon(null); setSelOrder(null); setLastOrderId(null); setSel(null); setQuery(''); setCred({ phone: '', email: '' }); setOtp(''); setTab('home'); setModal(null); }} />
        </View>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Image source={LOGO} style={{ width: 60, height: 60, resizeMode: 'contain' }} />
        </View>
      </ScrollView>
    );
  };

  /* ---------- modals ---------- */
  const ProductModal = () => {
    if (!sel) return null;
    const p = sel;
    const farmer = db.farmers.find((f) => f.name === p.farmer);
    return (
      <Modal visible animationType="slide" onRequestClose={() => setModal(null)}>
        <SafeAreaView style={[s.fill, frameStyle, { backgroundColor: C.paper }]}>
          <View style={s.prodImg}>
            {p.image ? <Image source={{ uri: p.image }} style={{ width: '100%', height: '100%', position: 'absolute' }} /> : <Text style={{ fontSize: 110 }}>{p.emoji}</Text>}
            <Pressable onPress={() => setModal(null)} style={[s.circBtn, { left: 14 }]}><Icon name="arrow-left" size={19} color={C.forest} /></Pressable>
            <Pressable onPress={() => toggleWish(p.id)} style={[s.circBtn, { right: 14 }]}><Icon name="heart" size={18} color={wish.includes(p.id) ? C.rose : C.muted} /></Pressable>
          </View>
          <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pill t="Certified organic" />
              <Text style={{ color: C.muted, fontSize: 12 }}>⭐ {p.rating} ({p.reviews})</Text>
            </View>
            <Text style={[s.h1, { fontSize: 24, marginTop: 8 }]}>{p.name}</Text>
            <Text style={{ marginTop: 2, color: C.forest, fontSize: 20, fontWeight: '800' }}>₹{p.price} <Text style={{ color: C.muted, fontSize: 13, fontWeight: '400' }}>· {p.unit}</Text></Text>
            <View style={s.farmerCard}>
              <View style={[s.farmerAv, { overflow: 'hidden' }]}>
                {farmer && farmer.photo ? <Image source={{ uri: farmer.photo }} style={{ width: 46, height: 46 }} /> : <Text style={{ color: C.forest, fontWeight: '800', fontSize: 18 }}>{(p.farmer || '?')[0]}</Text>}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 10.5, color: C.muted, fontWeight: '700' }}>GROWN BY</Text>
                <Text style={{ fontWeight: '700', color: C.ink, fontSize: 14 }}>{p.farmer}, {p.village}</Text>
              </View>
              {!farmer || farmer.verified ? <Icon name="check-circle" size={22} color={C.leaf} /> : null}
            </View>
            {farmer && farmer.farmPhoto ? (
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontSize: 10.5, color: C.muted, fontWeight: '700', marginBottom: 6 }}>FROM {(p.farmer || 'THE').toUpperCase()}'S FARM</Text>
                <Image source={{ uri: farmer.farmPhoto }} style={{ width: '100%', height: 170, borderRadius: 16 }} />
              </View>
            ) : null}
            <Text style={{ color: C.ink, fontSize: 14, lineHeight: 22, marginTop: 14, fontStyle: 'italic' }}>"{p.desc}"</Text>
            <Text style={{ color: C.muted, fontSize: 12.5, marginTop: 14 }}>🕓 Harvested within 24h of delivery · stored cold, never frozen</Text>
          </ScrollView>
          <View style={s.prodBar}>
            {cart[p.id] ? (
              <View style={[s.stepper, { flex: 1, justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }]}>
                <Pressable onPress={() => dec(p.id)}><Icon name="minus" size={18} color="#fff" /></Pressable>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{cart[p.id]} in basket</Text>
                <Pressable onPress={() => add(p.id)}><Icon name="plus" size={18} color="#fff" /></Pressable>
              </View>
            ) : (
              <Btn label={'Add to basket · ₹' + p.price} icon="shopping-bag" onPress={() => add(p.id)} style={{ flex: 1 }} />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const CheckoutModal = () => (
    <Modal visible animationType="slide" onRequestClose={() => setModal(null)}>
      <SafeAreaView style={[s.fill, frameStyle, { backgroundColor: C.paper }]}>
        <View style={s.modalHeader}>
          <Pressable onPress={() => setModal(null)}><Icon name="arrow-left" size={22} color={C.forest} /></Pressable>
          <Text style={[s.h1, { fontSize: 19, marginLeft: 10 }]}>Checkout</Text>
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
          <View style={s.addrCard}>
            <Icon name="map-pin" size={18} color={C.forest} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 11, color: C.muted, fontWeight: '700' }}>DELIVER TO</Text>
              <Text style={{ color: C.ink, fontSize: 13.5, fontWeight: '600' }}>{address}</Text>
            </View>
          </View>
          <Text style={s.lbl}>Delivery slot</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SLOTS.map((sl) => (
              <Pressable key={sl} onPress={() => setSlot(sl)} style={[s.slot, slot === sl && { backgroundColor: C.badge, borderColor: C.forest }]}>
                <Text style={{ fontSize: 12.5, color: C.ink, fontWeight: '600' }}>{sl}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={s.lbl}>Payment method</Text>
          {enabledPays.map((m) => (
            <Pressable key={m[0]} onPress={() => setPayMethod(m[0])} style={[s.payRow, { borderColor: payMethod === m[0] ? C.forest : C.line }]}>
              <Icon name={m[2]} size={18} color={C.forest} />
              <Text style={{ flex: 1, marginLeft: 12, color: C.ink, fontWeight: '600' }}>{m[1]}</Text>
              <View style={[s.radio, { borderColor: payMethod === m[0] ? C.forest : C.line }]}>{payMethod === m[0] ? <View style={s.radioDot} /> : null}</View>
            </Pressable>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
        <View style={s.prodBar}>
          <Btn label={(payMethod === 'cod' ? 'Place order' : 'Pay ₹' + Math.round(payable)) + ' · ' + payMethod.toUpperCase()} onPress={placeOrder} style={{ flex: 1 }} />
        </View>
      </SafeAreaView>
    </Modal>
  );

  const SuccessModal = () => {
    const o = db.orders.find((x) => x.id === lastOrderId);
    return (
      <Modal visible animationType="slide" onRequestClose={() => { setModal(null); setTab('orders'); }}>
        <SafeAreaView style={[s.fill, frameStyle, { backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', padding: 36 }]}>
          <View style={s.successCirc}><Icon name="check" size={44} color={C.forest} /></View>
          <Text style={[s.h1, { fontSize: 24, marginTop: 18 }]}>Order placed!</Text>
          <Text style={{ color: C.muted, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 21 }}>Your fresh produce is confirmed. We'll pack it at the farm and deliver in your slot.</Text>
          {o ? (
            <View style={s.okCard}>
              <Row l="Order" v={'#' + o.id} />
              <Row l="Slot" v={o.slot} />
              <Row l="Paid" v={'₹' + Math.round(o.payable)} col={C.forest} />
            </View>
          ) : null}
          {o ? <Btn label="Track order" onPress={() => { setSelOrder(o); setModal('orderDetail'); }} style={{ marginTop: 20, width: '100%' }} /> : null}
          <Pressable onPress={() => { setModal(null); setTab('home'); }} style={{ marginTop: 12 }}><Text style={{ color: C.muted, fontWeight: '600' }}>Back to home</Text></Pressable>
        </SafeAreaView>
      </Modal>
    );
  };

  const OrderDetailModal = () => {
    if (!selOrder) return null;
    // Read the live order from the store so admin status changes show here.
    const o = db.orders.find((x) => x.id === selOrder.id) || selOrder;
    const cancelled = o.status === -1;
    return (
      <Modal visible animationType="slide" onRequestClose={() => { setModal(null); setTab('orders'); }}>
        <SafeAreaView style={[s.fill, frameStyle, { backgroundColor: C.paper }]}>
          <View style={s.modalHeader}>
            <Pressable onPress={() => { setModal(null); setTab('orders'); }}><Icon name="arrow-left" size={22} color={C.forest} /></Pressable>
            <Text style={[s.h1, { fontSize: 19, marginLeft: 10 }]}>Order #{o.id}</Text>
          </View>
          <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
            {cancelled ? (
              <View style={{ backgroundColor: '#F3D9D9', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <Text style={{ color: C.rose, fontWeight: '700' }}>This order was cancelled · refund pending.</Text>
              </View>
            ) : (
              <>
                <Text style={{ fontWeight: '700', color: C.ink, marginBottom: 12 }}>Delivery status</Text>
                {STATUS.map((st, i) => (
                  <View key={st} style={{ flexDirection: 'row' }}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={[s.statusDot, { backgroundColor: i <= o.status ? C.forest : '#fff', borderColor: i <= o.status ? C.forest : C.line }]}>{i <= o.status ? <Icon name="check" size={12} color="#fff" /> : null}</View>
                      {i < 3 ? <View style={{ width: 2, height: 28, backgroundColor: i < o.status ? C.forest : C.line }} /> : null}
                    </View>
                    <Text style={{ marginLeft: 12, color: i <= o.status ? C.ink : C.muted, fontWeight: '600', fontSize: 14 }}>{st}</Text>
                  </View>
                ))}
              </>
            )}
            <Text style={{ fontWeight: '700', color: C.ink, marginTop: 20, marginBottom: 10 }}>Items</Text>
            {o.lines.map((it) => (
              <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={s.cartEmoji}><Text style={{ fontSize: 21 }}>{it.emoji}</Text></View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: C.ink, fontWeight: '600' }}>{it.name} × {it.q}</Text>
                  <Text style={{ fontSize: 11, color: C.muted }}>{it.farmer} · {it.village}</Text>
                </View>
                <Text style={{ color: C.forest, fontWeight: '700' }}>₹{it.price * it.q}</Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const AddressModal = () => (
    <Modal visible transparent animationType="slide" onRequestClose={() => setModal(null)}>
      <Pressable style={s.sheetBackdrop} onPress={() => setModal(null)}>
        <Pressable style={s.sheet} onPress={() => { }}>
          <View style={s.rowBetween}>
            <Text style={[s.h1, { fontSize: 20 }]}>Delivery address</Text>
            <Pressable onPress={() => setModal(null)}><Icon name="x" size={22} color={C.muted} /></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 360, marginTop: 8 }}>
            {AREAS.map((a) => (
              <Pressable key={a} onPress={() => { setAddress(a + ', Hyderabad'); setModal(null); }} style={s.areaRow}>
                <Text style={{ color: C.ink, fontSize: 14 }}>📍 {a}, Hyderabad</Text>
                {address === a + ', Hyderabad' ? <Icon name="check" size={17} color={C.leaf} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // Search results — computed here so the search modal can be rendered
  // INLINE (below). Rendering it as a nested component remounted the
  // TextInput on every keystroke and dropped keyboard focus.
  const searchRes = query ? PRODUCTS.filter((p) => ((p.name || '') + (p.farmer || '') + (p.village || '')).toLowerCase().includes(query.toLowerCase())) : [];

  const TABS = [['home', 'Home', 'home'], ['shop', 'Shop', 'grid'], ['cart', 'Basket', 'shopping-bag'], ['orders', 'Orders', 'package'], ['profile', 'Profile', 'user']];

  return (
    <SafeAreaView style={[s.fill, frameStyle, { backgroundColor: C.paper }]}>
      <StatusBar barStyle={tab === 'home' || tab === 'profile' ? 'light-content' : 'dark-content'} />
      {settings.maintenance ? (
        <View style={{ backgroundColor: C.harvest, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="tool" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700', flex: 1 }}>We're under maintenance — ordering is paused briefly.</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        {/* Called as functions (not <Home/>) so they're inlined into App's tree
            and NOT remounted on every render — preserves scroll/input focus. */}
        {tab === 'home' && Home()}
        {tab === 'shop' && Shop()}
        {tab === 'cart' && Cart()}
        {tab === 'orders' && Orders()}
        {tab === 'profile' && Profile()}
      </View>

      <View style={s.nav}>
        {TABS.map((t) => (
          <Pressable key={t[0]} onPress={() => setTab(t[0])} style={{ alignItems: 'center' }}>
            <Icon name={t[2]} size={21} color={tab === t[0] ? C.forest : C.muted} />
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: tab === t[0] ? C.forest : C.muted, marginTop: 3 }}>{t[1]}</Text>
            {t[0] === 'cart' && count > 0 ? <View style={s.navBadge}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count}</Text></View> : null}
          </Pressable>
        ))}
      </View>

      {modal === 'product' && ProductModal()}
      {modal === 'checkout' && CheckoutModal()}
      {modal === 'success' && SuccessModal()}
      {modal === 'orderDetail' && OrderDetailModal()}
      {modal === 'address' && AddressModal()}
      {modal === 'search' && (
        <Modal visible animationType="slide" onRequestClose={() => { setModal(null); setQuery(''); }}>
          <SafeAreaView style={[s.fill, frameStyle, { backgroundColor: C.paper }]}>
            <View style={[s.modalHeader, { alignItems: 'center' }]}>
              <Pressable onPress={() => { setModal(null); setQuery(''); }}><Icon name="arrow-left" size={22} color={C.forest} /></Pressable>
              <View style={[s.input, { flex: 1, marginLeft: 10, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }]}>
                <Icon name="search" size={17} color={C.muted} />
                <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search produce, farmer, village..." placeholderTextColor={C.muted} style={{ flex: 1, marginLeft: 8, color: C.ink, fontSize: 14.5 }} />
              </View>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
              <View style={s.grid}>{searchRes.map((p) => <Card key={p.id} p={p} {...cardProps} />)}</View>
              {query && searchRes.length === 0 ? <Text style={{ color: C.muted, textAlign: 'center', marginTop: 30 }}>No matches for "{query}".</Text> : null}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {paying ? (
        <View style={s.payingOverlay}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Processing payment...</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */
const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  android: { elevation: 2 },
});
const s = StyleSheet.create({
  fill: { flex: 1 },

  h1: { fontSize: 22, fontWeight: '800', color: C.forest },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { backgroundColor: C.forest, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnGhost: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14.5, color: C.ink },
  segment: { flexDirection: 'row', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 4, marginBottom: 14, gap: 8 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  areaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  headerGreen: { backgroundColor: C.forest, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  avatar: { width: 38, height: 38, borderRadius: 999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  searchBar: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  offer: { backgroundColor: C.amberbg, marginHorizontal: 16, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
  section: { fontSize: 17, fontWeight: '800', color: C.forest, marginHorizontal: 16, marginTop: 22, marginBottom: 10 },
  catIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, gap: 12 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 22, overflow: 'hidden', marginBottom: 12, ...shadow },
  cardImg: { height: 110, backgroundColor: '#E7EEDF', alignItems: 'center', justifyContent: 'center' },
  heart: { position: 'absolute', top: 6, right: 6, width: 30, height: 30, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.forest, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  addBtn: { borderWidth: 1.4, borderColor: C.forest, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  cartRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 12, marginBottom: 12 },
  cartEmoji: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#EEF3E6', alignItems: 'center', justifyContent: 'center' },
  couponBox: { backgroundColor: C.card, borderWidth: 1, borderColor: C.leaf, borderStyle: 'dashed', borderRadius: 18, padding: 12, marginHorizontal: 16, marginTop: 4 },
  coupon: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  bill: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 16, marginHorizontal: 16, marginTop: 12 },
  checkoutBar: { position: 'absolute', left: 0, right: 0, bottom: 74, paddingHorizontal: 16, paddingBottom: 8 },
  orderCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 16, marginHorizontal: 16, marginBottom: 12 },
  pRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.line },
  pGroup: { marginHorizontal: 16, marginTop: 16, borderRadius: 18, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  prodImg: { height: 230, backgroundColor: '#DCE8D2', alignItems: 'center', justifyContent: 'center' },
  circBtn: { position: 'absolute', top: 14, width: 36, height: 36, borderRadius: 999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  farmerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 12, marginTop: 16 },
  farmerAv: { width: 46, height: 46, borderRadius: 999, backgroundColor: C.badge, alignItems: 'center', justifyContent: 'center' },
  prodBar: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.paper },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  addrCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 12 },
  lbl: { fontWeight: '700', color: C.ink, fontSize: 14, marginTop: 18, marginBottom: 8 },
  slot: { borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9 },
  payRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: 8 },
  radio: { width: 19, height: 19, borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 999, backgroundColor: C.forest },
  successCirc: { width: 88, height: 88, borderRadius: 999, backgroundColor: C.badge, alignItems: 'center', justifyContent: 'center' },
  okCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14, marginTop: 16, width: '100%' },
  statusDot: { width: 22, height: 22, borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(20,30,22,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.paper, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, width: '100%', maxWidth: APP_MAX_W, alignSelf: 'center', marginHorizontal: 'auto' },
  nav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 74, paddingBottom: 12, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line },
  navBadge: { position: 'absolute', top: -5, right: -10, minWidth: 17, height: 17, borderRadius: 999, backgroundColor: C.harvest, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  payingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,30,22,0.6)', alignItems: 'center', justifyContent: 'center' },
});
