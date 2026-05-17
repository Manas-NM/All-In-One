import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stroke, StrokePoint, DrawingTool, CanvasState } from '../types';
import {
  COLORS,
  PEN_COLORS,
  PEN_COLORS_DARK,
  HIGHLIGHTER_COLOR,
  TOOL_SIZES,
  SPACING,
  RADIUS,
} from '../utils/constants';
import {
  rs,
  rr,
  ri,
  getCanvasDimensions,
} from '../utils/responsive';

interface DrawingCanvasProps {
  initialStrokes?: Stroke[];
  onStrokesChange?: (strokes: Stroke[]) => void;
  canvasHeight?: number;
}

export default function DrawingCanvas({
  initialStrokes = [],
  onStrokesChange,
  canvasHeight,
}: DrawingCanvasProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;
  const penColors = isDark ? PEN_COLORS_DARK : PEN_COLORS;

  // If no explicit height is provided, derive a responsive one from the
  // device class. This keeps the drawing surface comfortable on every
  // form factor (iPhone SE → iPad).
  const responsiveHeight = canvasHeight ?? getCanvasDimensions().height;

  const [canvasState, setCanvasState] = useState<CanvasState>({
    strokes: initialStrokes,
    undoneStrokes: [],
  });
  const [activeTool, setActiveTool] = useState<DrawingTool>('pen');
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const currentStrokeRef = useRef<StrokePoint[]>([]);
  const canvasRef = useRef<View>(null);

  useEffect(() => {
    onStrokesChange?.(canvasState.strokes);
  }, [canvasState.strokes]);

  const getStrokeStyle = useCallback(() => {
    switch (activeTool) {
      case 'pen':
        return {
          color: penColors[activeColorIndex] as string,
          width: TOOL_SIZES.pen,
          opacity: 1,
        };
      case 'highlighter':
        return {
          color: HIGHLIGHTER_COLOR,
          width: TOOL_SIZES.highlighter,
          opacity: 0.4,
        };
      case 'eraser':
        return {
          color: isDark ? COLORS.dark.surface : '#FFFFFF',
          width: TOOL_SIZES.eraser,
          opacity: 1,
        };
    }
  }, [activeTool, activeColorIndex, isDark, penColors]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentStrokeRef.current = [{ x: locationX, y: locationY }];
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentStrokeRef.current.push({ x: locationX, y: locationY });
        // Force re-render for live drawing feedback
        setCanvasState((prev) => ({ ...prev }));
      },
      onPanResponderRelease: () => {
        if (currentStrokeRef.current.length > 1) {
          const style = getStrokeStyle();
          const newStroke: Stroke = {
            id:
              Date.now().toString(36) +
              Math.random().toString(36).substring(2, 6),
            tool: activeTool,
            color: style.color,
            width: style.width,
            opacity: style.opacity,
            points: [...currentStrokeRef.current],
          };
          setCanvasState((prev) => ({
            strokes: [...prev.strokes, newStroke],
            undoneStrokes: [],
          }));
        }
        currentStrokeRef.current = [];
      },
    })
  ).current;

  const handleUndo = () => {
    setCanvasState((prev) => {
      if (prev.strokes.length === 0) return prev;
      const last = prev.strokes[prev.strokes.length - 1];
      return {
        strokes: prev.strokes.slice(0, -1),
        undoneStrokes: [...prev.undoneStrokes, last],
      };
    });
  };

  const handleRedo = () => {
    setCanvasState((prev) => {
      if (prev.undoneStrokes.length === 0) return prev;
      const last = prev.undoneStrokes[prev.undoneStrokes.length - 1];
      return {
        strokes: [...prev.strokes, last],
        undoneStrokes: prev.undoneStrokes.slice(0, -1),
      };
    });
  };

  const handleClear = () => {
    setCanvasState({ strokes: [], undoneStrokes: [] });
  };

  // Render strokes as SVG-style paths using Views
  const renderStroke = (stroke: Stroke, index: number) => {
    if (stroke.points.length < 2) return null;
    return stroke.points.map((point, i) => {
      if (i === 0) return null;
      const prev = stroke.points[i - 1];
      const dx = point.x - prev.x;
      const dy = point.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      return (
        <View
          key={`${index}-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: prev.x - stroke.width / 2,
            top: prev.y - stroke.width / 2,
            width: Math.max(dist, stroke.width),
            height: stroke.width,
            backgroundColor: stroke.color,
            opacity: stroke.opacity,
            borderRadius: stroke.width / 2,
            transform: [{ rotate: `${angle}deg` }],
            transformOrigin: `${stroke.width / 2}px ${stroke.width / 2}px`,
          }}
        />
      );
    });
  };

  const renderCurrentStroke = () => {
    const pts = currentStrokeRef.current;
    if (pts.length < 2) return null;
    const style = getStrokeStyle();

    return pts.map((point, i) => {
      if (i === 0) return null;
      const prev = pts[i - 1];
      const dx = point.x - prev.x;
      const dy = point.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      return (
        <View
          key={`current-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: prev.x - style.width / 2,
            top: prev.y - style.width / 2,
            width: Math.max(dist, style.width),
            height: style.width,
            backgroundColor: style.color,
            opacity: style.opacity,
            borderRadius: style.width / 2,
            transform: [{ rotate: `${angle}deg` }],
            transformOrigin: `${style.width / 2}px ${style.width / 2}px`,
          }}
        />
      );
    });
  };

  // Grid spacing scales lightly with canvas height so the lines feel
  // consistent at different sizes.
  const gridSpacing = Math.max(28, Math.min(40, Math.round(responsiveHeight / 11)));

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View
        style={[
          styles.toolbar,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {/* Drawing Tools */}
        <View style={styles.toolGroup}>
          {(['pen', 'highlighter', 'eraser'] as DrawingTool[]).map((tool) => (
            <TouchableOpacity
              key={tool}
              style={[
                styles.toolButton,
                activeTool === tool && {
                  backgroundColor: COLORS.primary + '20',
                },
              ]}
              onPress={() => setActiveTool(tool)}
            >
              <Ionicons
                name={
                  tool === 'pen'
                    ? 'pencil'
                    : tool === 'highlighter'
                    ? 'color-fill'
                    : 'close-circle'
                }
                size={ri(20)}
                color={
                  activeTool === tool ? COLORS.primary : theme.textSecondary
                }
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Pen Colors (visible when pen active) */}
        {activeTool === 'pen' && (
          <View style={styles.toolGroup}>
            {penColors.map((color, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.colorDot,
                  { backgroundColor: color as string },
                  activeColorIndex === i && styles.colorDotActive,
                ]}
                onPress={() => setActiveColorIndex(i)}
              />
            ))}
          </View>
        )}

        {/* Undo / Redo / Clear */}
        <View style={styles.toolGroup}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleUndo}
            disabled={canvasState.strokes.length === 0}
          >
            <Ionicons
              name="arrow-undo"
              size={ri(20)}
              color={
                canvasState.strokes.length > 0
                  ? theme.text
                  : theme.textTertiary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleRedo}
            disabled={canvasState.undoneStrokes.length === 0}
          >
            <Ionicons
              name="arrow-redo"
              size={ri(20)}
              color={
                canvasState.undoneStrokes.length > 0
                  ? theme.text
                  : theme.textTertiary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={handleClear}>
            <Ionicons name="trash-outline" size={ri(18)} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Canvas */}
      <View
        ref={canvasRef}
        style={[
          styles.canvas,
          {
            height: responsiveHeight,
            backgroundColor: isDark ? COLORS.dark.surface : '#FFFFFF',
            borderColor: theme.border,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Grid lines */}
        {Array.from({ length: Math.floor(responsiveHeight / gridSpacing) }).map(
          (_, i) => (
            <View
              key={`grid-${i}`}
              pointerEvents="none"
              style={[
                styles.gridLine,
                {
                  top: (i + 1) * gridSpacing,
                  backgroundColor: theme.border + '40',
                },
              ]}
            />
          )
        )}

        {/* Saved strokes */}
        {canvasState.strokes.map((stroke, i) => renderStroke(stroke, i))}

        {/* Current stroke being drawn */}
        {renderCurrentStroke()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: rs(SPACING.md),
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: rs(SPACING.md),
    paddingVertical: rs(SPACING.sm),
    gap: rs(SPACING.xs),
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: rr(RADIUS.lg),
    borderTopRightRadius: rr(RADIUS.lg),
  },
  toolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(SPACING.xs),
  },
  toolButton: {
    width: ri(36),
    height: ri(36),
    borderRadius: rr(RADIUS.sm),
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: ri(22),
    height: ri(22),
    borderRadius: ri(22) / 2,
    marginHorizontal: 2,
  },
  colorDotActive: {
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.15 }],
  },
  canvas: {
    borderWidth: 1,
    borderBottomLeftRadius: rr(RADIUS.lg),
    borderBottomRightRadius: rr(RADIUS.lg),
    overflow: 'hidden',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
