'use server';

import type { GenerateGraphNetworkInput, GenerateGraphNetworkOutput } from "@/ai/flows/generate-graph-network";
import type { QueryDataWithLLMInput, QueryDataWithLLMOutput } from "@/ai/flows/query-data-with-llm";
import type { TranscribeAudioInput, TranscribeAudioOutput } from "@/ai/flows/transcribe-audio";

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
      throw new Error(`API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result: GenerateGraphNetworkOutput = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'fetch failed') {
      throw new Error(`Network error: Could not connect to the graph API at ${url}. Please ensure your Python server is running and accessible.`);
    }
    throw error;
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
            throw new Error(`API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result: QueryDataWithLLMOutput = await response.json();
        return result;
    } catch (error) {
        if (error instanceof TypeError && error.message === 'fetch failed') {
            throw new Error(`Network error: Could not connect to the query API at ${url}. Please ensure your Python server is running and accessible.`);
        }
        throw error;
    }
}

/**
 * Calls the Python API to transcribe audio.
 * @param input The audio data URI.
 * @returns The transcript from the API.
 */
export async function callTranscribeApi(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
    const url = process.env.TRANSCRIBE_API_URL;
    if (!url) {
        throw new Error("TRANSCRIBE_API_URL environment variable is not set.");
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
            throw new Error(`API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result: TranscribeAudioOutput = await response.json();
        return result;
    } catch (error) {
        if (error instanceof TypeError && error.message === 'fetch failed') {
            throw new Error(`Network error: Could not connect to the transcribe API at ${url}. Please ensure your Python server is running and accessible.`);
        }
        throw error;
    }
}
