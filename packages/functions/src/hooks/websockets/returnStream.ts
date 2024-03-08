import { ChainStream } from "@sasha-interactives/core/chains/useChain.type";
import { useApiGateway } from "./apiGateway";
import { STREAM_END_TOKEN } from "@sasha-interactives/core/tokens";

export const useReturnStream = async (stream: ChainStream, connectionId: string) => {
  const apiG = useApiGateway();
  let nextChunk = await stream.next()
  let content = '';
  while (!nextChunk.done) {
    content += nextChunk.value;
    await apiG.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify({ text: nextChunk.value, overwrite: false }) }).promise();
    nextChunk = await stream.next()
  }
  return { statusCode: 200, body: JSON.stringify({ text: STREAM_END_TOKEN, overwrite: false, }) };
}
