// src/ai/flows/generate-graph-network.ts
'use server';

/**
 * @fileOverview Generates a graph network visualization based on input data using an LLM.
 *
 * - generateGraphNetwork - A function that generates a graph network visualization.
 * - GenerateGraphNetworkInput - The input type for the generateGraphNetwork function.
 * - GenerateGraphNetworkOutput - The return type for the generateGraphNetwork function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGraphNetworkInputSchema = z.object({
  data: z.string().describe('The data to be used to generate the graph network.'),
  modelType: z.enum(['GPT', 'LLaMA', 'DeepSeek']).default('GPT').describe('The type of the model to be used.'),
});
export type GenerateGraphNetworkInput = z.infer<typeof GenerateGraphNetworkInputSchema>;

const GenerateGraphNetworkOutputSchema = z.object({
  graphDataUri: z
    .string()
    .describe(
      'The graph network visualization as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type GenerateGraphNetworkOutput = z.infer<typeof GenerateGraphNetworkOutputSchema>;

export async function generateGraphNetwork(input: GenerateGraphNetworkInput): Promise<GenerateGraphNetworkOutput> {
  return generateGraphNetworkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGraphNetworkPrompt',
  input: {schema: GenerateGraphNetworkInputSchema},
  output: {schema: GenerateGraphNetworkOutputSchema},
  prompt: `You are an expert in data visualization and graph network generation.

  Based on the following data, generate a graph network visualization.  Return the visualization as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.

Data: {{{data}}}`,
});

const generateGraphNetworkFlow = ai.defineFlow(
  {
    name: 'generateGraphNetworkFlow',
    inputSchema: GenerateGraphNetworkInputSchema,
    outputSchema: GenerateGraphNetworkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
