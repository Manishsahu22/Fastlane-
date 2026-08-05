import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { QliniQIcon } from '@/components/QliniQLogo';
import { useLayout } from '@/hooks/use-layout';

const TIMEOUT = 5;

export default function SuccessScreen() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(TIMEOUT);
  const { isTablet } = useLayout();
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => router.replace('/kiosk/welcome'), TIMEOUT * 1000);
    const interval = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top, paddingBottom: insets.bottom },
    ]}>
      <Animated.View style={[styles.content, { transform: [{ scale }], opacity }]}>
        <View style={[styles.checkCircle, isTablet && styles.checkCircleLg]}>
          <FontAwesome5
            name="check"
            size={isTablet ? 56 : 38}
            color="#dafdad"
          />
        </View>

        <QliniQIcon size={isTablet ? 52 : 36} color="rgba(218,253,173,0.35)" />

        <Text style={[styles.title, isTablet && styles.titleLg]}>
          You're Checked In!
        </Text>
        <Text style={[styles.subtitle, isTablet && styles.subtitleLg]}>
          Please have a seat.{'\n'}A staff member will call your name shortly.
        </Text>

        <View style={[styles.timerBadge, isTablet && styles.timerBadgeLg]}>
          <Text style={[styles.timerCount, isTablet && styles.timerCountLg]}>
            {countdown}
          </Text>
          <Text style={[styles.timerLabel, isTablet && styles.timerLabelLg]}>
            Returning to home screen…
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
    maxWidth: 560,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(218,253,173,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(218,253,173,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkCircleLg: { width: 140, height: 140, borderRadius: 70 },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleLg: { fontSize: 52 },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 26,
  },
  subtitleLg: { fontSize: 24, lineHeight: 36 },
  timerBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timerBadgeLg: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 20 },
  timerCount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#dafdad',
    lineHeight: 40,
  },
  timerCountLg: { fontSize: 52, lineHeight: 56 },
  timerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  timerLabelLg: { fontSize: 15 },
});
