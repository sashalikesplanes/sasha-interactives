import { ChainStream } from "@sasha-interactives/core/chains/useChain.type";
import { useApiGateway } from "./apiGateway";
import { STREAM_END_TOKEN } from "@sasha-interactives/core/tokens";

/**
 * Returns a stream to the client, the stream is compatible with the DeepChat UI component
 * it will send the stream end token when the stream ends
  */
export const useDeepChatReturnStream = async (stream: ChainStream, { connectionId }: { connectionId: string }) => {
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
