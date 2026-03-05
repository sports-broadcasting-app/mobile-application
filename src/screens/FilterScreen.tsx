import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Sport } from '../types/match';
import { useTodayMatches } from '../hooks/useTodayMatches';
import { getChampionshipLabel } from '../utils/championshipLabel';
import { SPORTS } from '../constants/sports';
import { GradientHeader } from '../components/GradientHeader';
import { CtaButton } from '../components/CtaButton';
import { BroadcasterCircle } from '../components/BroadcasterCircle';
import { useFilters } from '../contexts/FilterContext';
import { useTheme } from '../contexts/ThemeContext';

const BROADCASTER_LIST = [
  'Globo',
  'SporTV',
  'Premiere',
  'ESPN',
  'Disney+',
  'Band',
  'SBT',
  'Paramount+',
  'DAZN',
  'Prime Video',
  'CazéTV',
  'F1 TV Pro',
];

interface FilterScreenProps {
  onApply?: () => void;
}

export function FilterScreen({ onApply }: FilterScreenProps) {
  const { colors } = useTheme();
  const { filters, setFilters } = useFilters();
  const { championships } = useTodayMatches();

  const [localSports, setLocalSports] = useState<Sport[]>(filters.sports);
  const [localChampionships, setLocalChampionships] = useState<string[]>(
    filters.championships,
  );
  const [localBroadcasters, setLocalBroadcasters] = useState<string[]>(
    filters.broadcasters,
  );

  const toggleSport = (sport: Sport) => {
    setLocalSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  };

  const toggleChampionship = (slug: string) => {
    setLocalChampionships((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const toggleBroadcaster = (name: string) => {
    setLocalBroadcasters((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  const handleApply = () => {
    setFilters({
      sports: localSports,
      championships: localChampionships,
      broadcasters: localBroadcasters,
    });
    onApply?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Esporte
        </Text>
        <View style={styles.chipsRow}>
          {SPORTS.map(({ sport, label, icon, enabled }) => {
            const isActive = localSports.includes(sport);
            return (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.chip,
                  isActive
                    ? { backgroundColor: colors.chipActiveBg }
                    : {
                        backgroundColor: colors.surface,
                        borderColor: colors.chipBorder,
                        borderWidth: 1,
                      },
                  !enabled && { opacity: 0.4 },
                ]}
                onPress={() => enabled && toggleSport(sport)}
                disabled={!enabled}
                testID={`filter-sport-${sport}`}
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={18}
                  color={isActive ? colors.chipActiveText : colors.textPrimary}
                />
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: isActive
                        ? colors.chipActiveText
                        : colors.textPrimary,
                    },
                  ]}
                >
                  {enabled ? label : `${label} (Em breve)`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Competicao
        </Text>
        {championships.map((slug) => {
          const isActive = localChampionships.includes(slug);
          return (
            <TouchableOpacity
              key={slug}
              style={[
                styles.listItem,
                { borderBottomColor: colors.borderLight },
              ]}
              onPress={() => toggleChampionship(slug)}
              testID={`filter-championship-${slug}`}
            >
              <Text
                style={[styles.listItemText, { color: colors.textPrimary }]}
              >
                {getChampionshipLabel(slug)}
              </Text>
              {isActive && (
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Plataforma
        </Text>
        <View style={styles.chipsRow}>
          {BROADCASTER_LIST.map((name) => {
            const isActive = localBroadcasters.includes(name);
            return (
              <TouchableOpacity
                key={name}
                style={[
                  styles.broadcasterChip,
                  isActive
                    ? { backgroundColor: colors.chipActiveBg }
                    : {
                        backgroundColor: colors.surface,
                        borderColor: colors.chipBorder,
                        borderWidth: 1,
                      },
                ]}
                onPress={() => toggleBroadcaster(name)}
                testID={`filter-broadcaster-${name}`}
              >
                <BroadcasterCircle name={name} size={24} />
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: isActive
                        ? colors.chipActiveText
                        : colors.textPrimary,
                    },
                  ]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <CtaButton label="APLICAR FILTROS" onPress={handleApply} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  broadcasterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  spacer: {
    height: 16,
  },
});
