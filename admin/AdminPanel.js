/* =====================================================================
   Agrowynn Admin — panel shell
   Dashboard landing + module navigation. Filters modules to only those
   the signed-in admin is allowed to access (super admin sees all).
   ===================================================================== */
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { A, AIcon, Stat } from './ui';
import { useStore, MODULE_LIST, STATUS } from '../data/store';

import Products from './Products';
import Categories from './Categories';
import Farmers from './Farmers';
import Orders from './Orders';
import Users from './Users';
import Coupons from './Coupons';
import Delivery from './Delivery';
import Settings from './Settings';
import Reports from './Reports';
import Admins from './Admins';

const REGISTRY = { products: Products, categories: Categories, farmers: Farmers, orders: Orders, users: Users, coupons: Coupons, delivery: Delivery, settings: Settings, reports: Reports, admins: Admins };

export default function AdminPanel({ admin, onLogout }) {
  const store = useStore();
  const [active, setActive] = useState(null); // null = dashboard

  // modules this admin may access
  const allowed = MODULE_LIST.filter((m) => {
    if (m.superOnly) return admin.role === 'super';
    return admin.role === 'super' || (admin.modules || []).includes(m.key);
  });

  const Current = active ? REGISTRY[active] : null;
  const currentMeta = MODULE_LIST.find((m) => m.key === active);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: A.bg }}>
      <StatusBar barStyle="light-content" />

      {/* top bar */}
      <View style={st.topbar}>
        {active ? (
          <Pressable onPress={() => setActive(null)} style={st.back} hitSlop={8}>
            <AIcon name="arrow-left" size={20} color={A.ink} />
          </Pressable>
        ) : (
          <View style={st.brandIco}><AIcon name="shield" size={18} color={A.mint} /></View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={st.brand}>{active ? currentMeta.label : 'Agrowynn Admin'}</Text>
          <Text style={st.who}>{admin.name}{admin.role === 'super' ? ' · Super Admin' : ''}</Text>
        </View>
        <Pressable onPress={onLogout} style={st.logout} hitSlop={8}>
          <AIcon name="log-out" size={16} color={A.rose} />
          <Text style={{ color: A.rose, fontWeight: '700', fontSize: 12.5 }}>Logout</Text>
        </Pressable>
      </View>

      {Current ? (
        <Current admin={admin} />
      ) : (
        <Dashboard store={store} allowed={allowed} onOpen={setActive} admin={admin} />
      )}
    </SafeAreaView>
  );
}

function Dashboard({ store, allowed, onOpen, admin }) {
  const { products, orders, users, farmers } = store;
  const live = orders.filter((o) => o.status !== -1);
  const revenue = live.reduce((a, b) => a + b.payable, 0);
  const pending = orders.filter((o) => o.status >= 0 && o.status < STATUS.length - 1).length;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      <Text style={st.hi}>Welcome back, {(admin.name || 'Admin').split(' ')[0]} 👋</Text>
      <Text style={st.hiSub}>Here's how Agrowynn is doing today.</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, marginBottom: 8 }}>
        <Stat label="Revenue" value={`₹${Math.round(revenue)}`} icon="trending-up" color={A.mint} />
        <Stat label="Pending orders" value={pending} icon="clock" color={A.amber} />
        <Stat label="Products" value={products.length} icon="box" color={A.blue} />
        <Stat label="Customers" value={users.length} icon="users" color={A.green} />
      </View>

      <Text style={st.secTitle}>Manage</Text>
      <View style={st.tiles}>
        {allowed.map((m) => (
          <Pressable key={m.key} onPress={() => onOpen(m.key)} style={st.tile}>
            <View style={st.tileIco}><AIcon name={m.icon} size={22} color={A.mint} /></View>
            <Text style={st.tileLabel}>{m.label}</Text>
            <AIcon name="chevron-right" size={16} color={A.muted} style={{ position: 'absolute', right: 12, top: 16 }} />
          </Pressable>
        ))}
      </View>

      {allowed.length === 0 ? (
        <Text style={{ color: A.muted, textAlign: 'center', marginTop: 30 }}>
          No modules assigned to your account yet. Contact the Super Admin.
        </Text>
      ) : null}
    </ScrollView>
  );
}

import { StyleSheet } from 'react-native';
const st = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: A.line, backgroundColor: A.panel },
  brandIco: { width: 38, height: 38, borderRadius: 11, backgroundColor: A.forest, alignItems: 'center', justifyContent: 'center' },
  back: { width: 38, height: 38, borderRadius: 11, backgroundColor: A.chipBg, alignItems: 'center', justifyContent: 'center' },
  brand: { color: A.ink, fontWeight: '800', fontSize: 16 },
  who: { color: A.sub, fontSize: 12 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3a1f1f', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  hi: { color: A.ink, fontSize: 22, fontWeight: '800', marginTop: 4 },
  hiSub: { color: A.sub, fontSize: 13, marginTop: 3 },
  secTitle: { color: A.ink, fontSize: 16, fontWeight: '800', marginTop: 22, marginBottom: 12 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47%', flexGrow: 1, backgroundColor: A.card, borderWidth: 1, borderColor: A.line, borderRadius: 16, padding: 16 },
  tileIco: { width: 44, height: 44, borderRadius: 12, backgroundColor: A.chipBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tileLabel: { color: A.ink, fontWeight: '700', fontSize: 14.5 },
});
