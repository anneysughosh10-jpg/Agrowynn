/* =====================================================================
   Admin module — Reports & Analytics
   Revenue, order stats, top products, sales by category, recent activity.
   Everything computed live from the store.
   ===================================================================== */
import React from 'react';
import { View, Text } from 'react-native';
import { A, AIcon, Screen, Card, Stat } from './ui';
import { useStore, STATUS } from '../data/store';

export default function Reports() {
  const { orders, products, users, categories, activity } = useStore();

  const live = orders.filter((o) => o.status !== -1);
  const revenue = live.reduce((a, b) => a + b.payable, 0);
  const delivered = orders.filter((o) => o.status === STATUS.length - 1).length;
  const cancelled = orders.filter((o) => o.status === -1).length;
  const avg = live.length ? Math.round(revenue / live.length) : 0;

  // units sold per product
  const unitMap = {};
  live.forEach((o) => o.lines.forEach((l) => { unitMap[l.name] = (unitMap[l.name] || 0) + l.q; }));
  const topProducts = Object.entries(unitMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // revenue per category
  const catMap = {};
  live.forEach((o) => o.lines.forEach((l) => {
    const prod = products.find((p) => p.name === l.name);
    const cat = prod ? prod.cat : 'other';
    catMap[cat] = (catMap[cat] || 0) + l.price * l.q;
  }));
  const catRows = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const catTotal = catRows.reduce((a, b) => a + b[1], 0) || 1;
  const catName = (id) => (categories.find((c) => c.id === id) || {}).name || id;

  return (
    <Screen title="Reports" subtitle="Live analytics from current data">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
        <Stat label="Total revenue" value={`₹${Math.round(revenue)}`} icon="trending-up" color={A.mint} />
        <Stat label="Orders" value={live.length} icon="package" color={A.blue} />
        <Stat label="Avg order" value={`₹${avg}`} icon="dollar-sign" color={A.amber} />
        <Stat label="Delivered" value={delivered} icon="check-circle" color={A.green} />
        <Stat label="Cancelled" value={cancelled} icon="x-circle" color={A.rose} />
        <Stat label="Customers" value={users.length} icon="users" color={A.mint} />
      </View>

      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 12 }}>🏆 Top products (units sold)</Text>
        {topProducts.length === 0 ? <Text style={{ color: A.muted }}>No sales yet.</Text> : topProducts.map(([name, q], i) => (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 9 }}>
            <Text style={{ color: A.muted, width: 22, fontWeight: '700' }}>{i + 1}</Text>
            <Text style={{ color: A.ink, flex: 1 }}>{name}</Text>
            <Text style={{ color: A.mint, fontWeight: '700' }}>{q} sold</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 12 }}>📊 Revenue by category</Text>
        {catRows.length === 0 ? <Text style={{ color: A.muted }}>No sales yet.</Text> : catRows.map(([cat, amt]) => {
          const pct = Math.round((amt / catTotal) * 100);
          return (
            <View key={cat} style={{ marginBottom: 11 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: A.ink, fontSize: 13 }}>{catName(cat)}</Text>
                <Text style={{ color: A.sub, fontSize: 12.5 }}>₹{Math.round(amt)} · {pct}%</Text>
              </View>
              <View style={{ height: 8, borderRadius: 999, backgroundColor: A.cardAlt, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: 8, backgroundColor: A.green }} />
              </View>
            </View>
          );
        })}
      </Card>

      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 12 }}>🕘 Recent admin activity</Text>
        {(!activity || activity.length === 0) ? <Text style={{ color: A.muted }}>No activity logged yet.</Text> : activity.slice(0, 12).map((a, i) => (
          <View key={i} style={{ flexDirection: 'row', marginBottom: 9 }}>
            <AIcon name="activity" size={13} color={A.muted} style={{ marginTop: 3 }} />
            <View style={{ marginLeft: 9, flex: 1 }}>
              <Text style={{ color: A.ink, fontSize: 13 }}>{a.action}</Text>
              <Text style={{ color: A.muted, fontSize: 11 }}>{a.who} · {a.at}</Text>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
