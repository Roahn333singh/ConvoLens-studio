// src/ai/flows/generate-graph-network.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { callGraphApi } from '@/services/python-api';

const GenerateGraphNetworkInputSchema = z.object({
  transcript: z.string().describe('The transcript to generate the graph from.'),
});
export type GenerateGraphNetworkInput = z.infer<typeof GenerateGraphNetworkInputSchema>;

const GenerateGraphNetworkOutputSchema = z.object({
  graphDataUri: z.string().describe(
    'The graph network visualization as a data URI that must include a MIME type and use Base64 encoding.'
  ),
});
export type GenerateGraphNetworkOutput = z.infer<typeof GenerateGraphNetworkOutputSchema>;

export async function generateGraphNetwork(input: GenerateGraphNetworkInput): Promise<GenerateGraphNetworkOutput> {
  return generateGraphNetworkFlow(input);
}

const generateGraphNetworkFlow = ai.defineFlow(
  {
    name: 'generateGraphNetworkFlow',
    inputSchema: GenerateGraphNetworkInputSchema,
    outputSchema: GenerateGraphNetworkOutputSchema,
  },
  async input => {
    const response = await callGraphApi(input); // ✅ Sends { transcript }
    return response;
  }
);
