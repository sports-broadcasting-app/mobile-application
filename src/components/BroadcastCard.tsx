import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as Linking from 'expo-linking';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Broadcast } from '../types/match';

interface BroadcastCardProps {
  broadcast: Broadcast;
}

export function BroadcastCard({ broadcast }: BroadcastCardProps) {
  const hasUrl = broadcast.url !== '';
  const label = hasUrl ? 'Abrir no App' : 'Assistir na TV';
  const icon = hasUrl ? 'cellphone' : 'television';

  const handlePress = () => {
    if (hasUrl) {
      Linking.openURL(broadcast.url);
    } else {
      Alert.alert(broadcast.name, 'Disponivel na TV');
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={handlePress}
      testID={`broadcast-card-${broadcast.name}`}
    >
      <MaterialCommunityIcons name={icon} size={28} color="#2563eb" />
      <Text style={styles.name} numberOfLines={1}>
        {broadcast.name}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
  },
});
