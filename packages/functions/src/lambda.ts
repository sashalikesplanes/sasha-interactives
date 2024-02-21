import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (_evt) => {
  console.log("Hello from the API handler");
  return {
    statusCode: 200,
    body: `Hello sasha!!!. The time is ${new Date().toISOString()}`,
  };
});
