import { Dimensions, PixelRatio, Platform, ScaledSize } from 'react-native';

// ─── Screen Dimensions ──────────────────────────────────────────
// We read these once at module load. Most layout decisions should be
// made via the responsive helpers below so they remain stable across
// rotations / device sizes.

const window: ScaledSize = Dimensions.get('window');

export const SCREEN_WIDTH = window.width;
export const SCREEN_HEIGHT = window.height;

// ─── Reference Device ───────────────────────────────────────────
// We design against the iPhone 14 / 13 (390 × 844) as the baseline.
// All scaling factors are derived relative to this device.

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// ─── Device Size Detection ──────────────────────────────────────
// Breakpoints are aligned with iOS device classes:
//   • Small   – iPhone SE (375 × 667) and smaller
//   • Medium  – iPhone 12/13/14/15 (390–393 × 844–852)
//   • Large   – iPhone Plus / Pro Max (414–430 × 896–932)
//   • Tablet  – iPad (≥ 768 wide)

export const isSmallDevice = (): boolean => SCREEN_WIDTH < 380;
export const isMediumDevice = (): boolean =>
  SCREEN_WIDTH >= 380 && SCREEN_WIDTH < 414;
export const isLargeDevice = (): boolean =>
  SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768;
export const isTablet = (): boolean => SCREEN_WIDTH >= 768;

export type DeviceClass = 'small' | 'medium' | 'large' | 'tablet';

export const getDeviceClass = (): DeviceClass => {
  if (isTablet()) return 'tablet';
  if (isLargeDevice()) return 'large';
  if (isSmallDevice()) return 'small';
  return 'medium';
};

// ─── Scaling Helpers ────────────────────────────────────────────

/**
 * Scales a horizontal value based on the screen width relative to the
 * 390-point baseline. Best for paddings, margins, widths.
 */
export const scaleWidth = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * Scales a vertical value based on the screen height relative to the
 * 844-point baseline. Best for vertical spacing / heights.
 */
export const scaleHeight = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

/**
 * Moderate scale – grows/shrinks proportionally to the screen width but
 * with a dampening factor so large devices don't get oversized text /
 * spacing. Inspired by the popular `react-native-size-matters` lib.
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scaleWidth(size) - size) * factor;
};

// ─── Public API ─────────────────────────────────────────────────

/**
 * Returns a responsive font size, rounded to the nearest pixel so text
 * stays crisp on all DPRs. We use a slightly lower factor for fonts so
 * typography stays comfortable on tablets.
 */
export const getResponsiveFontSize = (baseSize: number): number => {
  // On tablets we don't want fonts to balloon – clamp the effective
  // scaling so the typography stays readable, not gigantic.
  const tabletClamp = isTablet() ? Math.min(SCREEN_WIDTH, 540) : SCREEN_WIDTH;
  const ratio = tabletClamp / BASE_WIDTH;
  const scaled = baseSize + (baseSize * ratio - baseSize) * 0.45;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

/**
 * Returns a responsive spacing value (padding / margin / gap). Uses a
 * moderate scale so iPads don't get cavernous gaps but small phones
 * still tighten up.
 */
export const getResponsiveSpacing = (baseSpacing: number): number => {
  const factor = isTablet() ? 0.35 : 0.5;
  return Math.round(moderateScale(baseSpacing, factor));
};

/**
 * Returns a responsive radius. Slightly more aggressive scaling than
 * spacing to keep cards looking proportional on large screens.
 */
export const getResponsiveRadius = (baseRadius: number): number => {
  return Math.round(moderateScale(baseRadius, 0.4));
};

/**
 * Returns a responsive icon / hit-target size. We bias slightly towards
 * larger taps on bigger devices for better ergonomics.
 */
export const getResponsiveIconSize = (baseSize: number): number => {
  return Math.round(moderateScale(baseSize, 0.5));
};

/**
 * Picks a value per device class. Useful when a numeric scale isn't
 * enough (e.g., choosing a column count for a grid).
 *
 * Example:
 *   const cols = pickByDevice({ small: 1, medium: 2, large: 2, tablet: 3 });
 */
export const pickByDevice = <T,>(values: {
  small: T;
  medium: T;
  large: T;
  tablet: T;
}): T => {
  return values[getDeviceClass()];
};

/**
 * Returns the horizontal screen padding that should be applied to the
 * outer container of every screen. Larger on tablets so content doesn't
 * stretch edge-to-edge.
 */
export const getScreenHorizontalPadding = (): number => {
  return pickByDevice({
    small: 14,
    medium: 16,
    large: 18,
    tablet: 32,
  });
};

/**
 * Maximum content width – used to keep things readable on iPads where
 * a full-bleed layout would feel too wide.
 */
export const getMaxContentWidth = (): number => {
  return isTablet() ? 720 : SCREEN_WIDTH;
};

/**
 * Default canvas dimensions for the drawing surface. Adapts so the
 * canvas fills the available width on phones but is constrained on
 * tablets.
 */
export const getCanvasDimensions = (): { width: number; height: number } => {
  const horizontalPadding = getScreenHorizontalPadding();
  const width = Math.min(SCREEN_WIDTH, getMaxContentWidth()) - horizontalPadding * 2;
  const height = pickByDevice({
    small: 280,
    medium: 340,
    large: 380,
    tablet: 520,
  });
  return { width, height };
};

/**
 * Chart dimensions for ExpenseChart bar / pie charts.
 */
export const getChartDimensions = (): {
  barWidth: number;
  barHeight: number;
  pieRadius: number;
  pieInnerRadius: number;
} => {
  return {
    barWidth: Math.min(SCREEN_WIDTH, getMaxContentWidth()) - getResponsiveSpacing(100),
    barHeight: pickByDevice({
      small: 130,
      medium: 150,
      large: 170,
      tablet: 220,
    }),
    pieRadius: pickByDevice({
      small: 60,
      medium: 70,
      large: 80,
      tablet: 110,
    }),
    pieInnerRadius: pickByDevice({
      small: 38,
      medium: 45,
      large: 52,
      tablet: 72,
    }),
  };
};

// ─── Convenience Aliases ────────────────────────────────────────
// Shorter names for use inside StyleSheet definitions where brevity
// keeps the styling readable.

export const rf = getResponsiveFontSize;
export const rs = getResponsiveSpacing;
export const rr = getResponsiveRadius;
export const ri = getResponsiveIconSize;

// ─── Platform Helpers ───────────────────────────────────────────

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
