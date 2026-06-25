/* =====================================================================
   Admin module — Users
   View all customers, add a user from backend, edit, block/unblock,
   see each user's order count.
   ===================================================================== */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { A, AIcon, Screen, Btn, IconBtn, Card, Tag, Empty, Input, Toggle, FormModal, useConfirm } from './ui';
import { useStore, update, nextId, logActivity } from '../data/store';

const blank = { name: '', phone: '', email: '', address: '', blocked: false };

export default function Users({ admin }) {
  const { users, orders } = useStore();
  const { confirm, confirmNode } = useConfirm();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [q, setQ] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (u) => { setForm({ ...u }); setEditing(u); };

  const save = () => {
    if (!form.name.trim()) return;
    const clean = { ...form, name: form.name.trim() };
    if (editing === 'new') {
      const id = nextId(users);
      update('users', (arr) => [{ ...clean, id, joined: 'today' }, ...arr]);
      logActivity(admin.name, `Added user "${clean.name}"`);
    } else {
      update('users', (arr) => arr.map((x) => (x.id === editing.id ? { ...x, ...clean } : x)));
      logActivity(admin.name, `Edited user "${clean.name}"`);
    }
    setEditing(null);
  };

  const del = (u) => confirm(`Delete user "${u.name}"?`, () => {
    update('users', (arr) => arr.filter((x) => x.id !== u.id));
    logActivity(admin.name, `Deleted user "${u.name}"`);
  });

  const toggleBlock = (u) => {
    update('users', (arr) => arr.map((x) => (x.id === u.id ? { ...x, blocked: !x.blocked } : x)));
    logActivity(admin.name, `${u.blocked ? 'Unblocked' : 'Blocked'} user "${u.name}"`);
  };

  const list = users.filter((u) => (u.name + u.phone + u.email).toLowerCase().includes(q.toLowerCase()));

  return (
    <Screen title="Users" subtitle={`${users.length} users · ${users.filter((u) => u.blocked).length} blocked`} action={<Btn label="Add" icon="user-plus" small onPress={openNew} />}>
      <View style={{ marginBottom: 12 }}>
        <Input value={q} onChangeText={setQ} placeholder="Search name, phone, email…" />
      </View>
      {list.length === 0 ? <Empty icon="users" text="No users found" /> : list.map((u) => {
        const oc = orders.filter((o) => o.userId === u.id).length;
        return (
          <Card key={u.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: A.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: A.mint, fontWeight: '800', fontSize: 17 }}>{(u.name || '?')[0]}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={{ color: A.ink, fontWeight: '700', fontSize: 15 }}>{u.name}</Text>
                  {u.blocked ? <Tag t="Blocked" color={A.rose} bg="#3a1f1f" /> : null}
                </View>
                <Text style={{ color: A.sub, fontSize: 12, marginTop: 2 }}>+91 {u.phone} · {u.email}</Text>
                <Text style={{ color: A.muted, fontSize: 11.5, marginTop: 2 }}>📍 {u.address} · {oc} order(s)</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <IconBtn icon="edit-2" onPress={() => openEdit(u)} />
                  <IconBtn icon="trash-2" color={A.rose} onPress={() => del(u)} />
                </View>
                <Pressable onPress={() => toggleBlock(u)}>
                  <Tag t={u.blocked ? 'Unblock' : 'Block'} color={u.blocked ? A.mint : A.amber} />
                </Pressable>
              </View>
            </View>
          </Card>
        );
      })}

      <FormModal visible={!!editing} title={editing === 'new' ? 'Add user' : 'Edit user'} onClose={() => setEditing(null)} onSave={save}>
        <Input label="Full name" value={form.name} onChangeText={(t) => set('name', t)} placeholder="e.g. Priya Sharma" />
        <Input label="Phone" value={form.phone} onChangeText={(t) => set('phone', t.replace(/[^0-9]/g, '').slice(0, 10))} placeholder="10-digit mobile" keyboardType="number-pad" />
        <Input label="Email" value={form.email} onChangeText={(t) => set('email', t)} placeholder="you@email.com" keyboardType="email-address" />
        <Input label="Address" value={form.address} onChangeText={(t) => set('address', t)} placeholder="Area, Hyderabad" />
        <Toggle label="Blocked" value={form.blocked} onValueChange={(v) => set('blocked', v)} />
      </FormModal>
      {confirmNode}
    </Screen>
  );
}
