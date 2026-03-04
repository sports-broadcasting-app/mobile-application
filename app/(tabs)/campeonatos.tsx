import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Sport } from '../../src/types/match';
import { useTheme } from '../../src/contexts/ThemeContext';

const SPORTS: {
  sport: Sport;
  label: string;
  icon: 'soccer' | 'volleyball';
}[] = [
  { sport: 'football', label: 'Futebol', icon: 'soccer' },
  { sport: 'volleyball', label: 'Volei', icon: 'volleyball' },
];

export default function CampeonatosTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Campeonatos
        </Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Escolha o esporte
      </Text>

      <View style={styles.cardsContainer}>
        {SPORTS.map(({ sport, label, icon }) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
              },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/championship/[sport]',
                params: { sport },
              })
            }
            testID={`campeonatos-sport-${sport}`}
          >
            <MaterialCommunityIcons
              name={icon}
              size={48}
              color={colors.primary}
            />
            <Text style={[styles.cardLabel, { color: colors.textPrimary }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
});
