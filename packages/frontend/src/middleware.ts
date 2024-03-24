import { defineMiddleware } from "astro:middleware";
import { AUTH_TOKEN_TOKEN } from '../../core/src/tokens';
import { Api } from "sst/node/api";

export const onRequest = defineMiddleware(async ({ locals, cookies }, next) => {
  const token = cookies.get(AUTH_TOKEN_TOKEN)?.value;

  const session = await fetch(Api.authApi.url + '/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(res => res.json().catch(() => undefined));

  locals.email = session?.properties?.email;

  return next();
});
