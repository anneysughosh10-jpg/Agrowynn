/* =====================================================================
   Agrowynn Admin — shared UI kit
   Reusable components + theme so each module file stays small.
   ===================================================================== */
import React, { useState } from 'react';
import {
  View, Text, Image, Pressable, TextInput, Modal, ScrollView, Switch,
  StyleSheet, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

/* admin palette — darker, "dashboard" feel, distinct from the storefront */
export const A = {
  bg: '#0F1A14', panel: '#16241B', card: '#1C2E22', cardAlt: '#213527',
  line: '#2C4133', ink: '#EAF1E6', sub: '#9DB3A2', muted: '#7C9285',
  green: '#60924D', forest: '#2E5A39', mint: '#8FD17A', amber: '#D98A2B',
  rose: '#E06A6A', blue: '#5B9BD5', white: '#FFFFFF', chipBg: '#243527',
};

export const AIcon = (p) => <Feather {...p} />;

const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 4 },
  default: {},
});

/* ---------- screen scaffold for a module ---------- */
export function Screen({ title, subtitle, action, children }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={st.head}>
        <View style={{ flex: 1 }}>
          <Text style={st.h1}>{title}</Text>
          {subtitle ? <Text style={st.sub}>{subtitle}</Text> : null}
        </View>
        {action || null}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>{children}</ScrollView>
    </View>
  );
}

