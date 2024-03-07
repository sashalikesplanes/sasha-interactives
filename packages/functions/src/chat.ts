import { APIGatewayProxyEventV2, APIGatewayProxyHandler, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ApiGatewayV1Api, ApiHandler } from "sst/node/api";
import { ChatAnthropic } from "@langchain/anthropic";
import { Config } from "sst/node/config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { streamifyResponse, ResponseStream } from 'lambda-stream'
import { ApiGatewayManagementApi } from "aws-sdk";
import { STREAM_END_TOKEN } from "@sasha-interactives/core/tokens";


const chatModel = new ChatAnthropic({
  anthropicApiKey: Config.ANTHROPIC_SECRET_KEY,
  modelName: "claude-3-sonnet-20240229",
  maxTokens: 1000,
});
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a clown, make us laugh! You have a wide variety of jokes and routines prepared."],
  ["user", "{input}"],
]);
const outputParser = new StringOutputParser();
const chain = prompt.pipe(chatModel).pipe(outputParser);

async function chatStreamHandler(
  event: APIGatewayProxyEventV2,
  res: ResponseStream
): Promise<void> {
  const metadata = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      // "Content-Type": "application/json",
    }
  };

  // Use global helper to pass metadata and status code
  console.log(process.env.IS_LOCAL)
  if (!process.env.IS_LOCAL) {
    // @ts-ignore
    console.log("setting up response")
    res = awslambda.HttpResponseStream.from(res, metadata);
  }
  console.log("chatStreamHandler", event.body);
  res.write(`data: ${JSON.stringify({ text: "Message." })}\n\n`);
  await new Promise(resolve => setTimeout(resolve, 1000))
  res.write(`data: ${JSON.stringify({ text: "Another message." })}\n\n`);
  res.end()
}

export const chatStream = streamifyResponse(chatStreamHandler)

export const chat = ApiHandler(async (_evt) => {

  const req = _evt.body ? JSON.parse(_evt.body) : {};


  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Message from the server" })
  };
});

const users = {};
let apiG: ApiGatewayManagementApi | null = null;

export const chatWS: APIGatewayProxyHandler = async (event) => {
  const { stage, domainName } = event.requestContext;
  if (!apiG) {
    apiG = new ApiGatewayManagementApi({
      endpoint: `${domainName}/${stage}`,
    });
  }
  const connectionId = event.requestContext.connectionId;

  if (!connectionId) {
    return { statusCode: 400, body: "Invalid connectionId" };
  }


  const body = event.body ? JSON.parse(event.body) : {};
  console.log("chatWS", event);

  const prompt = body.messages[0].text;
  if (typeof prompt !== "string") return { statusCode: 200, body: JSON.stringify({ text: "You sent an empty message" }) };

  const res = await chain.stream({ input: prompt })
  let nextChunk = await res.next()
  let content = '';
  await apiG.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify({ text: content, overwrite: false }) }).promise();
  while (!nextChunk.done) {
    console.log("nextChunk", nextChunk.value)
    content += nextChunk.value;
    await apiG.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify({ text: content, overwrite: true }) }).promise();
    nextChunk = await res.next()
  }
  return { statusCode: 200, body: JSON.stringify({ text: content, overwrite: true }) };
};
