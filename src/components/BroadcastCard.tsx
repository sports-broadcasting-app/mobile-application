import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as Linking from 'expo-linking';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Broadcast } from '../types/match';
import { useTheme } from '../contexts/ThemeContext';

interface BroadcastCardProps {
  broadcast: Broadcast;
}

export function BroadcastCard({ broadcast }: BroadcastCardProps) {
  const { colors } = useTheme();
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
      style={[
        styles.card,
        { backgroundColor: colors.surface, shadowColor: colors.shadow },
      ]}
      activeOpacity={0.7}
      onPress={handlePress}
      testID={`broadcast-card-${broadcast.name}`}
    >
      <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
      <Text
        style={[styles.name, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {broadcast.name}
      </Text>
      <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: 140,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});
