import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/googleai'; // Removed googleAI plugin import

export const ai = genkit({
  plugins: [/* googleAI() */], // googleAI plugin removed
  // model: 'googleai/gemini-2.0-flash', // Default model configuration removed
});
