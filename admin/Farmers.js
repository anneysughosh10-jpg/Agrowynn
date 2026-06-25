/* =====================================================================
   Admin module — Farmers / Vendors
   Add / edit / delete farmers, mark verified, see linked products.
   ===================================================================== */
import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { A, AIcon, Screen, Btn, IconBtn, Card, Tag, Empty, Input, Toggle, FormModal, useConfirm, ImageUpload } from './ui';
import { useStore, update, logActivity, uniqueId } from '../data/store';

const blank = { name: '', village: '', phone: '', photo: '', farmPhoto: '', verified: false };

export default function Farmers({ admin }) {
  const { farmers, products } = useStore();
  const { confirm, confirmNode } = useConfirm();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (f) => { setForm({ ...f, photo: f.photo || '', farmPhoto: f.farmPhoto || '' }); setEditing(f); };

  const save = () => {
    if (!form.name.trim()) return;
    const clean = { ...form, name: form.name.trim(), photo: form.photo || null, farmPhoto: form.farmPhoto || null };
    if (editing === 'new') {
      const id = uniqueId(farmers, clean.name.toLowerCase().replace(/\s+/g, '-'));
      update('farmers', (arr) => [...arr, { ...clean, id }]);
      logActivity(admin.name, `Added farmer "${clean.name}"`);
    } else {
      // Products reference a farmer by NAME, so a rename must cascade to them
      // (and update their village) or every linked product would be orphaned.
      if (editing.name !== clean.name || editing.village !== clean.village) {
        update('products', (arr) => arr.map((p) => (p.farmer === editing.name ? { ...p, farmer: clean.name, village: clean.village } : p)));
      }
      update('farmers', (arr) => arr.map((x) => (x.id === editing.id ? { ...x, ...clean } : x)));
      logActivity(admin.name, `Edited farmer "${clean.name}"`);
    }
    setEditing(null);
  };

  const del = (f) => confirm(`Delete farmer "${f.name}"?`, () => {
    update('farmers', (arr) => arr.filter((x) => x.id !== f.id));
    logActivity(admin.name, `Deleted farmer "${f.name}"`);
  });

  const toggleVerify = (f) => update('farmers', (arr) => arr.map((x) => (x.id === f.id ? { ...x, verified: !x.verified } : x)));

  return (
    <Screen title="Farmers" subtitle={`${farmers.length} farmers · ${farmers.filter((f) => f.verified).length} verified`} action={<Btn label="Add" icon="plus" small onPress={openNew} />}>
      {farmers.length === 0 ? <Empty icon="user-check" text="No farmers" /> : farmers.map((f) => {
        const linked = products.filter((p) => p.farmer === f.name).length;
        return (
          <Card key={f.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: A.cardAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {f.photo ? <Image source={{ uri: f.photo }} style={{ width: 48, height: 48 }} /> : <Text style={{ color: A.mint, fontWeight: '800', fontSize: 18 }}>{(f.name || '?')[0]}</Text>}
              </View>
              {f.farmPhoto ? <Image source={{ uri: f.farmPhoto }} style={{ width: 48, height: 48, borderRadius: 10, marginLeft: 8 }} /> : null}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={{ color: A.ink, fontWeight: '700', fontSize: 15 }}>{f.name}</Text>
                  {f.verified ? <AIcon name="check-circle" size={15} color={A.mint} /> : null}
                </View>
                <Text style={{ color: A.sub, fontSize: 12, marginTop: 2 }}>📍 {f.village} · 📞 {f.phone || '—'}</Text>
                <Text style={{ color: A.muted, fontSize: 11.5, marginTop: 2 }}>{linked} product(s){f.farmPhoto ? ' · 🌾 farm photo' : ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <IconBtn icon="edit-2" onPress={() => openEdit(f)} />
                  <IconBtn icon="trash-2" color={A.rose} onPress={() => del(f)} />
                </View>
                <Pressable onPress={() => toggleVerify(f)}>
                  <Tag t={f.verified ? 'Verified' : 'Unverified'} color={f.verified ? A.mint : A.muted} />
                </Pressable>
              </View>
            </View>
          </Card>
        );
      })}

      <FormModal visible={!!editing} title={editing === 'new' ? 'Add farmer' : 'Edit farmer'} onClose={() => setEditing(null)} onSave={save}>
        <Input label="Name" value={form.name} onChangeText={(t) => set('name', t)} placeholder="e.g. Lakshmi" />
        <Input label="Village" value={form.village} onChangeText={(t) => set('village', t)} placeholder="e.g. Chevella" />
        <Input label="Phone" value={form.phone} onChangeText={(t) => set('phone', t)} placeholder="98480 00000" keyboardType="phone-pad" />
        <ImageUpload label="Farmer photo" value={form.photo} onChange={(v) => set('photo', v)} round />
        <ImageUpload label="Farm photo" value={form.farmPhoto} onChange={(v) => set('farmPhoto', v)} />
        <Toggle label="Verified farmer" value={form.verified} onValueChange={(v) => set('verified', v)} />
      </FormModal>
      {confirmNode}
    </Screen>
  );
}
