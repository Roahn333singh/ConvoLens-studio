'use server';

import type { GenerateGraphNetworkInput, GenerateGraphNetworkOutput } from "@/ai/flows/generate-graph-network";
import type { QueryDataWithLLMInput, QueryDataWithLLMOutput } from "@/ai/flows/query-data-with-llm";
import type { TranscribeAudioOutput } from "@/ai/flows/transcribe-audio";
import {
  log,
  info,
  debug,
  warn,
  error,
  write,
} from "firebase-functions/logger";


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
 * @param input The audio data as a File object.
 * @returns The transcript from the API.
 */
export async function callTranscribeApi(input: { file: File }): Promise<{ transcript: string; structured: any }> {
  const url = process.env.TRANSCRIBE_API_URL;
  log('url:', url);
  if (!url) throw new Error("TRANSCRIBE_API_URL environment variable is not set.");

  const formData = new FormData();
  formData.append('file', input.file);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response.');
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🐍 Python returned:', data);

    // ✅ assume your Python returns structured JSON like this
    const structured = data;

    // ✅ you generate readable version from the content
    const transcript = structured?.root?.content
      ?.map((block: any) => `${block.actor}: ${block.dialogue}`)
      .join('\n') || '';

    return { transcript, structured };
  } catch (error) {
    throw error;
  }
}
