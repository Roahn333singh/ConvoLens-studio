'use server';
/**
 * @fileOverview A flow that allows users to query data by calling a Python backend.
 *
 * - queryDataWithLLM - A function that handles the data querying process.
 * - QueryDataWithLLMInput - The input type for the queryDataWithLLM function.
 * - QueryDataWithLLMOutput - The return type for the queryDataWithLLM function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { callQueryApi } from '@/services/python-api';

const QueryDataWithLLMInputSchema = z.object({
  data: z.string().describe('The data to query.'),
  query: z.string().describe('The query to ask about the data.'),
});
export type QueryDataWithLLMInput = z.infer<typeof QueryDataWithLLMInputSchema>;

const QueryDataWithLLMOutputSchema = z.object({
  answer: z.string().describe('The answer to the query.'),
});
export type QueryDataWithLLMOutput = z.infer<typeof QueryDataWithLLMOutputSchema>;

export async function queryDataWithLLM(input: QueryDataWithLLMInput): Promise<QueryDataWithLLMOutput> {
  return queryDataWithLLMFlow(input);
}

const queryDataWithLLMFlow = ai.defineFlow(
  {
    name: 'queryDataWithLLMFlow',
    inputSchema: QueryDataWithLLMInputSchema,
    outputSchema: QueryDataWithLLMOutputSchema,
  },
  async input => {
    // Instead of calling an LLM, we call the Python API service.
    const response = await callQueryApi(input);
    return response;
  }
);
