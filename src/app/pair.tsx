import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { verifyDeviceToken } from '@/lib/services/walkin';
import { saveApiEnv, type ApiEnv } from '@/lib/storage';
import { Colors } from '@/constants/colors';
import { QliniQWordmark } from '@/components/QliniQLogo';
import { useLayout } from '@/hooks/use-layout';

const ENVS: { key: ApiEnv; label: string; url: string }[] = [
  { key: 'prod',  label: 'Production', url: 'api.qliniq.ai' },
  { key: 'stage', label: 'Staging',    url: 'api.stage.qliniq.ai' },
  { key: 'dev',   label: 'Dev',        url: 'api.dev.qliniq.ai' },
];

export default function PairScreen() {
  const router = useRouter();
  const { isTablet } = useLayout();
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState('');
  const [env, setEnv] = useState<ApiEnv>('stage');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handlePair = async (rawToken?: string) => {
    const t = (rawToken ?? token).trim();
    if (!t) return Alert.alert('Error', 'Please enter or scan a token.');
    try {
      setLoading(true);
      await saveApiEnv(env);
      const role = await verifyDeviceToken(t);
      router.replace(role === 'staff' ? '/queue' : '/kiosk/welcome');
    } catch (err: any) {
      Alert.alert('Pairing Failed', err.message || 'Could not verify token.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    let t = data;
    try {
      const url = new URL(data);
      const p = url.searchParams.get('token');
      if (p) t = p;
    } catch {}
    await handlePair(t);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        return Alert.alert('Permission needed', 'Camera access is required to scan QR codes.');
      }
    }
    setScanned(false);
    setScanning(true);
  };

  if (scanning) {
    return (
      <View style={styles.scanContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleScan}
        />
        <View style={styles.scanOverlay}>
          <View style={[styles.scanFrame, isTablet && styles.scanFrameLg]} />
          <Text style={[styles.scanHint, isTablet && styles.scanHintLg]}>
            Point camera at the QR code
          </Text>
          <TouchableOpacity
            style={[styles.cancelBtn, isTablet && styles.cancelBtnLg]}
            onPress={() => setScanning(false)}
          >
            <Text style={[styles.cancelText, isTablet && styles.cancelTextLg]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Green header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <QliniQWordmark width={isTablet ? 220 : 170} color={Colors.white} />
        <Text style={[styles.headerTitle, isTablet && styles.headerTitleLg]}>Pair This Device</Text>
        <Text style={[styles.headerSub, isTablet && styles.headerSubLg]}>
          Scan the QR code or enter the token from Walk-in Devices settings.
        </Text>
      </View>

      {/* White body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: insets.bottom + 24 },
          isTablet && styles.bodyContentTablet,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.inner, isTablet && styles.innerTablet]}>

          {/* Environment selector */}
          <Text style={[styles.envLabel, isTablet && styles.envLabelLg]}>Environment</Text>
          <View style={[styles.envRow, isTablet && styles.envRowLg]}>
            {ENVS.map((e) => {
              const active = env === e.key;
              return (
                <TouchableOpacity
                  key={e.key}
                  style={[styles.envPill, isTablet && styles.envPillLg, active && styles.envPillActive]}
                  onPress={() => setEnv(e.key)}
                >
                  {active && (
                    <FontAwesome5
                      name="check-circle"
                      size={isTablet ? 13 : 11}
                      color={Colors.primary}
                      style={{ marginRight: 5 }}
                    />
                  )}
                  <View>
                    <Text style={[styles.envPillTitle, isTablet && styles.envPillTitleLg, active && styles.envPillTitleActive]}>
                      {e.label}
                    </Text>
                    <Text style={[styles.envPillUrl, isTablet && styles.envPillUrlLg]}>
                      {e.url}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.dividerTop} />

          <TouchableOpacity
            style={[styles.scanButton, isTablet && styles.scanButtonLg]}
            onPress={openScanner}
          >
            <FontAwesome5 name="qrcode" size={isTablet ? 22 : 18} color={Colors.primary} />
            <Text style={[styles.scanButtonText, isTablet && styles.scanButtonTextLg]}>
              {'  '}Scan QR Code
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={[styles.dividerText, isTablet && styles.dividerTextLg]}>or enter manually</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={[styles.input, isTablet && styles.inputLg]}
            placeholder="Paste token here…"
            placeholderTextColor={Colors.gray400}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.pairButton, isTablet && styles.pairButtonLg, loading && styles.disabled]}
            onPress={() => handlePair()}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} size={isTablet ? 'large' : 'small'} />
              : <Text style={[styles.pairButtonText, isTablet && styles.pairButtonTextLg]}>Pair Device</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingBottom: 36,
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.white, marginTop: 6 },
  headerTitleLg: { fontSize: 34 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 20 },
  headerSubLg: { fontSize: 17, lineHeight: 26 },

  body: { flex: 1, backgroundColor: Colors.white },
  bodyContent: { padding: 28 },
  bodyContentTablet: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 36 },
  inner: { width: '100%' },
  innerTablet: { maxWidth: 500 },

  envLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray500, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  envLabelLg: { fontSize: 14, marginBottom: 12 },
  envRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  envRowLg: { gap: 10 },
  envPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 10,
    backgroundColor: Colors.gray50,
  },
  envPillLg: { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14 },
  envPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  envPillTitle: { fontSize: 12, fontWeight: '700', color: Colors.gray700 },
  envPillTitleLg: { fontSize: 14 },
  envPillTitleActive: { color: Colors.primary },
  envPillUrl: { fontSize: 9, color: Colors.gray400, marginTop: 1 },
  envPillUrlLg: { fontSize: 11 },

  dividerTop: { height: 1, backgroundColor: Colors.gray200, marginVertical: 24 },

  scanButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryLight, borderRadius: 14,
    paddingVertical: 18, marginBottom: 24,
  },
  scanButtonLg: { paddingVertical: 22, borderRadius: 16 },
  scanButtonText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  scanButtonTextLg: { fontSize: 20 },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray200 },
  dividerText: { marginHorizontal: 14, fontSize: 13, color: Colors.gray400 },
  dividerTextLg: { fontSize: 15 },

  input: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 14,
    padding: 16, fontSize: 14, color: Colors.gray900,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 20, minHeight: 100, textAlignVertical: 'top',
    backgroundColor: Colors.gray50,
  },
  inputLg: { fontSize: 16, padding: 20, minHeight: 120, borderRadius: 16 },

  pairButton: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    justifyContent: 'center', minHeight: 58,
  },
  pairButtonLg: { paddingVertical: 22, borderRadius: 16, minHeight: 70 },
  pairButtonText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  pairButtonTextLg: { fontSize: 22 },
  disabled: { opacity: 0.6 },

  scanContainer: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 240, height: 240, borderWidth: 3, borderColor: Colors.white, borderRadius: 16 },
  scanFrameLg: { width: 320, height: 320, borderRadius: 20 },
  scanHint: { color: Colors.white, marginTop: 24, fontSize: 15, fontWeight: '500' },
  scanHintLg: { fontSize: 20, marginTop: 32 },
  cancelBtn: {
    marginTop: 36, backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 28, paddingVertical: 13, borderRadius: 10,
  },
  cancelBtnLg: { paddingHorizontal: 40, paddingVertical: 18, borderRadius: 14, marginTop: 48 },
  cancelText: { color: Colors.white, fontSize: 14, fontWeight: '500' },
  cancelTextLg: { fontSize: 18 },
});
