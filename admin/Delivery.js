/* =====================================================================
   Admin module — Delivery
   Manage delivery areas & time slots, set free-delivery threshold and
   delivery fee, enable/disable payment methods.
   ===================================================================== */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { A, AIcon, Screen, Btn, IconBtn, Card, Input, Toggle, useConfirm } from './ui';
import { useStore, update, setState, logActivity, PAY_LABELS } from '../data/store';

export default function Delivery({ admin }) {
  const { areas, slots, settings, payments } = useStore();
  const { confirm, confirmNode } = useConfirm();
  const [newArea, setNewArea] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [fee, setFee] = useState(String(settings.deliveryFee));
  const [thr, setThr] = useState(String(settings.freeDeliveryThreshold));

  const addArea = () => {
    if (!newArea.trim()) return;
    update('areas', (a) => [...a, newArea.trim()]);
    logActivity(admin.name, `Added delivery area "${newArea.trim()}"`);
    setNewArea('');
  };
  const delArea = (a) => confirm(`Remove area "${a}"?`, () => update('areas', (arr) => arr.filter((x) => x !== a)));

  const addSlot = () => {
    if (!newSlot.trim()) return;
    update('slots', (a) => [...a, newSlot.trim()]);
    logActivity(admin.name, `Added slot "${newSlot.trim()}"`);
    setNewSlot('');
  };
  const delSlot = (s) => confirm(`Remove slot "${s}"?`, () => update('slots', (arr) => arr.filter((x) => x !== s)));

  const saveFees = () => {
    setState((st) => ({ ...st, settings: { ...st.settings, deliveryFee: Number(fee) || 0, freeDeliveryThreshold: Number(thr) || 0 } }));
    logActivity(admin.name, 'Updated delivery fees');
  };

  const togglePay = (k) => setState((st) => ({ ...st, payments: { ...st.payments, [k]: !st.payments[k] } }));

  return (
    <Screen title="Delivery" subtitle={`${areas.length} areas · ${slots.length} slots`}>
      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 10 }}>💰 Fees</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Input label="Free delivery over ₹" value={thr} onChangeText={(t) => setThr(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Input label="Delivery fee ₹" value={fee} onChangeText={(t) => setFee(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" /></View>
        </View>
        <Btn label="Save fees" icon="save" small onPress={saveFees} />
      </Card>

      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 10 }}>💳 Payment methods</Text>
        {Object.keys(PAY_LABELS).map((k) => (
          <Toggle key={k} label={PAY_LABELS[k]} value={payments[k]} onValueChange={() => togglePay(k)} />
        ))}
      </Card>

      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 10 }}>📍 Delivery areas</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {areas.map((a) => (
            <View key={a} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: A.chipBg, borderRadius: 999, paddingLeft: 12, paddingRight: 6, paddingVertical: 6 }}>
              <Text style={{ color: A.ink, fontSize: 12.5 }}>{a}</Text>
              <Pressable onPress={() => delArea(a)} hitSlop={6}><AIcon name="x" size={13} color={A.rose} /></Pressable>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}><Input value={newArea} onChangeText={setNewArea} placeholder="New area name" /></View>
          <Btn label="Add" icon="plus" small onPress={addArea} style={{ marginBottom: 12 }} />
        </View>
      </Card>

      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 10 }}>🕓 Delivery slots</Text>
        {slots.map((s) => (
          <View key={s} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: A.line }}>
            <Text style={{ color: A.ink, fontSize: 13.5 }}>{s}</Text>
            <IconBtn icon="trash-2" color={A.rose} onPress={() => delSlot(s)} />
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end', marginTop: 12 }}>
          <View style={{ flex: 1 }}><Input value={newSlot} onChangeText={setNewSlot} placeholder="e.g. Sun, 10-12 AM" /></View>
          <Btn label="Add" icon="plus" small onPress={addSlot} style={{ marginBottom: 12 }} />
        </View>
      </Card>
      {confirmNode}
    </Screen>
  );
}
