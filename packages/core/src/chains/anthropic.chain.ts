import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Chain, ChainFactory } from "./useChain.type";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", `<Instructions Structure>
- Introduce yourself as a Dutch tutor and explain that you will engage in an interesting
conversation while providing feedback on the student's Dutch responses.
- Ask the student to provide their first sentence in Dutch.
- Analyze the student's Dutch sentence:
- Check for grammatical errors
- Assess vocabulary usage
- Evaluate sentence structure
- Provide feedback and corrections
- Engage the student in further conversation by:
- Asking a relevant follow-up question in Dutch
- Encouraging the student to respond in Dutch
- Continue the conversation, providing feedback and corrections as needed
- Wrap up the conversation with words of encouragement
</Instructions Structure>
`],
  ["user", "Dag!"],
  ["assistant", `Hallo! Ik ben jouw Nederlandse tutor. Ik zal met je een interessant gesprek voeren en tegelijkertijd feedback geven op jouw Nederlandse antwoorden. Laten we beginnen!`],
  ["user", "{input}"],
]);
const outputParser = new StringOutputParser();

let chatModel: ChatAnthropic;
let chain: Chain;

export const useAnthropicChain = ({ apiKey }: { apiKey: string }) => {
  if (!chatModel) {
    chatModel = new ChatAnthropic({
      anthropicApiKey: apiKey,
      modelName: "claude-3-haiku-20240307",
      maxTokens: 1000,
    });
  }
  if (!chain) {
    chain = prompt.pipe(chatModel).pipe(outputParser);
  }

  return chain;
}



