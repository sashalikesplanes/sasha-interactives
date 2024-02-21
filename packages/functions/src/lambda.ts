import { ApiHandler } from "sst/node/api";
import OpenAI from "openai";
import { Config } from "sst/node/config";

const openai = new OpenAI({
  apiKey: Config.OPENAI_SECRET_KEY
});

export const handler = ApiHandler(async (_evt) => {
  const res = await openai.images.generate({
    n: 1,
    size: "1024x1024",
    prompt: "An abstract representation of your interpretation of the feeling of 'shit'. Design it so that it would look good scaled down to a 64x64 pixel display.",
    model: "dall-e-3",
    style: "vivid",
    quality: "standard",
    response_format: "url",
  });

  console.log(res.data.map((e) => e.url));

  console.log("Hello from the API handler");
  return {
    statusCode: 200,
    body: `Hello sasha!!!. The time is ${new Date().toISOString()}`,
  };
});
