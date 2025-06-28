'use server';
/**
 * @fileOverview A flow for transcribing audio data by calling a Python backend.
 *
 * - transcribeAudio - A function that takes audio data URI and returns the transcript.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { callTranscribeApi } from '@/services/python-api';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcript: z.string().describe('The transcribed text from the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

// const transcribeAudioFlow = ai.defineFlow(
//   {
//     name: 'transcribeAudioFlow',
//     inputSchema: TranscribeAudioInputSchema,
//     outputSchema: TranscribeAudioOutputSchema,
//   },
//   async input => {
//     // Instead of calling an LLM, we call the Python API service.
//     const response = await callTranscribeApi(input);
//     return response;
//   }
// );
function dataURItoBlob(dataURI: string): Blob {
  const [header, base64] = dataURI.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async input => {
    // Step 1: Convert data URI to Blob
    const blob = dataURItoBlob(input.audioDataUri);

    // Optional: wrap Blob as a File if needed
    const file = new File([blob], "recording.wav", { type: blob.type });

    // Step 2: Call the backend API with file
    const response = await callTranscribeApi({ file });

    return response;
  }
);

