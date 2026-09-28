import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, fontFamily, pressedOpacity, rowDir, textAlignStart } from '@/constants/theme';
import { CarCard } from '@/components/ui/CarCard';
import { Chip } from '@/components/ui/Chip';
import { type Car } from '@/data/cars';
import { fetchFleet, fetchCategories, mapApiCarSummaryToCar, type ApiCategory } from '@/lib/api';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';

type FilterKey = string | 'all';

export default function FleetScreen() {
  const router = useRouter();
  const { trip, setSelectedCar } = useBooking();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [cars, setCars] = useState<Car[] | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchFleet(), fetchCategories()])
      .then(([fleetRows, categoryRows]) => {
        if (cancelled) return;
        setCars(fleetRows.map(mapApiCarSummaryToCar));
        setCategories(categoryRows);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' || !cars ? cars ?? [] : cars.filter((c) => c.category === filter)),
    [filter, cars]
  );

  function startBooking(car: Car) {
    setSelectedCar(car);
    router.push(user ? '/id-verification' : '/login');
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>الأسطول</Text>
          <Text style={styles.count}>{cars ? `${cars.length} مركبات متاحة` : ''}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.tripBar, pressed && { opacity: pressedOpacity }]}
          onPress={() => router.push('/')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.tripText} numberOfLines={1}>
              {trip.branch} · {trip.pickupDate} — {trip.returnDate} · {trip.days} أيام
            </Text>
            <Text style={styles.tripSub}>تأجير {trip.period === 'daily' ? 'يومي' : 'موسّع'} · استلام من الفرع</Text>
          </View>
          <Text style={styles.editLink}>تعديل</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.title}
              active={filter === cat.slug}
              onPress={() => setFilter(filter === cat.slug ? 'all' : cat.slug)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>تعذّر تحميل الأسطول — تأكد إن السيرفر شغّال</Text>
        </View>
      ) : !cars ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.petrol} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <CarCard
              car={item}
              variant="full"
              onPress={() => router.push(`/car/${item.id}`)}
              onBookPress={() => startBooking(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  headerSafe: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerRow: {
    flexDirection: rowDir,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  title: { flex: 1, fontSize: 19, fontFamily: fontFamily.black, color: colors.ink, textAlign: textAlignStart },
  count: { fontSize: 11.5, fontFamily: fontFamily.extraBold, color: colors.goldText },
  tripBar: {
    flexDirection: rowDir,
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  tripText: { fontSize: 12.5, fontFamily: fontFamily.extraBold, color: colors.ink, textAlign: textAlignStart },
  tripSub: { fontSize: 10.5, fontFamily: fontFamily.bold, color: colors.faint2, marginTop: 1, textAlign: textAlignStart },
  editLink: { fontSize: 11, fontFamily: fontFamily.extraBold, color: colors.goldText },
  chipsRow: {
    flexDirection: rowDir,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 13.5, fontFamily: fontFamily.bold, color: colors.faint3, textAlign: 'center' },
});
