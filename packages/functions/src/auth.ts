import { AuthHandler, GoogleAdapter, LinkAdapter, Session, SessionTypes } from "sst/node/auth";
import { Config } from "sst/node/config";
import { AstroSite } from "sst/node/site";

declare module "sst/node/auth" {
  export interface SessionTypes {
    user: {
      email: string;
    };
  }
}

const AUTHORIZED_EMAILS = ["sdkiselev1812@gmail.com"]

export const handler = AuthHandler({
  providers: {
    google: GoogleAdapter({
      mode: "oidc",
      clientID: Config.GOOGLE_OAUTH_CLIENT_ID,
      onSuccess: async (tokenset) => {

        const redirect = `${process.env.IS_LOCAL ? "http://localhost:4321" : AstroSite.frontend.url}/auth`;

        const claims = tokenset.claims();
        if (!claims.email || !claims.email_verified || !AUTHORIZED_EMAILS.includes(claims.email)) {
          return {
            statusCode: 302,
            isBase64Encoded: false,
            headers: {
              Location: `${redirect}?error=unauthorized-email-address`
            }
          };
        }

        return Session.parameter({
          redirect,
          type: "user" as keyof SessionTypes,
          properties: {
            email: claims.email
          }
        })
      },
    }),
  }
})
