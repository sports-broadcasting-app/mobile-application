import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path } from 'react-native-svg';
import { Sport } from '../types/snapshot';

interface SportIconProps {
  sport: Sport;
  size: number;
  color: string;
  /**
   * The chosen state: a solid glyph with its details cut out in
   * `knockoutColor`, which should be the color behind the icon. The soccer
   * ball already has solid patches and keeps one drawing for both states.
   */
  filled?: boolean;
  knockoutColor?: string;
  testID?: string;
}

// 24 pt grid, 2 pt stroke, round ends: the same language as the tab icons.
const STROKE = 2;
const DETAIL = 1.6;

const SOCCER_CENTER = 'M12 8.9L14.95 11.04L13.82 14.51L10.18 14.51L9.05 11.04Z';
const SOCCER_PATCHES =
  'M12 5.2L8.77 2.85L10 -0.95L14 -0.95L15.23 2.85Z M18.47 9.9L19.7 6.1L23.7 6.1L24.93 9.9L21.7 12.25Z M16 17.5L19.99 17.5L21.23 21.3L18 23.65L14.76 21.3Z M8 17.5L9.24 21.3L6 23.65L2.77 21.3L4.01 17.5Z M5.53 9.9L2.3 12.25L-0.93 9.9L0.3 6.1L4.3 6.1Z';
const SOCCER_SEAMS =
  'M12 8.9V5.2M14.95 11.04L18.47 9.9M13.82 14.51L16 17.5M10.18 14.51L8 17.5M9.05 11.04L5.53 9.9';

const FOOTBALL_BODY =
  'M4.9 19.1C3.9 13.6 6.6 7 12.6 5.1c3.5-1.1 6.5-.2 6.5-.2s.9 3-.2 6.5C17 17.4 10.4 20.1 4.9 19.1z';
const FOOTBALL_LACES =
  'M9.6 14.4l4.8-4.8M10.2 12.2l1.6 1.6M11.2 11.2l1.6 1.6M12.2 10.2l1.6 1.6';

// One seam and its parallel stripe; the ball repeats them every 120°.
const VOLLEY_SEAMS =
  'M12 12C9.6 9.3 9.8 5.8 12.4 3.01M16.3 4.1c-1.8 2.2-2.2 5-1.1 7.5';
const VOLLEY_TURNS = ['0', '120', '240'];

function SoccerBall({ color, clipId }: { color: string; clipId: string }) {
  return (
    <>
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx="12" cy="12" r="9" />
        </ClipPath>
      </Defs>
      <Circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
      />
      <Path
        d={SOCCER_CENTER}
        fill={color}
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Path
        d={SOCCER_PATCHES}
        clipPath={`url(#${clipId})`}
        fill={color}
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Path
        d={SOCCER_SEAMS}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </>
  );
}

/** The sport's glyph, drawn for the competition pickers. */
export function SportIcon({
  sport,
  size,
  color,
  filled = false,
  knockoutColor = 'transparent',
  testID,
}: SportIconProps) {
  // SVG ids must be unique on screen and cannot hold React's colons.
  const clipId = `ball${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {sport === 'futebol' && <SoccerBall color={color} clipId={clipId} />}

      {sport === 'futebol-americano' &&
        (filled ? (
          <>
            <Path
              d={FOOTBALL_BODY}
              fill={color}
              stroke={color}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path
              d={FOOTBALL_LACES}
              stroke={knockoutColor}
              strokeWidth={DETAIL}
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <Path
              d={FOOTBALL_BODY}
              stroke={color}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path
              d={FOOTBALL_LACES}
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          </>
        ))}

      {sport === 'volei' && (
        <>
          {filled ? (
            <Circle cx="12" cy="12" r="10" fill={color} />
          ) : (
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={STROKE} />
          )}
          {VOLLEY_TURNS.map((turn) => (
            <G key={turn} transform={`rotate(${turn} 12 12)`}>
              <Path
                d={VOLLEY_SEAMS}
                stroke={filled ? knockoutColor : color}
                strokeWidth={filled ? DETAIL : STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </G>
          ))}
        </>
      )}
    </Svg>
  );
}
