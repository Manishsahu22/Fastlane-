import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLocationName } from '@/lib/storage';
import { Colors } from '@/constants/colors';
import { QliniQWordmark } from '@/components/QliniQLogo';
import { useLayout } from '@/hooks/use-layout';

export default function WelcomeScreen() {
  const router = useRouter();
  const [locationName, setLocationName] = useState('');
  const { isTablet } = useLayout();
  const insets = useSafeAreaInsets();
  const pulse = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    getLocationName().then((n) => { if (n) setLocationName(n); });
  }, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.018, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <QliniQWordmark width={isTablet ? 240 : 170} color={Colors.white} />
        {locationName ? (
          <Text style={[styles.location, isTablet && styles.locationLg]}>{locationName}</Text>
        ) : null}
      </View>

      <Animated.View style={[styles.ctaWrapper, { transform: [{ scale: pulse }] }]}>
        <TouchableOpacity
          style={styles.checkinArea}
          onPress={() => router.push('/kiosk/checkin')}
          activeOpacity={0.82}
        >
          <FontAwesome5
            name="hand-point-up"
            size={isTablet ? 88 : 60}
            color="rgba(255,255,255,0.9)"
          />
          <Text style={[styles.title, isTablet && styles.titleLg]}>Touch to Check In</Text>
          <Text style={[styles.subtitle, isTablet && styles.subtitleLg]}>
            Walk-in patients start here
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.footer, isTablet && styles.footerLg]}>
        Need help? Ask the front desk.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 24,
    gap: 10,
  },
  location: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.4,
  },
  locationLg: { fontSize: 20 },
  ctaWrapper: { flex: 1 },
  checkinArea: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    borderWidth: 2,
    borderColor: 'rgba(218,253,173,0.2)',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleLg: { fontSize: 60 },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.2,
  },
  subtitleLg: { fontSize: 26 },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    paddingVertical: 20,
  },
  footerLg: { fontSize: 17 },
});
