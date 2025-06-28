'use server';

import type { GenerateGraphNetworkInput, GenerateGraphNetworkOutput } from "@/ai/flows/generate-graph-network";
import type { QueryDataWithLLMInput, QueryDataWithLLMOutput } from "@/ai/flows/query-data-with-llm";
import { info, error } from "firebase-functions/logger";


/**
 * Calls the Python API to generate a graph network.
 * @param input The data and model type.
 * @returns The graph visualization as a data URI.
 */
export async function callGraphApi(input: GenerateGraphNetworkInput): Promise<GenerateGraphNetworkOutput> {
  const url = process.env.GRAPH_API_URL;
  if (!url) {
      throw new Error("GRAPH_API_URL environment variable is not set.");
  }

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
      });

      if (!response.ok) {
          const errorText = await response.text().catch(() => 'Could not read error response.');
          error(`[callGraphApi] API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
          throw new Error(`The graph API returned an error: ${response.statusText}. Please check the server logs.`);
      }

      const result: GenerateGraphNetworkOutput = await response.json();
      return result;
  } catch (err) {
      error(`[callGraphApi] Error calling ${url}:`, err);
      if (err instanceof TypeError && err.message === 'fetch failed') {
          throw new Error(`Network error: Could not connect to the graph API at ${url}. Please ensure the Python server is running.`);
      }
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      throw new Error(`Failed to call the graph API. Reason: ${errorMessage}`);
  }
}

/**
 * Calls the Python API to query data.
 * @param input The data and query.
 * @returns The answer from the API.
 */
export async function callQueryApi(input: QueryDataWithLLMInput): Promise<QueryDataWithLLMOutput> {
    const url = process.env.QUERY_API_URL;
    if (!url) {
        throw new Error("QUERY_API_URL environment variable is not set.");
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Could not read error response.');
            error(`[callQueryApi] API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
            throw new Error(`The query API returned an error: ${response.statusText}. Please check the server logs.`);
        }

        const result: QueryDataWithLLMOutput = await response.json();
        return result;
    } catch (err) {
        error(`[callQueryApi] Error calling ${url}:`, err);
        if (err instanceof TypeError && err.message === 'fetch failed') {
            throw new Error(`Network error: Could not connect to the query API at ${url}. Please ensure the Python server is running.`);
        }
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        throw new Error(`Failed to call the query API. Reason: ${errorMessage}`);
    }
}

/**
 * Calls the Python API to transcribe audio.
 * @param input The audio data as a File object.
 * @returns The transcript from the API.
 */
export async function callTranscribeApi(input: { file: File }): Promise<{ transcript: string; structured: any }> {
  const url = process.env.TRANSCRIBE_API_URL;
  if (!url) {
    throw new Error("TRANSCRIBE_API_URL environment variable is not set.");
  }

  const formData = new FormData();
  formData.append('file', input.file);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response.');
      error(`[callTranscribeApi] API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`The transcribe API returned an error: ${response.statusText}. Please check the server logs.`);
    }

    const data = await response.json();
    info('[callTranscribeApi] Python returned:', data);

    const structured = data;
    const transcript = structured?.root?.content
      ?.map((block: any) => `${block.actor}: ${block.dialogue}`)
      .join('\n') || '';

    return { transcript, structured };
  } catch (err) {
    error(`[callTranscribeApi] Error calling ${url}:`, err);
    if (err instanceof TypeError && err.message === 'fetch failed') {
      throw new Error(`Network error: Could not connect to the transcribe API at ${url}. Please ensure the Python server is running.`);
    }
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
    throw new Error(`Failed to call the transcribe API. Reason: ${errorMessage}`);
  }
}
