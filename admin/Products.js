/* =====================================================================
   Admin module — Products
   Add / edit / delete products, set image (URL or emoji), toggle stock,
   set tag, price, MRP, unit, farmer, category, description.
   ===================================================================== */
import React, { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import {
  A, AIcon, Screen, Btn, IconBtn, Card, Tag, Empty, Input, ChipRow, Toggle,
  FormModal, useConfirm, ImageUpload,
} from './ui';
import { useStore, update, nextId, logActivity } from '../data/store';

const blank = { name: '', emoji: '📦', image: '', cat: 'veg', price: '', mrp: '', unit: '1 kg', farmer: '', village: '', desc: '', tag: '', inStock: true };
const TAGS = ['', 'Bestseller', 'Fresh today', 'New'];

export default function Products({ admin }) {
  const { products, categories, farmers } = useStore();
  const { confirm, confirmNode } = useConfirm();
  const [editing, setEditing] = useState(null); // product object or 'new'
  const [form, setForm] = useState(blank);
  const [q, setQ] = useState('');

  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (p) => {
    setForm({ ...p, price: String(p.price), mrp: String(p.mrp), image: p.image || '', tag: p.tag || '' });
    setEditing(p);
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) return;
    const clean = {
      ...form,
      name: form.name.trim(),
      price: Number(form.price) || 0,
      mrp: Number(form.mrp) || Number(form.price) || 0,
      image: form.image || null,
      tag: form.tag || null,
    };
    if (editing === 'new') {
      const id = nextId(products);
      update('products', (arr) => [{ ...clean, id, rating: 4.7, reviews: 0 }, ...arr]);
      logActivity(admin.name, `Added product "${clean.name}"`);
    } else {
      update('products', (arr) => arr.map((x) => (x.id === editing.id ? { ...x, ...clean } : x)));
      logActivity(admin.name, `Edited product "${clean.name}"`);
    }
    setEditing(null);
  };

  const del = (p) => confirm(`Delete "${p.name}"? This cannot be undone.`, () => {
    update('products', (arr) => arr.filter((x) => x.id !== p.id));
    logActivity(admin.name, `Deleted product "${p.name}"`);
  });

  const toggleStock = (p) => {
    update('products', (arr) => arr.map((x) => (x.id === p.id ? { ...x, inStock: !x.inStock } : x)));
  };

  const list = products.filter((p) => (p.name + p.farmer).toLowerCase().includes(q.toLowerCase()));
  const catName = (id) => (categories.find((c) => c.id === id) || {}).name || id;

  return (
    <Screen
      title="Products"
      subtitle={`${products.length} products · ${products.filter((p) => p.inStock).length} in stock`}
      action={<Btn label="Add" icon="plus" small onPress={openNew} />}
    >
      <View style={{ marginBottom: 12 }}>
        <Input value={q} onChangeText={setQ} placeholder="Search products or farmer…" />
      </View>

      {list.length === 0 ? <Empty icon="box" text="No products found" /> : list.map((p) => (
        <Card key={p.id}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: A.cardAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {p.image ? <Image source={{ uri: p.image }} style={{ width: 56, height: 56 }} /> : <Text style={{ fontSize: 30 }}>{p.emoji}</Text>}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: A.ink, fontWeight: '700', fontSize: 15 }}>{p.name}</Text>
                {p.tag ? <Tag t={p.tag} color={A.amber} /> : null}
              </View>
              <Text style={{ color: A.sub, fontSize: 12, marginTop: 2 }}>🌱 {p.farmer || '—'} · {catName(p.cat)}</Text>
              <Text style={{ color: A.mint, fontWeight: '800', marginTop: 4 }}>
                ₹{p.price} <Text style={{ color: A.muted, fontWeight: '400', fontSize: 12 }}>· {p.unit}</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <IconBtn icon="edit-2" onPress={() => openEdit(p)} />
                <IconBtn icon="trash-2" color={A.rose} onPress={() => del(p)} />
              </View>
              <Pressable onPress={() => toggleStock(p)} style={{ marginTop: 10 }}>
                <Tag t={p.inStock ? 'In stock' : 'Out of stock'} color={p.inStock ? A.mint : A.rose} bg={p.inStock ? A.chipBg : '#3a1f1f'} />
              </Pressable>
            </View>
          </View>
        </Card>
      ))}

      <FormModal
        visible={!!editing}
        title={editing === 'new' ? 'Add product' : 'Edit product'}
        onClose={() => setEditing(null)}
        onSave={save}
      >
        <Input label="Name" value={form.name} onChangeText={(t) => set('name', t)} placeholder="e.g. Carrots" />
        <ImageUpload label="Product photo" value={form.image} onChange={(v) => set('image', v)} />
        <Input label="Emoji icon (shown if no photo)" value={form.emoji} onChangeText={(t) => set('emoji', t)} placeholder="🥕" />

        <Text style={{ color: A.sub, fontSize: 12.5, fontWeight: '700', marginBottom: 6 }}>Category</Text>
        <ChipRow options={categories.map((c) => ({ value: c.id, label: `${c.emoji} ${c.name}` }))} value={form.cat} onChange={(v) => set('cat', v)} />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Input label="Price ₹" value={form.price} onChangeText={(t) => set('price', t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Input label="MRP ₹" value={form.mrp} onChangeText={(t) => set('mrp', t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Input label="Unit" value={form.unit} onChangeText={(t) => set('unit', t)} placeholder="1 kg" /></View>
        </View>

        <Text style={{ color: A.sub, fontSize: 12.5, fontWeight: '700', marginBottom: 6 }}>Farmer</Text>
        <ChipRow options={farmers.map((f) => ({ value: f.name, label: f.name }))} value={form.farmer} onChange={(v) => {
          const f = farmers.find((x) => x.name === v);
          set('farmer', v); if (f) set('village', f.village);
        }} />

        <Text style={{ color: A.sub, fontSize: 12.5, fontWeight: '700', marginBottom: 6 }}>Tag</Text>
        <ChipRow options={TAGS.map((t) => ({ value: t, label: t || 'None' }))} value={form.tag} onChange={(v) => set('tag', v)} />

        <Input label="Description" value={form.desc} onChangeText={(t) => set('desc', t)} placeholder="Short story about this product…" multiline />
        <Toggle label="In stock" value={form.inStock} onValueChange={(v) => set('inStock', v)} />
      </FormModal>
      {confirmNode}
    </Screen>
  );
}
