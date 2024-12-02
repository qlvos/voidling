
import { VOIDLING_SYSTEM_PROMPT } from './prompts.js';
import { config } from './config/config.js'
import OpenAI from 'openai';

const model = "NousResearch/Hermes-3-Llama-3.1-70B";

const client = new OpenAI({
  apiKey: config.VLING_HYPERBOLIC_API_KEY,
  baseURL: 'https://api.hyperbolic.xyz/v1',
});

export async function getVoidlingEmotion(portfolioEvolution) {

  let userPrompt = 
`This is your most recent portfolio performance report, asset per asset and overall performance\n\n
${portfolioEvolution}\n\n
Analyze this report and respond according to your system content formatting guidelines
EMOTION MUST MATCH THE PERFORMANCE OF THE ASSETS AS A WHOLE
`;

  let llmQuery = [{
    role: 'system',
    content: VOIDLING_SYSTEM_PROMPT,
  },
  {
    role: 'user',
    content: userPrompt,
  }];

  const response = await client.chat.completions.create({
    messages: llmQuery,
    model: model
  });

  return response.choices && response.choices.length > 0 ? response.choices[0].message.content : null;

}

