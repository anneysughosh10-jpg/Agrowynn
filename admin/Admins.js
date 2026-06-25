/* =====================================================================
   Admin module — Admins (Super Admin only)
   Create up to 8 admin accounts, set their credentials, choose which
   modules each can access, activate/deactivate, delete.
   The Super Admin account itself cannot be deleted or stripped.
   ===================================================================== */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { A, AIcon, Screen, Btn, IconBtn, Card, Tag, Empty, Input, FormModal, useConfirm } from './ui';
import { useStore, update, nextId, logActivity, MODULE_LIST } from '../data/store';

const MAX_ADMINS = 9; // 1 super + 8 admins
const grantable = MODULE_LIST.filter((m) => !m.superOnly); // admins can't manage other admins

const blank = { name: '', username: '', password: '', modules: ['products', 'orders'], active: true };

export default function Admins({ admin }) {
  const { admins } = useStore();
  const { confirm, confirmNode } = useConfirm();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const adminCount = admins.filter((a) => a.role !== 'super').length;
  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (a) => { setForm({ ...a }); setEditing(a); };

  const toggleModule = (key) => set('modules', form.modules.includes(key) ? form.modules.filter((m) => m !== key) : [...form.modules, key]);

  const save = () => {
    const username = form.username.trim().toLowerCase();
    if (!form.name.trim() || !username || !form.password) return;
    // unique username check
    const clash = admins.find((a) => a.username.toLowerCase() === username && (editing === 'new' || a.id !== editing.id));
    if (clash) { return; } // silently ignore dup; UI hint below covers it
    const clean = { name: form.name.trim(), username, password: form.password, modules: form.modules, active: form.active };
    if (editing === 'new') {
      const id = nextId(admins);
      update('admins', (arr) => [...arr, { ...clean, id, role: 'admin' }]);
      logActivity(admin.name, `Created admin "${clean.name}" (${username})`);
    } else {
      update('admins', (arr) => arr.map((x) => (x.id === editing.id ? { ...x, ...clean } : x)));
      logActivity(admin.name, `Edited admin "${clean.name}"`);
    }
    setEditing(null);
  };

  const del = (a) => confirm(`Delete admin "${a.name}"? They will no longer be able to log in.`, () => {
    update('admins', (arr) => arr.filter((x) => x.id !== a.id));
    logActivity(admin.name, `Deleted admin "${a.name}"`);
  });

  const toggleActive = (a) => {
    update('admins', (arr) => arr.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)));
    logActivity(admin.name, `${a.active ? 'Deactivated' : 'Activated'} admin "${a.name}"`);
  };

  const usernameClash = form.username.trim() && admins.find((a) => a.username.toLowerCase() === form.username.trim().toLowerCase() && (editing === 'new' || a.id !== editing.id));

  return (
    <Screen
      title="Admins"
      subtitle={`${adminCount}/8 admins created · 1 super admin`}
      action={adminCount < MAX_ADMINS - 1 ? <Btn label="Create" icon="user-plus" small onPress={openNew} /> : null}
    >
      {admins.length === 0 ? <Empty icon="shield" text="No admins" /> : admins.map((a) => (
        <Card key={a.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: a.role === 'super' ? A.forest : A.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
              <AIcon name={a.role === 'super' ? 'shield' : 'user'} size={20} color={a.role === 'super' ? A.mint : A.sub} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Text style={{ color: A.ink, fontWeight: '700', fontSize: 15 }}>{a.name}</Text>
                {a.role === 'super' ? <Tag t="SUPER" color={A.mint} /> : <Tag t={a.active ? 'Active' : 'Inactive'} color={a.active ? A.mint : A.muted} />}
              </View>
              <Text style={{ color: A.sub, fontSize: 12.5, marginTop: 2 }}>@{a.username}</Text>
              <Text style={{ color: A.muted, fontSize: 11.5, marginTop: 3 }}>
                {a.role === 'super' ? 'All modules' : a.modules.length ? a.modules.join(', ') : 'No access yet'}
              </Text>
            </View>
            {a.role !== 'super' ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <IconBtn icon={a.active ? 'pause-circle' : 'play-circle'} onPress={() => toggleActive(a)} />
                <IconBtn icon="edit-2" onPress={() => openEdit(a)} />
                <IconBtn icon="trash-2" color={A.rose} onPress={() => del(a)} />
              </View>
            ) : (
              <Tag t="Locked" color={A.muted} />
            )}
          </View>
        </Card>
      ))}

      <FormModal visible={!!editing} title={editing === 'new' ? 'Create admin' : 'Edit admin'} onClose={() => setEditing(null)} onSave={save}>
        <Input label="Full name" value={form.name} onChangeText={(t) => set('name', t)} placeholder="e.g. Ravi Kumar" />
        <Input label="Username" value={form.username} onChangeText={(t) => set('username', t.replace(/\s/g, ''))} placeholder="e.g. ravi" />
        {usernameClash ? <Text style={{ color: A.rose, fontSize: 11.5, marginTop: -8, marginBottom: 10 }}>That username is already taken.</Text> : null}
        <Input label="Password" value={form.password} onChangeText={(t) => set('password', t)} placeholder="Set a password" />

        <Text style={{ color: A.sub, fontSize: 12.5, fontWeight: '700', marginBottom: 8 }}>Module access</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {grantable.map((m) => {
            const on = form.modules.includes(m.key);
            return (
              <Pressable key={m.key} onPress={() => toggleModule(m.key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: on ? A.green : A.line, backgroundColor: on ? A.green : A.chipBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
                <AIcon name={on ? 'check' : m.icon} size={13} color={on ? '#fff' : A.sub} />
                <Text style={{ color: on ? '#fff' : A.sub, fontSize: 12.5, fontWeight: '700' }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: A.muted, fontSize: 11.5, marginBottom: 8 }}>
          Pick which sections this admin can open. They won't see the rest.
        </Text>
      </FormModal>
      {confirmNode}
    </Screen>
  );
}
