/* =====================================================================
   Admin module — Coupons & Promotions
   Create/edit/delete coupons, enable/disable, edit the homepage banner.
   ===================================================================== */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { A, AIcon, Screen, Btn, IconBtn, Card, Tag, Empty, Input, ChipRow, Toggle, FormModal, useConfirm } from './ui';
import { useStore, update, setState, logActivity, nextId } from '../data/store';

const blank = { code: '', type: 'percent', value: '', cap: '', minOrder: '', expiry: '2026-12-31', active: true };

export default function Coupons({ admin }) {
  const { coupons, settings } = useStore();
  const { confirm, confirmNode } = useConfirm();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [banner, setBanner] = useState({ title: settings.bannerTitle, sub: settings.bannerSub });
  // Re-sync the banner editor if the stored banner changes elsewhere.
  useEffect(() => { setBanner({ title: settings.bannerTitle, sub: settings.bannerSub }); }, [settings.bannerTitle, settings.bannerSub]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const codeClash = (code, selfId) => coupons.some((c) => c.code.toUpperCase() === code && c.id !== selfId);

  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (c) => { setForm({ ...c, value: String(c.value), cap: String(c.cap), minOrder: String(c.minOrder) }); setEditing(c); };

  const describe = (c) => c.type === 'percent'
    ? `${c.value}% off${c.cap ? `, up to ₹${c.cap}` : ''}${c.minOrder ? ` over ₹${c.minOrder}` : ''}`
    : `₹${c.value} off${c.minOrder ? ` over ₹${c.minOrder}` : ''}`;

  const save = () => {
    const code = form.code.trim().toUpperCase();
    if (!code) return;
    const selfId = editing === 'new' ? null : editing.id;
    if (codeClash(code, selfId)) return; // duplicate code; UI hint below covers it
    const clean = {
      code, type: form.type,
      value: Number(form.value) || 0, cap: Number(form.cap) || 0,
      minOrder: Number(form.minOrder) || 0, expiry: form.expiry, active: form.active,
    };
    clean.desc = describe(clean);
    if (editing === 'new') {
      const id = nextId(coupons);
      update('coupons', (arr) => [{ ...clean, id, used: 0 }, ...arr]);
      logActivity(admin.name, `Created coupon ${code}`);
    } else {
      update('coupons', (arr) => arr.map((x) => (x.id === editing.id ? { ...x, ...clean } : x)));
      logActivity(admin.name, `Edited coupon ${code}`);
    }
    setEditing(null);
  };

  const del = (c) => confirm(`Delete coupon ${c.code}?`, () => {
    update('coupons', (arr) => arr.filter((x) => x.id !== c.id));
    logActivity(admin.name, `Deleted coupon ${c.code}`);
  });

  const toggle = (c) => update('coupons', (arr) => arr.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));

  const saveBanner = () => {
    setState((s) => ({ ...s, settings: { ...s.settings, bannerTitle: banner.title, bannerSub: banner.sub } }));
    logActivity(admin.name, 'Updated homepage banner');
  };

  return (
    <Screen title="Coupons" subtitle={`${coupons.length} coupons · ${coupons.filter((c) => c.active).length} active`} action={<Btn label="Add" icon="plus" small onPress={openNew} />}>
      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 10 }}>🏷  Homepage banner</Text>
        <Input label="Banner title" value={banner.title} onChangeText={(t) => setBanner((b) => ({ ...b, title: t }))} />
        <Input label="Banner subtitle" value={banner.sub} onChangeText={(t) => setBanner((b) => ({ ...b, sub: t }))} />
        <Btn label="Save banner" icon="save" small onPress={saveBanner} />
      </Card>

      {coupons.length === 0 ? <Empty icon="tag" text="No coupons" /> : coupons.map((c) => (
        <Card key={c.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: A.ink, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>{c.code}</Text>
                <Tag t={c.active ? 'Active' : 'Disabled'} color={c.active ? A.mint : A.muted} />
              </View>
              <Text style={{ color: A.sub, fontSize: 12.5, marginTop: 3 }}>{c.desc}</Text>
              <Text style={{ color: A.muted, fontSize: 11.5, marginTop: 2 }}>Used {c.used}× · expires {c.expiry}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <IconBtn icon={c.active ? 'toggle-right' : 'toggle-left'} color={c.active ? A.mint : A.muted} onPress={() => toggle(c)} />
              <IconBtn icon="edit-2" onPress={() => openEdit(c)} />
              <IconBtn icon="trash-2" color={A.rose} onPress={() => del(c)} />
            </View>
          </View>
        </Card>
      ))}

      <FormModal visible={!!editing} title={editing === 'new' ? 'Add coupon' : 'Edit coupon'} onClose={() => setEditing(null)} onSave={save}>
        <Input label="Code" value={form.code} onChangeText={(t) => set('code', t.toUpperCase())} placeholder="FRESH10" />
        {form.code.trim() && codeClash(form.code.trim().toUpperCase(), editing === 'new' ? null : editing.id) ? <Text style={{ color: A.rose, fontSize: 11.5, marginTop: -8, marginBottom: 10 }}>That coupon code already exists.</Text> : null}
        <Text style={{ color: A.sub, fontSize: 12.5, fontWeight: '700', marginBottom: 6 }}>Type</Text>
        <ChipRow options={[{ value: 'percent', label: '% Percent off' }, { value: 'flat', label: '₹ Flat off' }]} value={form.type} onChange={(v) => set('type', v)} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Input label={form.type === 'percent' ? 'Percent %' : 'Amount ₹'} value={form.value} onChangeText={(t) => set('value', t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" /></View>
          {form.type === 'percent' ? <View style={{ flex: 1 }}><Input label="Max cap ₹" value={form.cap} onChangeText={(t) => set('cap', t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" /></View> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Input label="Min order ₹" value={form.minOrder} onChangeText={(t) => set('minOrder', t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Input label="Expiry (YYYY-MM-DD)" value={form.expiry} onChangeText={(t) => set('expiry', t)} /></View>
        </View>
        <Toggle label="Active" value={form.active} onValueChange={(v) => set('active', v)} />
      </FormModal>
      {confirmNode}
    </Screen>
  );
}
