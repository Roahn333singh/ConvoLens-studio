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

function dataURItoBlob(dataURI: string): Blob {
  const [header, base64] = dataURI.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  // Use Buffer.from for server-side (Node.js) Base64 decoding
  const buffer = Buffer.from(base64, 'base64');
  return new Blob([buffer], { type: mime });
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

    // Step 2: Wrap Blob as a File if needed
    const file = new File([blob], "recording.wav", { type: blob.type });

    // Step 3: Call the backend API with file
    const response = await callTranscribeApi({ file });

    return response;
  }
);
