import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { encode, decode } from '@msgpack/msgpack';
import { Stroke } from '../types';

const documentDir = FileSystem.documentDirectory ?? '';
const notesDir = `${documentDir}notes/`;
const exportsDir = `${documentDir}exports/`;
const notebooksDir = `${documentDir}notebooks/`;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  const btoaFn = (globalThis as any).btoa as ((value: string) => string) | undefined;
  if (!btoaFn) throw new Error('Base64 encoder unavailable in runtime');
  return btoaFn(binary);
}

function fromBase64(base64: string): Uint8Array {
  const atobFn = (globalThis as any).atob as ((value: string) => string) | undefined;
  if (!atobFn) throw new Error('Base64 decoder unavailable in runtime');
  const binary = atobFn(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function ensureDirectories(): Promise<void> {
  await FileSystem.makeDirectoryAsync(notesDir, { intermediates: true });
  await FileSystem.makeDirectoryAsync(exportsDir, { intermediates: true });
  await FileSystem.makeDirectoryAsync(notebooksDir, { intermediates: true });
}

// Legacy note storage (kept for compatibility)
export async function saveNoteDrawing(noteId: string, strokes: Stroke[]): Promise<string> {
  await ensureDirectories();
  const fileUri = `${notesDir}${noteId}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(strokes));
  return fileUri;
}

export async function loadNoteDrawing(noteId: string): Promise<Stroke[]> {
  const fileUri = `${notesDir}${noteId}.json`;
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists) return [];
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    return JSON.parse(content) as Stroke[];
  } catch {
    return [];
  }
}

export async function deleteNoteDrawing(noteId: string): Promise<void> {
  const fileUri = `${notesDir}${noteId}.json`;
  const info = await FileSystem.getInfoAsync(fileUri);
  if (info.exists) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }
}

// New per-page MessagePack storage
function getNotebookPageFile(notebookId: string, pageId: string): string {
  return `${notebooksDir}${notebookId}/pages/${pageId}.msgpack`;
}

async function ensureNotebookDirs(notebookId: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(`${notebooksDir}${notebookId}/pages/`, {
    intermediates: true,
  });
}

export async function savePageDrawing(
  notebookId: string,
  pageId: string,
  strokes: Stroke[]
): Promise<string> {
  await ensureNotebookDirs(notebookId);
  const bytes = encode(strokes);
  const fileUri = getNotebookPageFile(notebookId, pageId);
  await FileSystem.writeAsStringAsync(fileUri, toBase64(bytes));
  return fileUri;
}

export async function loadPageDrawing(
  notebookId: string,
  pageId: string
): Promise<Stroke[]> {
  const fileUri = getNotebookPageFile(notebookId, pageId);
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists) return [];

  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri);
    const bytes = fromBase64(base64);
    const decoded = decode(bytes);
    return Array.isArray(decoded) ? (decoded as Stroke[]) : [];
  } catch {
    return [];
  }
}

export async function duplicatePageDrawing(
  notebookId: string,
  sourcePageId: string,
  targetPageId: string
): Promise<void> {
  const source = getNotebookPageFile(notebookId, sourcePageId);
  const target = getNotebookPageFile(notebookId, targetPageId);
  const info = await FileSystem.getInfoAsync(source);
  if (!info.exists) return;
  await ensureNotebookDirs(notebookId);
  await FileSystem.copyAsync({ from: source, to: target });
}

export async function deletePageDrawing(notebookId: string, pageId: string): Promise<void> {
  const fileUri = getNotebookPageFile(notebookId, pageId);
  await FileSystem.deleteAsync(fileUri, { idempotent: true });
}

export async function exportNoteToPdf(
  title: string,
  textContent: string,
  strokes: Stroke[],
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  const svgPaths = strokes
    .map((stroke) => {
      if (stroke.points.length < 2) return '';
      const pathData = stroke.points
        .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
        .join(' ');
      return `<path d="${pathData}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" opacity="${stroke.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('\n');

  const svgContent =
    strokes.length > 0
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="100%" height="auto" style="max-height: 500px; border: 1px solid #e0e0e0; border-radius: 8px;"><rect width="${canvasWidth}" height="${canvasHeight}" fill="white"/>${svgPaths}</svg>`
      : '';

  const textHtml = textContent
    ? `<div style="font-family: -apple-system, sans-serif; font-size: 14px; line-height: 1.6; color: #333; white-space: pre-wrap; margin-top: 16px;">${escapeHtml(textContent)}</div>`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #1a1a2e; } h1 { font-size: 24px; color: #6C5CE7; margin-bottom: 24px; } .meta { font-size: 12px; color: #999; margin-bottom: 20px; }</style></head><body><h1>${escapeHtml(
    title
  )}</h1><div class="meta">Exported from StudentOS • ${new Date().toLocaleDateString()}</div>${svgContent}${textHtml}</body></html>`;

  const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export: ${title}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

export async function exportNotebookToPdf(
  notebookTitle: string,
  pages: Array<{ title: string; template: string; strokes: Stroke[]; text?: string }>,
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  const pageHtml = pages
    .map((page, index) => {
      const svgPaths = page.strokes
        .map((stroke) => {
          if (stroke.points.length < 2) return '';
          const d = stroke.points
            .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
            .join(' ');
          return `<path d="${d}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" opacity="${stroke.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
        })
        .join('');

      return `
      <section class="page">
        <h2>${escapeHtml(page.title || `Page ${index + 1}`)}</h2>
        <div class="meta">Template: ${escapeHtml(page.template)}</div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="100%" height="auto">
          <rect width="${canvasWidth}" height="${canvasHeight}" fill="white" />
          ${svgPaths}
        </svg>
        ${page.text ? `<p>${escapeHtml(page.text)}</p>` : ''}
      </section>`;
    })
    .join('');

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; }
          h1 { color: #6C5CE7; }
          .page { page-break-after: always; margin-bottom: 32px; }
          .page:last-child { page-break-after: auto; }
          .meta { font-size: 12px; color: #666; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(notebookTitle)}</h1>
        ${pageHtml}
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export Notebook: ${notebookTitle}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
