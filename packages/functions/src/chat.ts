import { WebSocketApiHandler, useConnectionId } from "sst/node/websocket-api";
import { useAnthropicChain } from "@sasha-interactives/core/chains/anthropic.chain";
import { Config } from "sst/node/config";
import { useBody, useJsonBody } from "sst/node/api";
import { useDeepChatReturnStream } from "./hooks/websockets/returnStream";
import { useSession } from "sst/node/auth";

export const connect = WebSocketApiHandler(async (_event) => {
  const session = useSession();
  if (session.type === "public") return { statusCode: 401 }
  return { statusCode: 200 }
})

export const chatWS = WebSocketApiHandler(async (_event) => {
  const connectionId = useConnectionId();
  const body = useJsonBody();
  console.log(body.messages)
  const prompt = body.messages[0].text;
  if (typeof prompt !== "string") return { statusCode: 200, body: JSON.stringify({ text: "You sent an empty message" }) };
  const chain = useAnthropicChain({ apiKey: Config.ANTHROPIC_SECRET_KEY });
  const stream = await chain.stream({ input: prompt })
  return await useDeepChatReturnStream(stream, { connectionId });
});
