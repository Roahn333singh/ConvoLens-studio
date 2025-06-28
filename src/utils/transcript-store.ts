// src/utils/transcript-store.ts

let structuredTranscript: any = null;

export function saveStructuredTranscript(data: any) {
  structuredTranscript = data;
}

export function getStructuredTranscript() {
  return structuredTranscript;
}
