import * as SecureStore from 'expo-secure-store';

const API_KEY_STORE = 'openai_api_key';

// ─── Secure API Key Management ──────────────────────────────────

export async function saveApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORE, key);
}

export async function getApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(API_KEY_STORE);
  } catch {
    return null;
  }
}

export async function deleteApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(API_KEY_STORE);
  } catch {
    // Key may not exist
  }
}

// ─── AI Summarization ───────────────────────────────────────────

export interface AISummaryResult {
  summary: string;
  error?: never;
}

export interface AISummaryError {
  summary?: never;
  error: string;
}

export type AISummaryResponse = AISummaryResult | AISummaryError;

export async function summarizeNote(
  title: string,
  textContent: string
): Promise<AISummaryResponse> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      return { error: 'No API key configured. Please add your OpenAI API key in Settings.' };
    }

    if (!title.trim() && !textContent.trim()) {
      return { error: 'Nothing to summarize. Add some content to your note first.' };
    }

    const noteInfo = `Title: ${title || 'Untitled Note'}${textContent ? `\n\nContent:\n${textContent}` : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an academic assistant. Summarize the given note concisely. Focus on key concepts, definitions, and important points. Keep it under 200 words. Use bullet points for clarity when appropriate.',
          },
          {
            role: 'user',
            content: `Summarize this note:\n\n${noteInfo}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 401) {
        return { error: 'Invalid API key. Please check your OpenAI API key in Settings.' };
      }
      if (response.status === 429) {
        return { error: 'Rate limit reached. Please wait a moment and try again.' };
      }
      return {
        error: errorData?.error?.message || `API error (${response.status}). Please try again.`,
      };
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return { error: 'No summary was generated. Please try again.' };
    }

    return { summary };
  } catch (error: any) {
    if (error?.message?.includes('Network')) {
      return { error: 'Network error. Please check your internet connection.' };
    }
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function testApiConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      return { success: false, error: 'No API key configured.' };
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key.' };
    }

    return { success: false, error: `Connection failed (${response.status}).` };
  } catch {
    return { success: false, error: 'Network error.' };
  }
}
