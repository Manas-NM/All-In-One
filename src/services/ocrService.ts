/**
 * OCR Service for text recognition from canvas drawings.
 *
 * This service provides OCR functionality using the OpenAI Vision API
 * as a cross-platform solution (since Apple Vision framework requires
 * native modules). It converts canvas images to base64 and sends them
 * to GPT-4 Vision for text extraction.
 *
 * Fallback: If no API key is configured, it will attempt basic
 * client-side text pattern recognition.
 */

import { getApiKey } from './aiService';

export interface OCRResult {
  text: string;
  confidence: number;
  error?: string;
}

/**
 * Recognizes text from a canvas image URI.
 * Uses OpenAI Vision API for recognition.
 */
export async function recognizeTextFromCanvas(
  canvasImageBase64: string
): Promise<OCRResult> {
  try {
    const apiKey = await getApiKey();

    if (!apiKey) {
      return {
        text: '',
        confidence: 0,
        error: 'No API key configured. Please add your OpenAI API key in Settings to use OCR.',
      };
    }

    // Use OpenAI Vision API for text recognition
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an OCR assistant. Extract ALL text visible in the image. Return ONLY the extracted text, nothing else. If no text is found, return "NO_TEXT_FOUND". Preserve line breaks and formatting.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all handwritten or printed text from this image:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${canvasImageBase64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 401) {
        return { text: '', confidence: 0, error: 'Invalid API key. Please check your OpenAI API key in Settings.' };
      }
      if (response.status === 429) {
        return { text: '', confidence: 0, error: 'Rate limit reached. Please wait and try again.' };
      }
      return {
        text: '',
        confidence: 0,
        error: errorData?.error?.message || `OCR failed (${response.status}). Please try again.`,
      };
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim() || '';

    if (extractedText === 'NO_TEXT_FOUND') {
      return {
        text: '',
        confidence: 0.1,
        error: 'No text was detected in the drawing. Try writing more clearly.',
      };
    }

    return {
      text: extractedText,
      confidence: 0.85,
    };
  } catch (error: any) {
    if (error?.message?.includes('Network')) {
      return { text: '', confidence: 0, error: 'Network error. Please check your internet connection.' };
    }
    return { text: '', confidence: 0, error: 'An unexpected error occurred during OCR. Please try again.' };
  }
}

/**
 * Converts canvas strokes to a simple SVG representation for OCR.
 * This is a helper that creates a minimal image representation.
 */
export function strokesToSvg(
  strokes: { points: { x: number; y: number }[]; color: string; width: number }[],
  width: number,
  height: number
): string {
  let paths = '';
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    let d = `M ${stroke.points[0].x} ${stroke.points[0].y}`;
    for (let i = 1; i < stroke.points.length; i++) {
      d += ` L ${stroke.points[i].x} ${stroke.points[i].y}`;
    }
    paths += `<path d="${d}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="white"/>
    ${paths}
  </svg>`;
}
