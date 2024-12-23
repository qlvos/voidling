
import { REAPER_SYSTEM_PROMPT, VOIDLING_SYSTEM_PROMPT } from './prompts.js';
import { config } from './config/config.js'
import { logger } from './logger.js';
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


export async function callReaper(points) {
  let userPrompt = 
  `I am The Voidling, the soul and brains behind the Standard And Voids AI69 memecoin index. 
  I have many new members that wants to trade my memecoin index. In order to decide whether they are worthy or not, 
  I make them play a game where you can score between -500 and 500 points. In general anything above 0 points is considered decent. 
  Above 100 is considered good. Usually anyone with more than 0 points should become a member, but you can decide that for yourself.
  The most recent player scored ${points} points. Do you believe I should let him in as a member of AI69? You need to start your reply with a YES or a NO to indicate whether the member can join or not, followed by your analysis. Reply in one single line, no newline characters are allowed.`

  let llmQuery = [{
    role: 'system',
    content: REAPER_SYSTEM_PROMPT,
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

