/* =====================================================================
   Admin module — Orders
   View all orders, filter by status, advance/cancel status, view items.
   ===================================================================== */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { A, AIcon, Screen, Btn, IconBtn, Card, Tag, Empty, ChipRow, FormModal, useConfirm } from './ui';
import { useStore, update, logActivity, STATUS, PAY_LABELS } from '../data/store';

const STATUS_COLORS = [A.blue, A.amber, A.green, A.mint];

export default function Orders({ admin }) {
  const { orders } = useStore();
  const { confirm, confirmNode } = useConfirm();
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const advance = (o) => {
    // Derive the next status from the CURRENT stored record, not the captured
    // snapshot, so rapid double-taps can't skip or mislabel a step.
    const cur = orders.find((x) => x.id === o.id) || o;
    if (cur.status >= STATUS.length - 1 || cur.status === -1) return;
    const next = cur.status + 1;
    update('orders', (arr) => arr.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
    logActivity(admin.name, `Advanced order #${o.id} to "${STATUS[next]}"`);
    setOpen((p) => (p && p.id === o.id ? { ...p, status: next } : p));
  };

  const cancel = (o) => confirm(`Cancel order #${o.id} and mark for refund?`, () => {
    update('orders', (arr) => arr.map((x) => (x.id === o.id ? { ...x, status: -1 } : x)));
    logActivity(admin.name, `Cancelled order #${o.id}`);
    setOpen(null);
  });

  const list = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'cancelled') return o.status === -1;
    return String(o.status) === filter;
  });

  const statusTag = (s) => s === -1
    ? <Tag t="Cancelled" color={A.rose} bg="#3a1f1f" />
    : <Tag t={STATUS[s]} color={STATUS_COLORS[s]} />;

  const revenue = orders.filter((o) => o.status !== -1).reduce((a, b) => a + b.payable, 0);

  return (
    <Screen title="Orders" subtitle={`${orders.length} orders · ₹${Math.round(revenue)} revenue`}>
      <ChipRow
        options={[{ value: 'all', label: 'All' }, ...STATUS.map((s, i) => ({ value: String(i), label: s })), { value: 'cancelled', label: 'Cancelled' }]}
        value={filter} onChange={setFilter}
      />
      {list.length === 0 ? <Empty icon="package" text="No orders here" /> : list.map((o) => (
        <Pressable key={o.id} onPress={() => setOpen(o)}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: A.ink, fontWeight: '700' }}>#{o.id}</Text>
              {statusTag(o.status)}
            </View>
            <Text style={{ color: A.sub, fontSize: 12.5, marginTop: 6 }}>{o.userName} · {o.slot}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 18 }}>{o.lines.slice(0, 5).map((l) => l.emoji).join(' ')}</Text>
              <Text style={{ color: A.mint, fontWeight: '800' }}>₹{Math.round(o.payable)}</Text>
            </View>
          </Card>
        </Pressable>
      ))}

      <FormModal
        visible={!!open}
        title={open ? `Order #${open.id}` : ''}
        onClose={() => setOpen(null)}
        onSave={() => setOpen(null)}
        saveLabel="Done"
      >
        {open ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              {statusTag(open.status)}
              <Text style={{ color: A.sub, fontSize: 12.5 }}>{PAY_LABELS[open.pay]} · {open.date}</Text>
            </View>
            <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 4 }}>{open.userName}</Text>
            <Text style={{ color: A.sub, fontSize: 12.5, marginBottom: 12 }}>Slot: {open.slot}</Text>

            <Text style={{ color: A.sub, fontWeight: '700', fontSize: 12.5, marginBottom: 8 }}>ITEMS</Text>
            {open.lines.map((it) => (
              <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 22 }}>{it.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: A.ink, fontWeight: '600' }}>{it.name} × {it.q}</Text>
                  <Text style={{ color: A.muted, fontSize: 11.5 }}>{it.farmer} · {it.village}</Text>
                </View>
                <Text style={{ color: A.mint, fontWeight: '700' }}>₹{it.price * it.q}</Text>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderTopColor: A.line, marginTop: 8, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: A.ink, fontWeight: '700' }}>Total paid</Text>
              <Text style={{ color: A.mint, fontWeight: '800', fontSize: 16 }}>₹{Math.round(open.payable)}</Text>
            </View>

            {open.status !== -1 ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                {open.status < STATUS.length - 1 ? (
                  <Btn label={`Mark "${STATUS[open.status + 1]}"`} icon="arrow-right" onPress={() => advance(open)} style={{ flex: 1 }} />
                ) : (
                  <Btn ghost label="Delivered ✓" onPress={() => {}} style={{ flex: 1 }} />
                )}
                <Btn danger label="Cancel" icon="x-circle" onPress={() => cancel(open)} />
              </View>
            ) : (
              <Text style={{ color: A.rose, marginTop: 14, fontWeight: '600' }}>This order was cancelled · refund pending.</Text>
            )}
          </View>
        ) : null}
      </FormModal>
      {confirmNode}
    </Screen>
  );
}
