import { StackContext, Api, EventBus, Bucket, Config } from "sst/constructs";

export function Functions({ stack }: StackContext) {
  const OPENAI_SECRET_KEY = new Config.Secret(stack, "OPENAI_SECRET_KEY");

  const HIVEMQ_PASSWORD = new Config.Secret(stack, "HIVEMQ_PASSWORD");
  const HIVEMQ_USERNAME = new Config.Parameter(stack, "HIVEMQ_USERNAME", { value: "sasha" });
  const HIVEMQ_URL = new Config.Parameter(stack, "HIVEMQ_URL", { value: "f1f452b5379d437ca5f74369e7279ff0.s1.eu.hivemq.cloud" });

  const bucket = new Bucket(stack, "generated-images");

  const api = new Api(stack, "functions", {
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
    },
    defaults: {
      function: {
        bind: [OPENAI_SECRET_KEY, HIVEMQ_USERNAME, HIVEMQ_PASSWORD, HIVEMQ_URL, bucket]
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
