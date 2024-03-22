import { StackContext, Api, Bucket, Config, AstroSite, WebSocketApi, Auth } from "sst/constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export function Functions({ stack }: StackContext) {
  const OPENAI_SECRET_KEY = new Config.Secret(stack, "OPENAI_SECRET_KEY");
  const ANTHROPIC_SECRET_KEY = new Config.Secret(stack, "ANTHROPIC_SECRET_KEY");

  // "true" or "false"
  const DALLE_USE_HQ = new Config.Parameter(stack, "DALLE_USE_HQ", { value: "false" });

  const HIVEMQ_PASSWORD = new Config.Secret(stack, "HIVEMQ_PASSWORD");
  const HIVEMQ_USERNAME = new Config.Parameter(stack, "HIVEMQ_USERNAME", { value: "sasha" });
  const HIVEMQ_URL = new Config.Parameter(stack, "HIVEMQ_URL", { value: "f1f452b5379d437ca5f74369e7279ff0.s1.eu.hivemq.cloud" });

  const bucket = new Bucket(stack, "generated-images", {
    blockPublicACLs: false,
  });

  const chatWS = new WebSocketApi(stack, "ChatWS", {
    defaults: {
      function: {
        bind: [ANTHROPIC_SECRET_KEY],
        timeout: 900,
      },
    },
    routes: {
      // Here we can in the future implement auth logic
      // $connect: "packages/functions/src/chat.connect",
      $default: "packages/functions/src/chat.chatWS",
    },
  });

  const functions = new Api(stack, "functions", {
    routes: {
      "POST /generate": "packages/functions/src/lambda.generateAndDispatch",
      "POST /test": "packages/functions/src/lambda.test",
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
        bind: [OPENAI_SECRET_KEY, HIVEMQ_USERNAME, HIVEMQ_PASSWORD, HIVEMQ_URL, bucket, DALLE_USE_HQ]
      }
    }
  });

  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
    }
  });
  
  const frontend = new AstroSite(stack, "frontend", {
    path: "packages/frontend",
    bind: [functions, chatWS, HIVEMQ_USERNAME, HIVEMQ_PASSWORD, HIVEMQ_URL, bucket, DALLE_USE_HQ]
  });

  stack.addOutputs({
    GenerateEndpoint: functions.url,
    ChatWSEndpoint: chatWS.url,
    FrontendURL: frontend.url,
  });

  return {
    bucket
  }
}
