import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLocationName } from '@/lib/storage';
import { QliniQIcon } from '@/components/QliniQLogo';
import { getQueue, callWalkin, completeWalkin, noShowWalkin, cancelWalkin } from '@/lib/services/walkin';
import { Colors } from '@/constants/colors';
import { useLayout } from '@/hooks/use-layout';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  waiting:    { bg: Colors.warningLight, text: Colors.warning,  label: 'Waiting' },
  in_service: { bg: Colors.successLight, text: Colors.success,  label: 'In Service' },
  completed:  { bg: Colors.gray100,      text: Colors.gray500,  label: 'Completed' },
  no_show:    { bg: Colors.dangerLight,  text: Colors.danger,   label: 'No Show' },
  cancelled:  { bg: Colors.dangerLight,  text: Colors.danger,   label: 'Cancelled' },
};

function PatientCard({ item, isTablet, onCall, onComplete, onNoShow, onCancel }: any) {
  const s = STATUS_STYLE[item.status] ?? STATUS_STYLE.waiting;
  const isActive = item.status === 'waiting' || item.status === 'in_service';

  return (
    <View style={[styles.card, isTablet && styles.cardTablet]}>
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <View style={[styles.avatar, isTablet && styles.avatarLg]}>
            <Text style={[styles.avatarText, isTablet && styles.avatarTextLg]}>
              {(item.firstName?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.patientName, isTablet && styles.patientNameLg]}>
              {item.firstName} {item.lastName}
            </Text>
            <View style={styles.infoRow}>
              <FontAwesome5 name="phone" size={isTablet ? 13 : 11} color={Colors.gray500} />
              <Text style={[styles.infoText, isTablet && styles.infoTextLg]}> {item.phone}</Text>
              {item.checkedInAt && (
                <>
                  <Text style={styles.dot}>  ·  </Text>
                  <FontAwesome5 name="clock" size={isTablet ? 13 : 11} color={Colors.gray500} />
                  <Text style={[styles.infoText, isTablet && styles.infoTextLg]}>
                    {' '}{new Date(item.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.text }, isTablet && styles.badgeTextLg]}>
            {s.label}
          </Text>
        </View>
      </View>

      {isActive && (
        <View style={[styles.actions, isTablet && styles.actionsTablet]}>
          {item.status === 'waiting' && (
            <TouchableOpacity style={[styles.btn, styles.callBtn, isTablet && styles.btnLg]} onPress={() => onCall(item.id)}>
              <FontAwesome5 name="bullhorn" size={isTablet ? 14 : 11} color={Colors.white} />
              <Text style={[styles.btnText, isTablet && styles.btnTextLg]}> Call</Text>
            </TouchableOpacity>
          )}
          {item.status === 'in_service' && (
            <TouchableOpacity style={[styles.btn, styles.completeBtn, isTablet && styles.btnLg]} onPress={() => onComplete(item.id)}>
              <FontAwesome5 name="check" size={isTablet ? 14 : 11} color={Colors.white} />
              <Text style={[styles.btnText, isTablet && styles.btnTextLg]}> Complete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.btn, styles.noShowBtn, isTablet && styles.btnLg]} onPress={() => onNoShow(item.id)}>
            <FontAwesome5 name="user-slash" size={isTablet ? 14 : 11} color={Colors.white} />
            <Text style={[styles.btnText, isTablet && styles.btnTextLg]}> No Show</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.cancelBtn, isTablet && styles.btnLg]} onPress={() => onCancel(item.id)}>
            <FontAwesome5 name="times" size={isTablet ? 14 : 11} color={Colors.white} />
            <Text style={[styles.btnText, isTablet && styles.btnTextLg]}> Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function QueueScreen() {
  const queryClient = useQueryClient();
  const [locationName, setLocationName] = useState('');
  const { isTablet } = useLayout();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getLocationName().then((n) => { if (n) setLocationName(n); });
  }, []);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['walkin-queue'],
    queryFn: () => getQueue({ status: 'all' }),
    refetchInterval: 10000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['walkin-queue'] });
  const callM     = useMutation({ mutationFn: callWalkin,     onSuccess: invalidate });
  const completeM = useMutation({ mutationFn: completeWalkin, onSuccess: invalidate });
  const noShowM   = useMutation({ mutationFn: noShowWalkin,   onSuccess: invalidate });
  const cancelM   = useMutation({ mutationFn: cancelWalkin,   onSuccess: invalidate });

  const raw = data?.data?.items ?? data?.data ?? data?.queue ?? [];
  const allPatients = Array.isArray(raw) ? raw : [];
  const patients = allPatients
    .filter((p: any) => p.status === 'waiting' || p.status === 'in_service')
    .map((p: any) => ({
      ...p,
      firstName: p.firstName ?? p.guestFirstName,
      lastName: p.lastName ?? p.guestLastName,
      phone: p.phone ?? p.guestPhone,
      checkedInAt: p.checkedInAt ?? p.checkInAt,
    }));

  const handleCancel = (id: number) => {
    Alert.alert('Cancel Walk-in', 'Are you sure you want to cancel this patient?', [
      { text: 'No',  style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => cancelM.mutate(id) },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const waiting   = patients.filter((p: any) => p.status === 'waiting').length;
  const inService = patients.filter((p: any) => p.status === 'in_service').length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, isTablet && styles.headerTablet, { paddingTop: insets.top + 16 }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <QliniQIcon size={isTablet ? 28 : 22} color="#dafdad" />
            <Text style={[styles.headerTitle, isTablet && styles.headerTitleLg]}> Live Queue</Text>
          </View>
          {locationName ? (
            <Text style={[styles.headerSub, isTablet && styles.headerSubLg]}>{locationName}</Text>
          ) : null}
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={[styles.statNum, isTablet && styles.statNumLg]}>{waiting}</Text>
            <Text style={[styles.statLabel, isTablet && styles.statLabelLg]}>waiting</Text>
          </View>
          {inService > 0 && (
            <View style={[styles.statBadge, styles.statBadgeGreen]}>
              <Text style={[styles.statNum, isTablet && styles.statNumLg]}>{inService}</Text>
              <Text style={[styles.statLabel, isTablet && styles.statLabelLg]}>in service</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => String(item.id)}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'tablet' : 'phone'}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, isTablet && styles.cardWrapperTablet]}>
            <PatientCard
              item={item}
              isTablet={isTablet}
              onCall={(id: number) => callM.mutate(id)}
              onComplete={(id: number) => completeM.mutate(id)}
              onNoShow={(id: number) => noShowM.mutate(id)}
              onCancel={handleCancel}
            />
          </View>
        )}
        contentContainerStyle={[styles.list, isTablet && styles.listTablet, { paddingBottom: insets.bottom + 16 }]}
        columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome5 name="check-circle" size={isTablet ? 64 : 48} color={Colors.gray300} />
            <Text style={[styles.emptyText, isTablet && styles.emptyTextLg]}>Queue is empty</Text>
            <Text style={[styles.emptySubText, isTablet && styles.emptySubTextLg]}>No patients waiting right now.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.gray100 },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTablet: { paddingBottom: 22, paddingHorizontal: 32 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
  headerTitleLg: { fontSize: 26 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  headerSubLg: { fontSize: 16 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
    alignItems: 'center', minWidth: 52,
  },
  statBadgeGreen: { backgroundColor: 'rgba(5,150,105,0.35)' },
  statNum: { color: Colors.white, fontSize: 18, fontWeight: '800', lineHeight: 20 },
  statNumLg: { fontSize: 24, lineHeight: 26 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, marginTop: 1 },
  statLabelLg: { fontSize: 11 },
  list: { padding: 16 },
  listTablet: { padding: 20 },
  columnWrapper: { gap: 12 },
  cardWrapper: { marginBottom: 12 },
  cardWrapperTablet: { flex: 1 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16 },
  cardTablet: { padding: 20, borderRadius: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLg: { width: 50, height: 50, borderRadius: 25 },
  avatarText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  avatarTextLg: { fontSize: 20 },
  patientName: { fontSize: 15, fontWeight: '700', color: Colors.gray900 },
  patientNameLg: { fontSize: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, flexWrap: 'wrap' },
  infoText: { fontSize: 12, color: Colors.gray500 },
  infoTextLg: { fontSize: 14 },
  dot: { color: Colors.gray300, fontSize: 12 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextLg: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionsTablet: { gap: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  btnLg: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 11 },
  btnText: { fontSize: 12, fontWeight: '600', color: Colors.white },
  btnTextLg: { fontSize: 14 },
  callBtn:     { backgroundColor: Colors.primary },
  completeBtn: { backgroundColor: Colors.success },
  noShowBtn:   { backgroundColor: Colors.warning },
  cancelBtn:   { backgroundColor: Colors.danger },
  empty: { alignItems: 'center', paddingTop: 100, gap: 14 },
  emptyText: { fontSize: 20, fontWeight: '700', color: Colors.gray700 },
  emptyTextLg: { fontSize: 26 },
  emptySubText: { fontSize: 14, color: Colors.gray500 },
  emptySubTextLg: { fontSize: 18 },
});
