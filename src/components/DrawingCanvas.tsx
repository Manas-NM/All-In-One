import React, { useMemo, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Line,
  Circle,
  Rect,
  Group,
} from '@shopify/react-native-skia';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Stroke, StrokePoint, CanvasTemplate, DrawingTool } from '../types';
import { COLORS } from '../utils/constants';

interface DrawingCanvasProps {
  initialStrokes?: Stroke[];
  onStrokesChange?: (strokes: Stroke[]) => void;
  canvasHeight?: number;
  canvasWidth?: number;
  template?: CanvasTemplate;
  activeTool?: DrawingTool;
  penColor?: string;
  penSize?: number;
  highlighterColor?: string;
  highlighterSize?: number;
  zoomScale?: number;
}

function strokeToSkiaPath(points: StrokePoint[]) {
  const path = Skia.Path.Make();
  if (!points.length) return path;
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    path.lineTo(points[i].x, points[i].y);
  }
  return path;
}

export default function DrawingCanvas({
  initialStrokes = [],
  onStrokesChange,
  canvasHeight = 560,
  canvasWidth = 1000,
  template = 'lined',
  activeTool = 'pen',
  penColor = '#2D3436',
  penSize = 2,
  highlighterColor = '#FFE066',
  highlighterSize = 12,
  zoomScale = 1,
}: DrawingCanvasProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [draftPoints, setDraftPoints] = useState<StrokePoint[]>([]);

  const applyStrokes = (next: Stroke[]) => {
    setStrokes(next);
    onStrokesChange?.(next);
  };

  const beginStroke = (x: number, y: number) => {
    setDraftPoints([{ x, y, p: 1, t: Date.now() }]);
  };

  const addPoint = (x: number, y: number, pressure?: number) => {
    setDraftPoints((prev) => [...prev, { x, y, p: pressure ?? 1, t: Date.now() }]);
  };

  const finishStroke = () => {
    if (draftPoints.length < 2) {
      setDraftPoints([]);
      return;
    }

    if (activeTool === 'eraser') {
      const [last] = draftPoints.slice(-1);
      if (!last) return;
      const next = strokes.filter((stroke) => {
        return !stroke.points.some((p) => Math.hypot(p.x - last.x, p.y - last.y) < 16);
      });
      applyStrokes(next);
      setDraftPoints([]);
      return;
    }

    const isHighlight = activeTool === 'highlighter';
    const stroke: Stroke = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tool: isHighlight ? 'highlighter' : 'pen',
      color: isHighlight ? highlighterColor : penColor,
      width: isHighlight ? highlighterSize : penSize,
      opacity: isHighlight ? 0.33 : 1,
      points: [...draftPoints],
      baseWidth: isHighlight ? highlighterSize : penSize,
      penType: 'ballpoint',
    };

    applyStrokes([...strokes, stroke]);
    setDraftPoints([]);
  };

  const drawGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      runOnJS(beginStroke)(e.x / zoomScale, e.y / zoomScale);
    })
    .onUpdate((e) => {
      const pressure = (e as any).stylusData?.pressure;
      runOnJS(addPoint)(e.x / zoomScale, e.y / zoomScale, pressure);
    })
    .onEnd(() => {
      runOnJS(finishStroke)();
    });

  const renderedStrokes = useMemo(() => {
    return strokes.map((stroke) => ({
      id: stroke.id,
      path: strokeToSkiaPath(stroke.points),
      color: stroke.color,
      width: stroke.width,
      opacity: stroke.opacity,
    }));
  }, [strokes]);

  const draftPath = useMemo(() => strokeToSkiaPath(draftPoints), [draftPoints]);

  const renderTemplate = () => {
    switch (template) {
      case 'lined': {
        const lines = [];
        for (let y = 44; y < canvasHeight; y += 32) {
          lines.push(
            <Line
              key={`line-${y}`}
              p1={{ x: 0, y }}
              p2={{ x: canvasWidth, y }}
              color={isDark ? '#2a2f3e' : '#E9ECF4'}
              strokeWidth={1}
            />
          );
        }
        return lines;
      }
      case 'grid': {
        const grid = [];
        for (let x = 0; x < canvasWidth; x += 32) {
          grid.push(
            <Line key={`vx-${x}`} p1={{ x, y: 0 }} p2={{ x, y: canvasHeight }} color={isDark ? '#242936' : '#EEF1F7'} strokeWidth={1} />
          );
        }
        for (let y = 0; y < canvasHeight; y += 32) {
          grid.push(
            <Line key={`hy-${y}`} p1={{ x: 0, y }} p2={{ x: canvasWidth, y }} color={isDark ? '#242936' : '#EEF1F7'} strokeWidth={1} />
          );
        }
        return grid;
      }
      case 'dotted': {
        const dots = [];
        for (let x = 20; x < canvasWidth; x += 28) {
          for (let y = 20; y < canvasHeight; y += 28) {
            dots.push(<Circle key={`dot-${x}-${y}`} cx={x} cy={y} r={1.2} color={isDark ? '#2d3343' : '#D8DDEB'} />);
          }
        }
        return dots;
      }
      case 'cornell': {
        return (
          <>
            <Line p1={{ x: canvasWidth * 0.22, y: 0 }} p2={{ x: canvasWidth * 0.22, y: canvasHeight }} color={isDark ? '#32405d' : '#B7C7E8'} strokeWidth={2} />
            <Line p1={{ x: 0, y: canvasHeight * 0.82 }} p2={{ x: canvasWidth, y: canvasHeight * 0.82 }} color={isDark ? '#32405d' : '#B7C7E8'} strokeWidth={2} />
          </>
        );
      }
      case 'blank':
      default:
        return null;
    }
  };

  return (
    <View style={[styles.wrapper, { borderColor: theme.border, height: canvasHeight }]}> 
      <GestureDetector gesture={drawGesture}>
        <Canvas style={{ width: canvasWidth * zoomScale, height: canvasHeight * zoomScale }}>
          <Group transform={[{ scale: zoomScale }]}> 
            <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} color={isDark ? '#0F1525' : '#FFFFFF'} />
            {renderTemplate()}
            {renderedStrokes.map((stroke) => (
              <Path
                key={stroke.id}
                path={stroke.path}
                color={stroke.color}
                style="stroke"
                strokeWidth={stroke.width}
                strokeCap="round"
                strokeJoin="round"
                opacity={stroke.opacity}
              />
            ))}
            {draftPoints.length > 1 && (
              <Path
                path={draftPath}
                color={activeTool === 'highlighter' ? highlighterColor : penColor}
                style="stroke"
                strokeWidth={activeTool === 'highlighter' ? highlighterSize : penSize}
                opacity={activeTool === 'highlighter' ? 0.33 : 1}
                strokeCap="round"
                strokeJoin="round"
              />
            )}
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
});
