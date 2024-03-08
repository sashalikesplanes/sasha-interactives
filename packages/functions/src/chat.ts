import { ApiGatewayManagementApi } from "aws-sdk";
import { STREAM_END_TOKEN } from "@sasha-interactives/core/tokens";
import { WebSocketApiHandler } from "sst/node/websocket-api";
import { useAnthropicChain } from "@sasha-interactives/core/chains/anthropic.chain";
import { Config } from "sst/node/config";

let apiG: ApiGatewayManagementApi | null = null;

export const chatWS = WebSocketApiHandler(async (event) => {
  const { stage, domainName } = event.requestContext;
  if (!apiG) {
    apiG = new ApiGatewayManagementApi({
      endpoint: `${domainName}/${stage}`,
    });
  }
  const connectionId = event.requestContext.connectionId as string;

  if (!connectionId) {
    console.error("Invalid connectionId", event);
    return { statusCode: 400, body: "Invalid connectionId" };
  }


  const body = event.body ? JSON.parse(event.body) : {};

  const prompt = body.messages[0].text;
  if (typeof prompt !== "string") return { statusCode: 200, body: JSON.stringify({ text: "You sent an empty message" }) };

  const chain = useAnthropicChain(Config.ANTHROPIC_SECRET_KEY);

  const res = await chain.stream({ input: prompt })
  let nextChunk = await res.next()
  let content = '';
  while (!nextChunk.done) {
    content += nextChunk.value;
    await apiG.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify({ text: nextChunk.value, overwrite: false }) }).promise();
    nextChunk = await res.next()
  }
  return { statusCode: 200, body: JSON.stringify({ text: STREAM_END_TOKEN, overwrite: false, }) };
});
