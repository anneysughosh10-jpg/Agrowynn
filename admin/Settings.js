/* =====================================================================
   Admin module — App Settings
   Edit splash tagline, support contact, logo URL, maintenance mode.
   Also: reset all demo data.
   ===================================================================== */
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { A, Screen, Btn, Card, Input, Toggle, useConfirm } from './ui';
import { useStore, setState, resetAll, logActivity } from '../data/store';

export default function Settings({ admin }) {
  const { settings } = useStore();
  const { confirm, confirmNode } = useConfirm();
  const [form, setForm] = useState({
    tagline: settings.tagline,
    supportPhone: settings.supportPhone,
    supportEmail: settings.supportEmail,
    logo: settings.logo || '',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...form, logo: form.logo.trim() || null } }));
    logActivity(admin.name, 'Updated app settings');
  };

  const toggleMaint = () => {
    let now;
    setState((s) => { now = !s.settings.maintenance; return { ...s, settings: { ...s.settings, maintenance: now } }; });
    logActivity(admin.name, `Maintenance mode ${now ? 'ON' : 'OFF'}`);
  };

  const doReset = () => confirm('Reset ALL data back to the original demo seed? This wipes every edit.', () => {
    resetAll();
  });

  return (
    <Screen title="App Settings" subtitle="Content, support & system">
      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 10 }}>📝 Content</Text>
        <Input label="Splash tagline" value={form.tagline} onChangeText={(t) => set('tagline', t)} multiline />
        <Input label="Logo image URL (optional)" value={form.logo} onChangeText={(t) => set('logo', t)} placeholder="https://…/logo.png" />
      </Card>

      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 10 }}>☎️ Support</Text>
        <Input label="Support phone" value={form.supportPhone} onChangeText={(t) => set('supportPhone', t)} />
        <Input label="Support email" value={form.supportEmail} onChangeText={(t) => set('supportEmail', t)} keyboardType="email-address" />
      </Card>

      <Btn label="Save settings" icon="save" onPress={save} style={{ marginBottom: 16 }} />

      <Card>
        <Text style={{ color: A.ink, fontWeight: '700', marginBottom: 4 }}>🛠 System</Text>
        <Text style={{ color: A.sub, fontSize: 12.5, marginBottom: 12 }}>
          Maintenance mode shows customers a notice and pauses ordering.
        </Text>
        <Toggle label="Maintenance mode" value={settings.maintenance} onValueChange={toggleMaint} />
        <Btn danger label="Reset all demo data" icon="rotate-ccw" onPress={doReset} />
      </Card>
      {confirmNode}
    </Screen>
  );
}
