import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Sport } from '../../src/types/match';

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campeonatos</Text>
      </View>

      <Text style={styles.subtitle}>Escolha o esporte</Text>

      <View style={styles.cardsContainer}>
        {SPORTS.map(({ sport, label, icon }) => (
          <TouchableOpacity
            key={sport}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/championship/[sport]',
                params: { sport },
              })
            }
            testID={`campeonatos-sport-${sport}`}
          >
            <MaterialCommunityIcons name={icon} size={48} color="#2563eb" />
            <Text style={styles.cardLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginTop: 12,
  },
});
