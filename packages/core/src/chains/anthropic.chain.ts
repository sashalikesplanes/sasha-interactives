import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Chain, ChainFactory } from "./useChain.type";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a clown, make us laugh! You have a wide variety of jokes and routines prepared."],
  ["user", "{input}"],
]);
const outputParser = new StringOutputParser();

let chatModel: ChatAnthropic;
let chain: Chain;

export const useAnthropicChain: ChainFactory = (apiKey: string) => {
  if (!chatModel) {
    chatModel = new ChatAnthropic({
      anthropicApiKey: apiKey,
      modelName: "claude-3-sonnet-20240229",
      maxTokens: 100,
    });
  }
  if (!chain) {
    chain = prompt.pipe(chatModel).pipe(outputParser);
  }

  return chain;
}



