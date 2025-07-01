'use server';
/**
 * @fileOverview A flow for generating a graph network by calling a Python backend.
 *
 * - generateGraphNetwork - A function that takes a transcript and returns nodes and relationships.
 * - GenerateGraphNetworkInput - The input type for the generateGraphNetwork function.
 * - GenerateGraphNetworkOutput - The return type for the generateGraphNetwork function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { callGraphApi } from '@/services/python-api';

const GenerateGraphNetworkInputSchema = z.object({
  transcript: z.string().describe('The transcript to generate the graph from.'),
});
export type GenerateGraphNetworkInput = z.infer<typeof GenerateGraphNetworkInputSchema>;

const NodeSchema = z.object({
  id: z.string(),
  detail: z.string(),
  type: z.string(),
});

const RelationshipSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.string(),
});

const GenerateGraphNetworkOutputSchema = z.object({
  nodes: z.array(NodeSchema).describe("List of nodes in the graph."),
  relationships: z.array(RelationshipSchema).describe("List of relationships between nodes."),
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
    // Instead of calling an LLM, we call the Python API service.
    const response = await callGraphApi(input);
    return response;
  }
);
