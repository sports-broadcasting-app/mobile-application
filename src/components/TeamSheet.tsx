import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomSheet } from './BottomSheet';
import { SearchField } from './SearchField';
import { TeamCircle } from './TeamCircle';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTeams } from '../hooks/useSuperliga';
import { CompetitionSlug, Team } from '../types/snapshot';
import { normalizeForSearch } from '../utils/search';
import { getTeamName, teamSearchText } from '../utils/teamName';
import { getCompetition } from '../constants/competitions';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

interface TeamSheetProps {
  /** The competition to pick a team in; null keeps the sheet closed. */
  competition: CompetitionSlug | null;
  onClose: () => void;
  /** After a team is chosen (not when one is removed). */
  onPicked?: (competition: CompetitionSlug, team: Team) => void;
}

/** "Qual é o seu time?": one favorite per competition, or none. */
export function TeamSheet({ competition, onClose, onPicked }: TeamSheetProps) {
  const { colors } = useTheme();
  const { favorites, setFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  // Kept while the sheet slides out, so its content does not blank.
  const [shown, setShown] = useState<CompetitionSlug | null>(competition);
  useEffect(() => {
    if (competition) {
      setShown(competition);
      setQuery('');
    }
  }, [competition]);

  const { data: teams } = useTeams(shown ?? 'masculina');
  const selected = shown ? favorites[shown] : undefined;

  const visibleTeams = useMemo(() => {
    const term = normalizeForSearch(query);
    return (teams ?? [])
      .filter(
        (team) =>
          !term ||
          normalizeForSearch(teamSearchText(team.name, team.code)).includes(
            term,
          ),
      )
      .sort((a, b) => getTeamName(a.name).localeCompare(getTeamName(b.name)));
  }, [teams, query]);

  const pick = (team: Team | null) => {
    if (!shown) return;
    setFavorite(shown, team ? team.id : null).catch(() => {});
    onClose();
    if (team) onPicked?.(shown, team);
  };

  return (
    <BottomSheet
      visible={competition !== null}
      onClose={onClose}
      eyebrow={shown ? getCompetition(shown).name : undefined}
      title="Qual é o seu time?"
      message="Os jogos dele aparecem primeiro e você recebe o aviso antes de começar."
      testID="team-sheet"
      footer={
        selected ? (
          <TouchableOpacity
            accessibilityRole="button"
            testID="team-none"
            style={[styles.none, { borderColor: colors.border }]}
            onPress={() => pick(null)}
          >
            <Text style={[styles.noneText, { color: colors.textSecondary }]}>
              Sem time nesta competição
            </Text>
          </TouchableOpacity>
        ) : undefined
      }
    >
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar time"
        testID="team-search"
        inset
      />
      <ScrollView keyboardShouldPersistTaps="handled">
        {visibleTeams.map((team) => {
          const on = selected === team.id;
          return (
            <TouchableOpacity
              key={team.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, checked: on }}
              testID={`team-option-${team.id}`}
              style={[styles.row, { borderBottomColor: colors.borderLight }]}
              onPress={() => pick(team)}
            >
              <TeamCircle team={team} size={32} />
              <Text
                numberOfLines={1}
                style={[styles.name, { color: colors.textPrimary }]}
              >
                {getTeamName(team.name)}
              </Text>
              <View
                style={[
                  styles.radio,
                  on
                    ? { backgroundColor: colors.primary }
                    : [styles.unchecked, { borderColor: colors.controlBorder }],
                ]}
              >
                {on ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={iconSize.sm - 2}
                    color={colors.onPrimary}
                  />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
        {teams !== undefined && visibleTeams.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Nenhum time encontrado
          </Text>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  unchecked: {
    borderWidth: 2,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
    paddingVertical: spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  radio: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  empty: {
    fontSize: typography.size.body,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  none: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
  },
  noneText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});
