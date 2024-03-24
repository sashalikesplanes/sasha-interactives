import { StackContext, Api, Bucket, Config, AstroSite, WebSocketApi, Auth, NextjsSite } from "sst/constructs";

export function Functions({ stack }: StackContext) {
  const OPENAI_SECRET_KEY = new Config.Secret(stack, "OPENAI_SECRET_KEY");
  const ANTHROPIC_SECRET_KEY = new Config.Secret(stack, "ANTHROPIC_SECRET_KEY");

  const DALLE_USE_HQ = new Config.Parameter(stack, "DALLE_USE_HQ", { value: "false" } as { value: "true" | "false" });

  const HIVEMQ_PASSWORD = new Config.Secret(stack, "HIVEMQ_PASSWORD");
  const HIVEMQ_USERNAME = new Config.Parameter(stack, "HIVEMQ_USERNAME", { value: "sasha" });
  const HIVEMQ_URL = new Config.Parameter(stack, "HIVEMQ_URL", { value: "f1f452b5379d437ca5f74369e7279ff0.s1.eu.hivemq.cloud" });

  const GOOGLE_OAUTH_CLIENT_ID = new Config.Parameter(stack, "GOOGLE_OAUTH_CLIENT_ID", { value: "296590927691-m7aj1jeofboq9bpp78k6dce6odtep2vh.apps.googleusercontent.com" });

  // Blank api to which we will attach auth
  const authApi = new Api(stack, "authApi", {
   routes: {
      "GET /me": "packages/functions/src/auth.me",
    }, 
    defaults: {
      function: {
        bind: [GOOGLE_OAUTH_CLIENT_ID]
      }
    }
  });
  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
    },
  });

  auth.attach(stack, {
    api: authApi,
    prefix: "/auth"
  })

  const chatWS = new WebSocketApi(stack, "ChatWS", {
    defaults: {
      function: {
        bind: [ANTHROPIC_SECRET_KEY, auth],
        timeout: 900,
      },
    },
    routes: {
      // Connect handles auth
      $connect: "packages/functions/src/chat.connect",
      $default: "packages/functions/src/chat.chatWS",
    },
  });


  const bucket = new Bucket(stack, "generated-images", {
    blockPublicACLs: false,
  });
  const functions = new Api(stack, "functions", {
    routes: {
      "POST /generate": "packages/functions/src/lambda.generateAndDispatch",
      "POST /test": "packages/functions/src/lambda.test",
      "GET /cookies": "packages/functions/src/lambda.cookies",
    },
    defaults: {
      function: {
        // runtime: 'nodejs18.x',
        // architecture: "x86_64",
        // nodejs: {
        //   esbuild: {
        //     external: ['sharp']
        //   }
        // },
        // layers: [
        //   // @ts-ignore
        //   new lambda.LayerVersion(stack, "SharpLayer", {
        //     code: lambda.Code.fromAsset("layers/sharp"),
        //     compatibleArchitectures: [lambda.Architecture.X86_64],
        //   }),
        // ],
        timeout: 900,
        bind: [OPENAI_SECRET_KEY, HIVEMQ_USERNAME, HIVEMQ_PASSWORD, HIVEMQ_URL, bucket, DALLE_USE_HQ]
      }
    },
  });

  const frontend = new AstroSite(stack, "frontend", {
    path: "packages/frontend",
    bind: [chatWS, HIVEMQ_USERNAME, HIVEMQ_PASSWORD, HIVEMQ_URL, bucket, DALLE_USE_HQ, authApi]
  });

  authApi.bind([frontend]);

  stack.addOutputs({
    FunctionsURL: functions.url,
    ChatWSURL: chatWS.url,
    AuthURL: authApi.url,
    FrontendURL: frontend.url,
  });

  return {
    bucket
  }
}
