import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Sport } from '../src/types/match';

const SPORTS: {
  sport: Sport;
  label: string;
  icon: 'soccer' | 'volleyball';
}[] = [
  { sport: 'football', label: 'Futebol', icon: 'soccer' },
  { sport: 'volleyball', label: 'Volei', icon: 'volleyball' },
];

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Onde Assistir</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <View style={styles.cardsContainer}>
        {SPORTS.map(({ sport, label, icon }) => (
          <TouchableOpacity
            key={sport}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/championship/[sport]',
                params: { sport },
              })
            }
            activeOpacity={0.7}
            testID={`sport-card-${sport}`}
          >
            <MaterialCommunityIcons name={icon} size={64} color="#2563eb" />
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
    paddingTop: 72,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginTop: 12,
  },
});
