'use server';
/**
 * @fileOverview A flow for generating a graph network from a transcript.
 *
 * - generateGraphNetwork - A function that takes a transcript and returns nodes and relationships.
 * - GenerateGraphNetworkInput - The input type for the generateGraphNetwork function.
 * - GenerateGraphNetworkOutput - The return type for the generateGraphNetwork function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const prompt = ai.definePrompt({
  name: 'generateGraphNetworkPrompt',
  input: {schema: GenerateGraphNetworkInputSchema},
  output: {schema: GenerateGraphNetworkOutputSchema},
  prompt: `From the transcript below, extract the key entities (nodes) and their relationships.
  Identify entities such as people, places, organizations, and key concepts.
  The 'id' should be a concise, unique identifier for the node.
  The 'type' should be a single-word category (e.g., Person, Location, Organization, Concept, Weapon, Vehicle).
  The 'detail' can be a brief description if necessary, otherwise leave it empty.
  For relationships, the 'type' should describe the connection (e.g., MENTIONS, OBSERVES, IS_A, PART_OF).

  Transcript:
  {{{transcript}}}
  `,
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
