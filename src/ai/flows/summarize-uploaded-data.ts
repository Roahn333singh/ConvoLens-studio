// Summarize the uploaded data
'use server';
/**
 * @fileOverview A flow for summarizing uploaded data using an LLM.
 *
 * - summarizeUploadedData - A function that takes data as input and returns a concise summary.
 * - SummarizeUploadedDataInput - The input type for the summarizeUploadedData function.
 * - SummarizeUploadedDataOutput - The return type for the summarizeUploadedData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeUploadedDataInputSchema = z.object({
  data: z.string().describe('The data to be summarized.'),
});
export type SummarizeUploadedDataInput = z.infer<typeof SummarizeUploadedDataInputSchema>;

const SummarizeUploadedDataOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the data.'),
});
export type SummarizeUploadedDataOutput = z.infer<typeof SummarizeUploadedDataOutputSchema>;

export async function summarizeUploadedData(input: SummarizeUploadedDataInput): Promise<SummarizeUploadedDataOutput> {
  return summarizeUploadedDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeUploadedDataPrompt',
  input: {schema: SummarizeUploadedDataInputSchema},
  output: {schema: SummarizeUploadedDataOutputSchema},
  prompt: `Please provide a concise summary of the following data:\n\n{{{data}}}`,
});

const summarizeUploadedDataFlow = ai.defineFlow(
  {
    name: 'summarizeUploadedDataFlow',
    inputSchema: SummarizeUploadedDataInputSchema,
    outputSchema: SummarizeUploadedDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
