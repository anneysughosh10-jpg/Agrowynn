/* =====================================================================
   Agrowynn Admin — hidden login
   Validates username + password against the `admins` collection in the
   store. Only the Super Admin can create these credentials (Admins
   module). Blocked/inactive accounts cannot log in.
   ===================================================================== */
import React, { useState } from 'react';
import { View, Text, Image, SafeAreaView, StatusBar, Pressable } from 'react-native';
import { A, AIcon, Input, Btn } from './ui';
import { getState, logActivity } from '../data/store';

const LOGO = require('../assets/logo.png');

export default function AdminAuth({ onSuccess, onExit }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    const u = username.trim().toLowerCase();
    const admins = getState().admins;
    const match = admins.find((a) => a.username && a.username.toLowerCase() === u && a.password === password);
    if (!match) { setError('Invalid username or password.'); return; }
    if (!match.active) { setError('This admin account is deactivated.'); return; }
    logActivity(match.name, 'Logged in to admin panel');
    onSuccess(match);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: A.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, padding: 28, justifyContent: 'center' }}>
        <Pressable onPress={onExit} style={{ position: 'absolute', top: 44, left: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AIcon name="arrow-left" size={18} color={A.sub} />
          <Text style={{ color: A.sub, fontWeight: '600' }}>Back to app</Text>
        </Pressable>

        <View style={{ alignItems: 'center', marginBottom: 26 }}>
          <Image source={LOGO} style={{ width: 92, height: 92, resizeMode: 'contain' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <AIcon name="shield" size={20} color={A.mint} />
            <Text style={{ color: A.ink, fontSize: 22, fontWeight: '800' }}>Admin Console</Text>
          </View>
          <Text style={{ color: A.sub, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
            Restricted area. Sign in with the credentials issued to you.
          </Text>
        </View>

        <Input label="Username" value={username} onChangeText={(t) => { setUsername(t); setError(''); }} placeholder="e.g. superadmin" />

        <Text style={{ color: A.sub, fontSize: 12.5, fontWeight: '700', marginBottom: 6 }}>Password</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: A.panel, borderWidth: 1, borderColor: A.line, borderRadius: 11, paddingRight: 10, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Input value={password} onChangeText={(t) => { setPassword(t); setError(''); }} placeholder="••••••••" secureTextEntry={!show} />
          </View>
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={8} style={{ marginBottom: 12 }}>
            <AIcon name={show ? 'eye-off' : 'eye'} size={18} color={A.sub} />
          </Pressable>
        </View>

        {error ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <AIcon name="alert-circle" size={15} color={A.rose} />
            <Text style={{ color: A.rose, fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}

        <Btn label="Sign in" icon="log-in" onPress={submit} style={{ marginTop: 6 }} />

        <Text style={{ color: A.muted, fontSize: 11.5, textAlign: 'center', marginTop: 20, lineHeight: 18 }}>
          Demo Super Admin — username:  superadmin   ·   password:  agrowynn@123
        </Text>
      </View>
    </SafeAreaView>
  );
}
