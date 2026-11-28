import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { AppText } from '@/shared/ui/AppText';
import { CheckRow } from '@/shared/ui/CheckRow';
import { SportToggleRow } from '@/shared/ui/SportToggleRow';
import { useFavorites } from '@/entities/team/model/FavoritesContext';
import {
  competitionsOfSport,
  useFollowToggles,
} from '../model/useFollowToggles';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useTeamsById } from '@/shared/api/queries';
import { CompetitionSlug } from '@/shared/api/snapshot';
import { getTeamName } from '@/shared/lib/teamName';
import { getCompetition, SPORTS } from '@/shared/config/competitions';
import { spacing } from '@/shared/theme/designTokens';

interface CompetitionsSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * "Suas competições": what the filters, standings and reminders show,
 * grouped by sport. The sport switch follows all its competitions; a sport
 * with more than one lists them to pick from.
 */
export function CompetitionsSheet({
  visible,
  onClose,
}: CompetitionsSheetProps) {
  const { colors } = useTheme();
  const { favorites } = useFavorites();
  const teamsById = useTeamsById();
  const {
    followed,
    sportOn,
    sportLocked,
    competitionLocked,
    setSport,
    setCompetitionFollowed,
  } = useFollowToggles();

  const teamLine = (slug: CompetitionSlug) => {
    const teamId = favorites[slug];
    const team = teamId ? teamsById.get(teamId) : undefined;
    return team ? `Seu time: ${getTeamName(team.name)}` : null;
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Suas competições"
      message="Os filtros, a classificação e os avisos mostram só o que você acompanha."
      testID="competitions-sheet"
      footer={
        <Button label="Pronto" testID="competitions-done" onPress={onClose} />
      }
    >
      <ScrollView>
        {SPORTS.map(({ sport, name }) => {
          const own = competitionsOfSport(sport);
          if (own.length === 0) return null;
          const on = sportOn(sport);
          const [only, ...others] = own;
          const single =
            only && others.length === 0 ? getCompetition(only) : null;
          return (
            <View
              key={sport}
              style={[styles.sport, { borderBottomColor: colors.borderLight }]}
            >
              <SportToggleRow
                sport={sport}
                name={name}
                detail={
                  single &&
                  [single.name, teamLine(single.slug)]
                    .filter(Boolean)
                    .join(' · ')
                }
                on={on}
                locked={sportLocked(sport)}
                onChange={(next) => setSport(sport, next)}
                accessibilityLabel={`Acompanhar ${single?.name ?? name}`}
              />
              {!single &&
                on &&
                own.map((slug) => {
                  const checked = followed.includes(slug);
                  return (
                    <CheckRow
                      key={slug}
                      label={getCompetition(slug).name}
                      detail={teamLine(slug)}
                      checked={checked}
                      locked={checked && competitionLocked(slug)}
                      onToggle={(next) => setCompetitionFollowed(slug, next)}
                      testID={`follow-${slug}`}
                      style={styles.child}
                    />
                  );
                })}
            </View>
          );
        })}
        <AppText variant="caption" tone="tertiary" style={styles.note}>
          Competições novas de um esporte que você acompanha entram sozinhas.
        </AppText>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sport: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  child: {
    minHeight: 48,
    paddingLeft: 36 + spacing.md,
  },
  note: {
    paddingTop: spacing.md,
  },
});
