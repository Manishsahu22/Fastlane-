import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { submitCheckin } from '@/lib/services/walkin';
import { Colors } from '@/constants/colors';
import { QliniQWordmark } from '@/components/QliniQLogo';
import { useLayout } from '@/hooks/use-layout';

const NAME_RE = /^[\p{L}\p{M}'.\- ]+$/u;

const validateFirstName = (v: string) => {
  const t = v.trim();
  if (!t) return 'Please enter your first name';
  if (t.length > 100) return 'First name is too long';
  if (!NAME_RE.test(t)) return 'Only letters, spaces, hyphens and apostrophes allowed';
  return '';
};

const validateLastName = (v: string) => {
  const t = v.trim();
  if (!t) return '';
  if (t.length > 100) return 'Last name is too long';
  if (!NAME_RE.test(t)) return 'Only letters, spaces, hyphens and apostrophes allowed';
  return '';
};

const validatePhone = (v: string) => {
  if (!v || v.trim() === '') return 'Phone number is required';
  if (!/^[\d\s\-\(\)\+\.]+$/.test(v)) return 'Phone can only contain digits, spaces, +, -, (), and .';
  const digits = v.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 20) return 'Phone must be between 10 and 20 digits';
  return '';
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const len = digits.length;
  if (len < 4) return digits;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export default function CheckinScreen() {
  const router = useRouter();
  const { isTablet } = useLayout();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', reasonForVisit: '' });
  const [errors, setErrors] = useState({ firstName: '', lastName: '', phone: '' });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (k: string, v: string) => {
    const val = k === 'phone' ? formatPhone(v) : v;
    setForm((f) => ({ ...f, [k]: val }));
    if (k in errors) setErrors((e) => ({ ...e, [k]: '' }));
    setSubmitError('');
  };

  const blurValidate = (k: string) => {
    let err = '';
    if (k === 'firstName') err = validateFirstName(form.firstName);
    if (k === 'lastName') err = validateLastName(form.lastName);
    if (k === 'phone') err = validatePhone(form.phone);
    setErrors((e) => ({ ...e, [k]: err }));
  };

  const handleSubmit = async () => {
    const fnErr = validateFirstName(form.firstName);
    const lnErr = validateLastName(form.lastName);
    const phErr = validatePhone(form.phone);
    setErrors({ firstName: fnErr, lastName: lnErr, phone: phErr });
    if (fnErr || lnErr || phErr) return;

    try {
      setLoading(true);
      setSubmitError('');
      const phoneDigits = form.phone.replace(/\D/g, '');
      const res: any = await submitCheckin({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        phone: phoneDigits,
        reasonForVisit: form.reasonForVisit.trim() || undefined,
      } as any);

      if (!res?.success) {
        const status = res?.statusCode ?? res?.status;
        const code = res?.code;
        if (status === 401 || code === 'UNAUTHORIZED') { router.replace('/pair'); return; }
        if (status === 429 || code === 'RATE_LIMITED') throw new Error('Too many check-ins. Please wait a minute and try again.');
        if (status === 403 || code === 'WALKIN_FEATURE_DISABLED' || code === 'FORBIDDEN') throw new Error('Walk-in check-in is currently unavailable. Please see reception.');
        if (status === 400) throw new Error(res?.message || 'Please double-check your details and try again.');
        throw new Error(res?.message || 'Check-in failed. Please try again.');
      }

      router.replace('/kiosk/success');
    } catch (err: any) {
      setSubmitError(err.message || 'Check-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Green header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={isTablet ? 18 : 15} color="rgba(255,255,255,0.7)" />
          <Text style={[styles.backText, isTablet && styles.backTextLg]}> Back</Text>
        </TouchableOpacity>
        <QliniQWordmark width={isTablet ? 200 : 160} color={Colors.white} />
        <Text style={[styles.headerTitle, isTablet && styles.headerTitleLg]}>Walk-in Check In</Text>
        <Text style={[styles.headerSub, isTablet && styles.headerSubLg]}>
          Enter your details and we&apos;ll add you to the queue.
        </Text>
      </View>

      {/* White form body */}
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
          <View style={styles.nameRow}>
            <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.label, isTablet && styles.labelLg]}>First Name *</Text>
              <TextInput
                style={[styles.input, isTablet && styles.inputLg, !!errors.firstName && styles.inputError]}
                value={form.firstName}
                onChangeText={(v) => setField('firstName', v)}
                onBlur={() => blurValidate('firstName')}
                placeholder="e.g. Sara"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="words"
                autoComplete="given-name"
              />
              {!!errors.firstName && <Text style={[styles.error, isTablet && styles.errorLg]}>{errors.firstName}</Text>}
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, isTablet && styles.labelLg]}>Last Name</Text>
              <TextInput
                style={[styles.input, isTablet && styles.inputLg, !!errors.lastName && styles.inputError]}
                value={form.lastName}
                onChangeText={(v) => setField('lastName', v)}
                onBlur={() => blurValidate('lastName')}
                placeholder="e.g. Ahmed (optional)"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="words"
                autoComplete="family-name"
              />
              {!!errors.lastName && <Text style={[styles.error, isTablet && styles.errorLg]}>{errors.lastName}</Text>}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, isTablet && styles.labelLg]}>Phone *</Text>
            <TextInput
              style={[styles.input, isTablet && styles.inputLg, !!errors.phone && styles.inputError]}
              value={form.phone}
              onChangeText={(v) => setField('phone', v)}
              onBlur={() => blurValidate('phone')}
              placeholder="(555) 123-4567"
              placeholderTextColor={Colors.gray400}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            {!!errors.phone
              ? <Text style={[styles.error, isTablet && styles.errorLg]}>{errors.phone}</Text>
              : <Text style={[styles.hint, isTablet && styles.hintLg]}>We use your phone to check if you&apos;re already a patient.</Text>
            }
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, isTablet && styles.labelLg]}>Reason for Visit (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea, isTablet && styles.inputLg, isTablet && styles.textareaLg]}
              value={form.reasonForVisit}
              onChangeText={(v) => setField('reasonForVisit', v)}
              placeholder="e.g. Headache, follow-up, blood test results"
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={3}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, isTablet && styles.hintLg]}>{form.reasonForVisit.length}/1000</Text>
          </View>

          {!!submitError && (
            <Text style={[styles.submitError, isTablet && styles.submitErrorLg]}>{submitError}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, isTablet && styles.submitBtnLg, loading && styles.disabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} size={isTablet ? 'large' : 'small'} />
              : <Text style={[styles.submitText, isTablet && styles.submitTextLg]}>Check In  →</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 8,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  backTextLg: { fontSize: 18 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.white, marginTop: 4 },
  headerTitleLg: { fontSize: 32 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 20 },
  headerSubLg: { fontSize: 17, lineHeight: 26 },

  body: { flex: 1, backgroundColor: Colors.white },
  bodyContent: { padding: 24 },
  bodyContentTablet: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 32 },
  inner: { width: '100%' },
  innerTablet: { maxWidth: 620 },

  nameRow: { flexDirection: 'row', marginBottom: 0 },
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.gray700, marginBottom: 8 },
  labelLg: { fontSize: 16, marginBottom: 10 },
  input: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, color: Colors.gray900,
    minHeight: 52, backgroundColor: Colors.gray50,
  },
  inputLg: { fontSize: 18, paddingHorizontal: 18, paddingVertical: 16, minHeight: 62, borderRadius: 14 },
  inputError: { borderColor: Colors.danger, backgroundColor: '#FFF5F5' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  textareaLg: { minHeight: 110 },
  error: { fontSize: 12, color: Colors.danger, marginTop: 5 },
  errorLg: { fontSize: 14 },
  hint: { fontSize: 12, color: Colors.gray500, marginTop: 5 },
  hintLg: { fontSize: 14 },
  charCount: { fontSize: 12, color: Colors.gray500, marginTop: 5, textAlign: 'right' },
  submitError: {
    fontSize: 13, color: Colors.danger, textAlign: 'center',
    marginBottom: 14, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
  },
  submitErrorLg: { fontSize: 16, padding: 16 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    justifyContent: 'center', minHeight: 58,
  },
  submitBtnLg: { paddingVertical: 22, borderRadius: 16, minHeight: 70 },
  submitText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  submitTextLg: { fontSize: 22 },
  disabled: { opacity: 0.6 },
});
