import { StackContext, Api, Bucket, Config, AstroSite } from "sst/constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export function Functions({ stack }: StackContext) {
  const OPENAI_SECRET_KEY = new Config.Secret(stack, "OPENAI_SECRET_KEY");

  const HIVEMQ_PASSWORD = new Config.Secret(stack, "HIVEMQ_PASSWORD");
  const HIVEMQ_USERNAME = new Config.Parameter(stack, "HIVEMQ_USERNAME", { value: "sasha" });
  const HIVEMQ_URL = new Config.Parameter(stack, "HIVEMQ_URL", { value: "f1f452b5379d437ca5f74369e7279ff0.s1.eu.hivemq.cloud" });

  const frontend = new AstroSite(stack, "frontend", {
    path: "packages/frontend",
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
        runtime: 'nodejs18.x',
        architecture: "x86_64",
        nodejs: {
          esbuild: {
            external: ['sharp']
          }
        },
        layers: [
          new lambda.LayerVersion(stack, "SharpLayer", {
            code: lambda.Code.fromAsset("layers/sharp"),
            compatibleArchitectures: [lambda.Architecture.X86_64],
          }),
        ],
        timeout: 900,
        bind: [OPENAI_SECRET_KEY, HIVEMQ_USERNAME, HIVEMQ_PASSWORD, HIVEMQ_URL, bucket]
      }
    }

  });

  stack.addOutputs({
    GenerateEndpoint: api.url,
    FrontendURL: frontend.url,
  });

  return {
    bucket
  }
}
