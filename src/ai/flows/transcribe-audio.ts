'use server';

/**
 * @fileOverview A flow for transcribing audio data by calling a Python backend.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { callTranscribeApi } from '@/services/python-api';
import { saveStructuredTranscript } from '@/utils/transcript-store'; // ✅ import this

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe("Audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcript: z.string().describe('The transcribed text from the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

// 👇 Add this type for internal response (not exposed to UI)
type FullTranscriptionResponse = {
  transcript: string;
  structured: {
    root: {
      content: {
        actor: string;
        dialogue: string;
      }[];
    };
  };
};

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

function dataURItoBlob(dataURI: string): Blob {
  const [header, base64] = dataURI.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

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
    // Convert to Blob and File
    const blob = dataURItoBlob(input.audioDataUri);
    const file = new File([blob], "recording.wav", { type: blob.type });

    // Call Python API
    const response = await callTranscribeApi({ file }) as FullTranscriptionResponse;

    // ✅ Save the structured transcript for later (e.g., graph generation)
    saveStructuredTranscript(response.structured);
    console.log('✅ [transcribe-audio] Saved structured transcript:', response.structured?.root?.content);


    // ✅ Return only the readable transcript for UI
    return {
      transcript: response.transcript,
    };
  }
);
