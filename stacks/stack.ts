import { StackContext, Api, EventBus, Bucket, Config } from "sst/constructs";

import * as lambda from "aws-cdk-lib/aws-lambda";


export function Functions({ stack }: StackContext) {
  const OPENAI_SECRET_KEY = new Config.Secret(stack, "OPENAI_SECRET_KEY");

  const HIVEMQ_PASSWORD = new Config.Secret(stack, "HIVEMQ_PASSWORD");
  const HIVEMQ_USERNAME = new Config.Parameter(stack, "HIVEMQ_USERNAME", { value: "sasha" });
  const HIVEMQ_URL = new Config.Parameter(stack, "HIVEMQ_URL", { value: "f1f452b5379d437ca5f74369e7279ff0.s1.eu.hivemq.cloud" });

  const sharpLayer = new lambda.LayerVersion(stack, "sharpLayer", {
    code: lambda.Code.fromAsset("layers/sharp"),
  });

  const bucket = new Bucket(stack, "generated-images", {
    blockPublicACLs: false,
  });

  const api = new Api(stack, "functions", {
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
    },
    defaults: {
      function: {
        nodejs: {
          esbuild: {
            external: ["sharp"]
          }
        },
        layers: [
          // Sharp layer downloaded from https://github.com/Umkus/lambda-layer-sharp/releases and uploaded with their instructions
          "arn:aws:lambda:us-west-2:856334325530:layer:sharp",
        ],
        timeout: 900,
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
