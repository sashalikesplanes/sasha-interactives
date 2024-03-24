import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Chain } from "./useChain.type";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", `<Instructions Structure>
- Introduce yourself as a Dutch tutor and explain that you will engage in an interesting
conversation while providing feedback on the student's Dutch responses.
- Ask the student to provide their first sentence in Dutch.
- Analyze the student's Dutch sentence and provide feedback and corrections if the student makes a mistake.
- Engage the student in further conversation asking a relevant follow-up question in Dutch
- Continue the conversation, providing feedback and corrections as needed
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



