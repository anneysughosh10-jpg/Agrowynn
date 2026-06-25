/* =====================================================================
   Admin module — Categories
   Add / edit / delete categories, show/hide, reorder (up/down).
   ===================================================================== */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { A, AIcon, Screen, Btn, IconBtn, Card, Tag, Empty, Input, FormModal, useConfirm } from './ui';
import { useStore, update, logActivity, uniqueId } from '../data/store';

const blank = { name: '', emoji: '🍎', hidden: false };

export default function Categories({ admin }) {
  const { categories, products } = useStore();
  const { confirm, confirmNode } = useConfirm();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (c) => { setForm({ ...c }); setEditing(c); };

  const save = () => {
    if (!form.name.trim()) return;
    if (editing === 'new') {
      const id = uniqueId(categories, form.name.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 16));
      update('categories', (arr) => [...arr, { id, name: form.name.trim(), emoji: form.emoji || '🍎', hidden: false }]);
      logActivity(admin.name, `Added category "${form.name.trim()}"`);
    } else {
      update('categories', (arr) => arr.map((x) => (x.id === editing.id ? { ...x, name: form.name.trim(), emoji: form.emoji } : x)));
      logActivity(admin.name, `Edited category "${form.name.trim()}"`);
    }
    setEditing(null);
  };

  const del = (c) => {
    const n = products.filter((p) => p.cat === c.id).length;
    confirm(n ? `"${c.name}" has ${n} product(s). They'll move to another category. Delete?` : `Delete "${c.name}"?`, () => {
      // Reassign orphaned products to a surviving category so they don't vanish.
      const survivor = categories.find((x) => x.id !== c.id);
      if (n && survivor) {
        update('products', (arr) => arr.map((p) => (p.cat === c.id ? { ...p, cat: survivor.id } : p)));
      }
      update('categories', (arr) => arr.filter((x) => x.id !== c.id));
      logActivity(admin.name, `Deleted category "${c.name}"`);
    });
  };

  const toggleHide = (c) => update('categories', (arr) => arr.map((x) => (x.id === c.id ? { ...x, hidden: !x.hidden } : x)));

  const move = (i, dir) => update('categories', (arr) => {
    const a = [...arr]; const j = i + dir;
    if (j < 0 || j >= a.length) return a;
    [a[i], a[j]] = [a[j], a[i]]; return a;
  });

  return (
    <Screen title="Categories" subtitle={`${categories.length} categories`} action={<Btn label="Add" icon="plus" small onPress={openNew} />}>
      {categories.length === 0 ? <Empty icon="grid" text="No categories" /> : categories.map((c, i) => (
        <Card key={c.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 26 }}>{c.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: A.ink, fontWeight: '700', fontSize: 15 }}>{c.name}</Text>
                {c.hidden ? <Tag t="Hidden" color={A.muted} /> : null}
              </View>
              <Text style={{ color: A.sub, fontSize: 12, marginTop: 2 }}>{products.filter((p) => p.cat === c.id).length} products</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <IconBtn icon="chevron-up" onPress={() => move(i, -1)} />
              <IconBtn icon="chevron-down" onPress={() => move(i, 1)} />
              <IconBtn icon={c.hidden ? 'eye' : 'eye-off'} onPress={() => toggleHide(c)} />
              <IconBtn icon="edit-2" onPress={() => openEdit(c)} />
              <IconBtn icon="trash-2" color={A.rose} onPress={() => del(c)} />
            </View>
          </View>
        </Card>
      ))}

      <FormModal visible={!!editing} title={editing === 'new' ? 'Add category' : 'Edit category'} onClose={() => setEditing(null)} onSave={save}>
        <Input label="Name" value={form.name} onChangeText={(t) => set('name', t)} placeholder="e.g. Oils & Ghee" />
        <Input label="Emoji icon" value={form.emoji} onChangeText={(t) => set('emoji', t)} placeholder="🫒" />
      </FormModal>
      {confirmNode}
    </Screen>
  );
}
