
import {genkit} from 'genkit';
import {googleAI} from 'genkit/plugins/googleai';

// Initialize the AI instance
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
