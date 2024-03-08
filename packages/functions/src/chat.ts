import { WebSocketApiHandler, useConnectionId } from "sst/node/websocket-api";
import { useAnthropicChain } from "@sasha-interactives/core/chains/anthropic.chain";
import { Config } from "sst/node/config";
import { useBody } from "sst/node/api";
import { useDeepChatReturnStream } from "./hooks/websockets/returnStream";

export const chatWS = WebSocketApiHandler(async (_event) => {
  const connectionId = useConnectionId();
  const body = typeof useBody() === "string" ? JSON.parse(useBody() as string) : {};
  const prompt = body.messages[0].text;
  if (typeof prompt !== "string") return { statusCode: 200, body: JSON.stringify({ text: "You sent an empty message" }) };
  const chain = useAnthropicChain({ apiKey: Config.ANTHROPIC_SECRET_KEY });
  const stream = await chain.stream({ input: prompt })
  return await useDeepChatReturnStream(stream, { connectionId });
});
