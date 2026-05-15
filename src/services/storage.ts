import { File, Directory, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Stroke } from '../types';

// ─── Directories ────────────────────────────────────────────────

const notesDir = new Directory(Paths.document, 'notes/');
const exportsDir = new Directory(Paths.document, 'exports/');

export async function ensureDirectories(): Promise<void> {
  if (!notesDir.exists) {
    notesDir.create();
  }
  if (!exportsDir.exists) {
    exportsDir.create();
  }
}

// ─── Note Storage ───────────────────────────────────────────────

export async function saveNoteDrawing(noteId: string, strokes: Stroke[]): Promise<string> {
  await ensureDirectories();
  const file = new File(notesDir, `${noteId}.json`);
  file.write(JSON.stringify(strokes));
  return file.uri;
}

export async function loadNoteDrawing(noteId: string): Promise<Stroke[]> {
  const file = new File(notesDir, `${noteId}.json`);
  if (!file.exists) return [];

  try {
    const content = await file.text();
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function deleteNoteDrawing(noteId: string): Promise<void> {
  const file = new File(notesDir, `${noteId}.json`);
  if (file.exists) {
    file.delete();
  }
}

// ─── PDF Export ─────────────────────────────────────────────────

export async function exportNoteToPdf(
  title: string,
  textContent: string,
  strokes: Stroke[],
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  // Generate SVG from strokes
  const svgPaths = strokes
    .map((stroke) => {
      if (stroke.points.length < 2) return '';
      const pathData = stroke.points
        .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
        .join(' ');
      return `<path d="${pathData}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" opacity="${stroke.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('\n');

  const svgContent = strokes.length > 0
    ? `<svg xmlns="https://svgwg.org/svg2-draft/images/painting/linecap-construction.svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="100%" height="auto" style="max-height: 500px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <rect width="${canvasWidth}" height="${canvasHeight}" fill="white"/>
        ${svgPaths}
      </svg>`
    : '';

  const textHtml = textContent
    ? `<div style="font-family: -apple-system, sans-serif; font-size: 14px; line-height: 1.6; color: #333; white-space: pre-wrap; margin-top: 16px;">${escapeHtml(textContent)}</div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #1a1a2e; }
        h1 { font-size: 24px; color: #6C5CE7; margin-bottom: 24px; }
        .meta { font-size: 12px; color: #999; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">Exported from StudentOS • ${new Date().toLocaleDateString()}</div>
      ${svgContent}
      ${textHtml}
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export: ${title}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
