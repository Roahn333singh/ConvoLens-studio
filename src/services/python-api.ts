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
  // MOCK IMPLEMENTATION FOR DEMONSTRATION
  // This is a mocked implementation that returns a placeholder image.
  console.log("MOCK: Simulating graph generation for input:", input);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    graphDataUri: 'https://placehold.co/800x600.png',
  };
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
// services/python-api.ts

// export async function callTranscribeApi(input: { file: File }): Promise<TranscribeAudioOutput> {
//   const url = process.env.TRANSCRIBE_API_URL;
//   console.log("Transcribe API URL:", url);

//   if (!url) {
//     throw new Error("TRANSCRIBE_API_URL environment variable is not set.");
//   }

//   const formData = new FormData();
//   formData.append('file', input.file);
//   console.log("Transcribe API URL:", url);


//   try {
//     const response = await fetch(url, {
//       method: 'POST',
//       body: formData,
//       headers: {
//         'User-Agent': 'Mozilla/5.0', // ✅ add here if this is running in server-side
//       },
//     });

//     if (!response.ok) {
//       const errorText = await response.text().catch(() => 'Could not read error response.');
//       throw new Error(`API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
//     }

//     const result: TranscribeAudioOutput = await response.json();
//     return result;
//   } catch (error) {
//     if (error instanceof TypeError && error.message === 'fetch failed') {
//       throw new Error(`Network error: Could not connect to the transcribe API at ${url}. Please ensure your Python server is running and accessible.`);
//     }
//     throw error;
//   }
// }





export async function callTranscribeApi(input: { file: File }): Promise<TranscribeAudioOutput> {
  const url = process.env.NEXT_PUBLIC_TRANSCRIBE_API_URL;
  console.log("Transcribe API URL:", url);
  if (!url) {
    console.error("❌ TRANSCRIBE_API_URL is undefined. Check your .env file and next.config.js.");
    throw new Error("TRANSCRIBE_API_URL environment variable is not set.");
  }

  const formData = new FormData();
  formData.append('file', input.file);
  console.log("Transcribe API URL:", url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData, // ✅ sending as multipart/form-data
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
