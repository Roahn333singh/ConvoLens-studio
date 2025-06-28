// transcribeAndGenerateGraph.ts
'use server';

import { generateGraphNetwork } from '@/ai/flows/generate-graph-network';
import { getStructuredTranscript } from '@/utils/transcript-store';

export async function transcribeAndGenerateGraph() {
  const structured = getStructuredTranscript();
  console.log('📦 [generate-graph] Got structured transcript:', structured);

  if (!structured) {
    throw new Error('Structured transcript not found. Make sure transcription was done before generating graph.');
  }

  const content = structured?.root?.content;
  console.log('📦 [generate-graph] root.content:', content);

  if (Array.isArray(content) && content.length > 0) {
    const formatted = content
      .map((entry: { actor: string; dialogue: string }) => `${entry.actor}: ${entry.dialogue}`)
      .join('\n');

    if (!formatted.trim()) {
      throw new Error('Formatted transcript is empty. Check content structure.');
    }

    console.log('✅ Formatted transcript for graph:', formatted);

    return await generateGraphNetwork({
      transcript: formatted, // ✅ FIXED
    });
  }

  if (structured?.transcript) {
    console.log('⚠️ Falling back to flat transcript:', structured.transcript);

    return await generateGraphNetwork({
      transcript: structured.transcript, // ✅ FIXED
    });
  }

  console.error('❌ No transcript data found in structured:', structured);
  throw new Error('Transcript not provided');
}
