/**
 * Print Service for generating printable HTML and invoking the native print dialog.
 * Uses expo-print for PDF generation and expo-sharing for sharing.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Note, Flashcard, FlashcardDeck, Habit, HabitStats } from '../types';
import { Stroke } from '../types';

// ─── Helpers ────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
}

function strokesToSvg(strokes: Stroke[], width: number, height: number): string {
  let paths = '';
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    let d = `M ${stroke.points[0].x} ${stroke.points[0].y}`;
    for (let i = 1; i < stroke.points.length; i++) {
      d += ` L ${stroke.points[i].x} ${stroke.points[i].y}`;
    }
    paths += `<path d="${d}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" opacity="${stroke.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<svg xmlns="https://i.ytimg.com/vi/dRloFvC7g6I/maxresdefault.jpg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="border: 1px solid #eee; border-radius: 8px;">${paths}</svg>`;
}

const baseStyles = `
  <style>
    @page { margin: 20mm; }
    body { font-family: -apple-system, 'Helvetica Neue', sans-serif; color: #1a1a2e; line-height: 1.6; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 18px; color: #6C5CE7; margin-top: 20px; }
    .meta { color: #6c757d; font-size: 12px; margin-bottom: 16px; }
    .content { font-size: 14px; white-space: pre-wrap; }
    .summary { background: #f8f9fa; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #6C5CE7; margin: 16px 0; }
    .flashcard-grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .flashcard { border: 1px solid #e9ecef; border-radius: 8px; padding: 12px; width: 48%; page-break-inside: avoid; }
    .flashcard .front { font-weight: 600; margin-bottom: 8px; font-size: 13px; }
    .flashcard .back { color: #6c757d; font-size: 12px; border-top: 1px dashed #e9ecef; padding-top: 8px; }
    .stat-grid { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0; }
    .stat-card { background: #f8f9fa; border-radius: 8px; padding: 12px; text-align: center; min-width: 100px; }
    .stat-value { font-size: 24px; font-weight: 700; color: #6C5CE7; }
    .stat-label { font-size: 11px; color: #6c757d; }
    .habit-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f1f3f5; }
    .habit-dot { width: 12px; height: 12px; border-radius: 6px; }
    .ocr-text { background: #fff3cd; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #FDCB6E; margin: 16px 0; }
  </style>
`;

// ─── Print Note ─────────────────────────────────────────────────

export interface PrintNoteOptions {
  includeDrawing?: boolean;
  includeSummary?: boolean;
  includeOcrText?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
}

export async function printNote(
  note: Note,
  strokes: Stroke[],
  options: PrintNoteOptions = {}
): Promise<void> {
  const {
    includeDrawing = true,
    includeSummary = true,
    includeOcrText = false,
    canvasWidth = 350,
    canvasHeight = 300,
  } = options;

  let drawingSvg = '';
  if (includeDrawing && strokes.length > 0) {
    drawingSvg = `
      <h2>Drawing</h2>
      ${strokesToSvg(strokes, canvasWidth, canvasHeight)}
    `;
  }

  let summaryHtml = '';
  if (includeSummary && note.aiSummary) {
    summaryHtml = `
      <h2>AI Summary</h2>
      <div class="summary">${escapeHtml(note.aiSummary)}</div>
    `;
  }

  let ocrHtml = '';
  if (includeOcrText && note.ocrText) {
    ocrHtml = `
      <h2>Extracted Text (OCR)</h2>
      <div class="ocr-text">${escapeHtml(note.ocrText)}</div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <h1>${escapeHtml(note.title || 'Untitled Note')}</h1>
      <p class="meta">Created: ${new Date(note.createdAt).toLocaleDateString()} · Updated: ${new Date(note.updatedAt).toLocaleDateString()}</p>
      ${note.textContent ? `<div class="content">${escapeHtml(note.textContent)}</div>` : ''}
      ${summaryHtml}
      ${ocrHtml}
      ${drawingSvg}
    </body>
    </html>
  `;

  await Print.printAsync({ html });
}

// ─── Print Flashcards ───────────────────────────────────────────

export async function printFlashcards(
  deck: FlashcardDeck,
  cards: Flashcard[]
): Promise<void> {
  const cardsHtml = cards
    .map(
      (card, i) => `
    <div class="flashcard">
      <div class="front">${i + 1}. ${escapeHtml(card.front)}</div>
      <div class="back">${escapeHtml(card.back)}</div>
    </div>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <h1>${escapeHtml(deck.name)}</h1>
      ${deck.description ? `<p class="meta">${escapeHtml(deck.description)}</p>` : ''}
      <p class="meta">${cards.length} cards · Printed ${new Date().toLocaleDateString()}</p>
      <div class="flashcard-grid">${cardsHtml}</div>
    </body>
    </html>
  `;

  await Print.printAsync({ html });
}

// ─── Print Habit Report ─────────────────────────────────────────

export interface HabitReportData {
  habit: Habit;
  stats: HabitStats;
}

export async function printHabitReport(
  habitsData: HabitReportData[],
  dateRange: string
): Promise<void> {
  const habitsHtml = habitsData
    .map(
      ({ habit, stats }) => `
    <div style="page-break-inside: avoid; margin-bottom: 20px;">
      <div class="habit-row">
        <span class="habit-dot" style="background: ${habit.color};"></span>
        <strong>${escapeHtml(habit.name)}</strong>
        <span style="color: #6c757d; font-size: 12px; margin-left: auto;">${habit.frequency === 'daily' ? 'Daily' : `${habit.targetDays}×/week`}</span>
      </div>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalCompletions}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">🔥 ${stats.currentStreak}</div>
          <div class="stat-label">Current Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">⭐ ${stats.bestStreak}</div>
          <div class="stat-label">Best Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.thisWeekCompletions}</div>
          <div class="stat-label">This Week</div>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <h1>Habit Report</h1>
      <p class="meta">${escapeHtml(dateRange)} · ${habitsData.length} habit${habitsData.length !== 1 ? 's' : ''} · Printed ${new Date().toLocaleDateString()}</p>
      ${habitsHtml}
    </body>
    </html>
  `;

  await Print.printAsync({ html });
}
