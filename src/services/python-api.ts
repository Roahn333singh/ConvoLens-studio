'use server';

import type { GenerateGraphNetworkInput, GenerateGraphNetworkOutput } from "@/ai/flows/generate-graph-network";
import type { QueryDataWithLLMInput, QueryDataWithLLMOutput } from "@/ai/flows/query-data-with-llm";
import type { TranscribeAudioOutput } from "@/ai/flows/transcribe-audio";
import { info, error } from "firebase-functions/logger";

// A helper function to create a standardized error response
function createApiError(apiName: string, err: any, url?: string): Error {
    error(`[${apiName}] An error occurred:`, err);

    if (err instanceof TypeError && err.message === 'fetch failed') {
        return new Error(`Network error: Could not connect to the ${apiName} at ${url}. Please ensure the Python server is running and accessible.`);
    }

    // If it's already a detailed error from our check, pass it through.
    if (err.message && (err.message.includes('API Error:') || err.message.includes('Application configuration error:'))) {
        return err;
    }
    
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
    return new Error(`Failed to process the ${apiName} request. Reason: ${errorMessage}`);
}


/**
 * Calls the Python API to generate a graph network.
 * @param input The data and model type.
 * @returns The graph visualization as a data URI.
 */
export async function callGraphApi(input: GenerateGraphNetworkInput): Promise<GenerateGraphNetworkOutput> {
  const baseUrl = process.env.GRAPH_API_URL;
  if (!baseUrl) {
      throw createApiError('Graph API', new Error("GRAPH_API_URL environment variable is not set."));
  }
  const url = `${baseUrl}?timestamp=${Date.now()}`;

  try {
      info(`[callGraphApi] Calling ${url}`);
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          cache: 'no-store',
      });

      if (!response.ok) {
          const errorText = await response.text().catch(() => 'Could not read error response body.');
          error(`[callGraphApi] API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
          throw new Error(`Graph API Error: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 200)}...`);
      }

      const result = await response.json();
      info(`[callGraphApi] Successfully received data from API.`);
      return result;
  } catch (err) {
      throw createApiError('Graph API', err, url);
  }
}

/**
 * Calls the Python API to query data.
 * @param input The data and query.
 * @returns The answer from the API.
 */
export async function callQueryApi(input: QueryDataWithLLMInput): Promise<QueryDataWithLLMOutput> {
    const baseUrl = process.env.QUERY_API_URL;
    if (!baseUrl) {
        throw createApiError('Query API', new Error("QUERY_API_URL environment variable is not set."));
    }
    const url = `${baseUrl}?timestamp=${Date.now()}`;

    try {
        info(`[callQueryApi] Calling ${url}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Could not read error response body.');
            error(`[callQueryApi] API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
            throw new Error(`Query API Error: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 200)}...`);
        }

        const result = await response.json();
        info(`[callQueryApi] Successfully received data from API.`);
        return result;
    } catch (err) {
        throw createApiError('Query API', err, url);
    }
}

/**
 * Calls the Python API to transcribe audio.
 * @param input The audio data as a File object.
 * @returns The transcript from the API.
 */
export async function callTranscribeApi(input: { file: File }): Promise<TranscribeAudioOutput> {
  const baseUrl = process.env.TRANSCRIBE_API_URL;
  if (!baseUrl) {
    throw createApiError('Transcribe API', new Error("TRANSCRIBE_API_URL environment variable is not set."));
  }
  const url = `${baseUrl}?timestamp=${Date.now()}`;

  const formData = new FormData();
  formData.append('file', input.file);

  try {
    info(`[callTranscribeApi] Calling ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response body.');
      error(`[callTranscribeApi] API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`Transcribe API Error: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 200)}...`);
    }

    const data = await response.json();
    info('[callTranscribeApi] Successfully received data from Python API.');

    // This logic relies on the python API returning a specific format.
    const transcript = data?.root?.content
      ?.map((block: any) => `${block.actor}: ${block.dialogue}`)
      .join('\n') || '';

    return { transcript };
  } catch (err) {
      throw createApiError('Transcribe API', err, url);
  }
}
