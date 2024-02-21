import { StackContext, Api, EventBus, Bucket, Config } from "sst/constructs";

export function Functions({ stack }: StackContext) {
  const OPENAI_SECRET_KEY = new Config.Secret(stack, "OPENAI_SECRET_KEY");

  const bucket = new Bucket(stack, "generated-images");

  const api = new Api(stack, "functions", {
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
    },
    defaults: {
      function: {
        bind: [OPENAI_SECRET_KEY]
      }
    }

  });

  stack.addOutputs({
    GenerateEndpoint: api.url,
  });

  return {
    bucket
  }
}
