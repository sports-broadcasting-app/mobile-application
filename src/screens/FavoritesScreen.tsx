import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedChips } from '../components/SegmentedChips';
import { TeamCircle } from '../components/TeamCircle';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTeams } from '../hooks/useSuperliga';
import { CompetitionSlug } from '../types/superliga';
import { iconSize, spacing, typography } from '../constants/designTokens';

const OPTIONS: { value: CompetitionSlug; label: string }[] = [
  { value: 'masculina', label: 'Masculina' },
  { value: 'feminina', label: 'Feminina' },
];

export default function FavoritesScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { favorites, toggleFavorite } = useFavorites();
  const [competition, setCompetition] = useState<CompetitionSlug>('masculina');
  const { data: teams } = useTeams(competition);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Favoritos
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Escolha um time por competicao
        </Text>
      </View>
      <SegmentedChips
        options={OPTIONS}
        selected={competition}
        onSelect={setCompetition}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {(teams ?? []).map((team) => {
          const selected = favorites[competition] === team.id;
          return (
            <TouchableOpacity
              key={team.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`team-option-${team.id}`}
              style={[styles.row, { borderBottomColor: colors.borderLight }]}
              onPress={() => toggleFavorite(competition, team.id)}
            >
              <TeamCircle team={team} size={36} />
              <Text
                numberOfLines={1}
                style={[styles.teamName, { color: colors.textPrimary }]}
              >
                {team.name}
              </Text>
              <MaterialCommunityIcons
                name={selected ? 'star' : 'star-outline'}
                size={iconSize.lg}
                color={selected ? colors.primary : colors.textTertiary}
              />
            </TouchableOpacity>
          );
        })}

        <View style={styles.themeRow}>
          <Text style={[styles.teamName, { color: colors.textPrimary }]}>
            Tema escuro
          </Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: typography.size.sm,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  teamName: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  themeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.lg,
  },
});
