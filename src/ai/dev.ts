import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-uploaded-data.ts';
import '@/ai/flows/query-data-with-llm.ts';
import '@/ai/flows/generate-graph-network.ts';
import '@/ai/flows/transcribe-audio.ts';