/* ---------- buttons ---------- */
export function Btn({ label, onPress, icon, color, ghost, danger, small, style }) {
  const bg = danger ? A.rose : color || A.green;
  return (
    <Pressable onPress={onPress} style={[
      st.btn, small && st.btnSm, ghost ? st.btnGhost : { backgroundColor: bg }, style,
    ]}>
      {icon ? <AIcon name={icon} size={small ? 14 : 16} color={ghost ? A.ink : '#fff'} /> : null}
      <Text style={[st.btnT, small && { fontSize: 12.5 }, ghost && { color: A.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function IconBtn({ icon, onPress, color }) {
  return (
    <Pressable onPress={onPress} style={st.iconBtn} hitSlop={8}>
      <AIcon name={icon} size={16} color={color || A.sub} />
    </Pressable>
  );
}

/* ---------- card / row ---------- */
export function Card({ children, style }) {
  return <View style={[st.card, style]}>{children}</View>;
}

export function Field({ label, value }) {
  return (
    <View style={{ marginRight: 18, marginBottom: 4 }}>
      <Text style={st.fieldL}>{label}</Text>
      <Text style={st.fieldV}>{value}</Text>
    </View>
  );
}

export function Tag({ t, color, bg }) {
  return (
    <View style={[st.tag, { backgroundColor: bg || A.chipBg }]}>
      <Text style={{ color: color || A.mint, fontSize: 11, fontWeight: '700' }}>{t}</Text>
    </View>
  );
}

export function Empty({ icon, text }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <AIcon name={icon || 'inbox'} size={40} color={A.muted} />
      <Text style={{ color: A.muted, marginTop: 12, fontSize: 14 }}>{text}</Text>
    </View>
  );
}

/* ---------- form inputs (controlled) ---------- */
export function Input({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, multiline }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={st.lbl}>{label}</Text> : null}
      <TextInput
        value={value === undefined || value === null ? '' : String(value)}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={A.muted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize="none"
        style={[st.input, multiline && { height: 80, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

export function Toggle({ label, value, onValueChange }) {
  return (
    <View style={st.toggleRow}>
      <Text style={st.lbl}>{label}</Text>
      <Switch
        value={!!value}
        onValueChange={onValueChange}
        trackColor={{ true: A.green, false: A.line }}
        thumbColor="#fff"
      />
    </View>
  );
}

/* ---------- image upload (web + native) ----------
   Lets an admin pick a photo and returns a compact JPEG data-URL.
   Web: downscales on a <canvas>. Native: uses the OS image picker +
   expo-image-manipulator to resize, so a phone photo doesn't blow the
   storage quota. Stored as a self-contained data-URL either way. */
function fileToResizedDataURL(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width >= height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({ label, value, onChange, round }) {
  const webMode = Platform.OS === 'web' && typeof document !== 'undefined';
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const pickWeb = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      setBusy(true);
      try { onChange(await fileToResizedDataURL(file, 800, 0.6)); }
      catch { /* ignore unreadable file */ }
      setBusy(false);
    };
    input.click();
  };

  const pickNative = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setNote('Photo permission denied. Enable it in Settings.'); return; }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (res.canceled || !res.assets || !res.assets[0]) return;
      setBusy(true);
      const manip = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      onChange(manip.base64 ? `data:image/jpeg;base64,${manip.base64}` : res.assets[0].uri);
    } catch { setNote('Could not open the photo library.'); }
    setBusy(false);
  };

  const pick = () => { setNote(''); webMode ? pickWeb() : pickNative(); };
  const r = round ? 999 : 12;
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={st.lbl}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 72, height: 72, borderRadius: r, backgroundColor: A.cardAlt, borderWidth: 1, borderColor: A.line, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {value ? <Image source={{ uri: value }} style={{ width: 72, height: 72 }} /> : <AIcon name="image" size={22} color={A.muted} />}
        </View>
        <View style={{ gap: 8 }}>
          <Btn small icon="upload" label={busy ? 'Uploading…' : value ? 'Change photo' : 'Upload photo'} onPress={pick} />
          {value ? <Btn small ghost icon="trash-2" label="Remove" onPress={() => onChange(null)} /> : null}
        </View>
      </View>
      {note ? <Text style={{ color: A.rose, fontSize: 11.5, marginTop: 6 }}>{note}</Text> : null}
    </View>
  );
}

/* a row of selectable chips (single-select) */
export function ChipRow({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        const on = value === val;
        return (
          <Pressable key={val} onPress={() => onChange(val)}
            style={[st.chip, on && { backgroundColor: A.green, borderColor: A.green }]}>
            <Text style={{ color: on ? '#fff' : A.sub, fontWeight: '700', fontSize: 12.5 }}>{lab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- modal sheet for add/edit forms ---------- */
export function FormModal({ visible, title, onClose, onSave, saveLabel, children }) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.backdrop}>
        <View style={st.sheet}>
          <View style={st.sheetHead}>
            <Text style={st.sheetTitle}>{title}</Text>
            <IconBtn icon="x" onPress={onClose} color={A.ink} />
          </View>
          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ paddingBottom: 8 }}>
            {children}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Btn ghost label="Cancel" onPress={onClose} style={{ flex: 1 }} />
            <Btn label={saveLabel || 'Save'} icon="check" onPress={onSave} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- tiny confirm dialog ---------- */
export function useConfirm() {
  const [cfg, setCfg] = useState(null);
  const confirm = (message, onYes) => setCfg({ message, onYes });
  const node = cfg ? (
    <Modal visible transparent animationType="fade" onRequestClose={() => setCfg(null)}>
      <View style={[st.backdrop, { justifyContent: 'center', padding: 28 }]}>
        <View style={[st.sheet, { borderRadius: 18 }]}>
          <Text style={{ color: A.ink, fontSize: 15, fontWeight: '600', marginBottom: 16 }}>{cfg.message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn ghost label="No" onPress={() => setCfg(null)} style={{ flex: 1 }} />
            <Btn danger label="Yes" onPress={() => { cfg.onYes(); setCfg(null); }} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  ) : null;
  return { confirm, confirmNode: node };
}

/* a small stat tile for dashboards/reports */
export function Stat({ label, value, icon, color }) {
  return (
    <View style={[st.stat, { flexGrow: 1 }]}>
      <View style={[st.statIco, { backgroundColor: (color || A.green) + '22' }]}>
        <AIcon name={icon} size={18} color={color || A.mint} />
      </View>
      <Text style={st.statV}>{value}</Text>
      <Text style={st.statL}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: A.line, flexDirection: 'row', alignItems: 'center' },
  h1: { color: A.ink, fontSize: 21, fontWeight: '800' },
  sub: { color: A.sub, fontSize: 12.5, marginTop: 3 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  btnSm: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: A.line },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 14 },
  iconBtn: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: A.chipBg },
  card: { backgroundColor: A.card, borderWidth: 1, borderColor: A.line, borderRadius: 16, padding: 14, marginBottom: 12, ...shadow },
  fieldL: { color: A.muted, fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldV: { color: A.ink, fontSize: 13.5, fontWeight: '600', marginTop: 2 },
  tag: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  lbl: { color: A.sub, fontSize: 12.5, fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: A.panel, borderWidth: 1, borderColor: A.line, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, color: A.ink, fontSize: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  chip: { borderWidth: 1, borderColor: A.line, backgroundColor: A.chipBg, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: A.panel, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, borderWidth: 1, borderColor: A.line, width: '100%', maxWidth: 560, alignSelf: 'center', marginHorizontal: 'auto' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitle: { color: A.ink, fontSize: 18, fontWeight: '800' },
  stat: { backgroundColor: A.card, borderWidth: 1, borderColor: A.line, borderRadius: 16, padding: 14, minWidth: 150 },
  statIco: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statV: { color: A.ink, fontSize: 22, fontWeight: '800' },
  statL: { color: A.sub, fontSize: 12, marginTop: 2 },
});
