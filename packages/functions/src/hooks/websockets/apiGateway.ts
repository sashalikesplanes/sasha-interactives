import { ApiGatewayManagementApi } from "aws-sdk";
import { useRequestContext } from "sst/node/websocket-api";

let apiG: ApiGatewayManagementApi;
export const useApiGateway = () => {
  const { stage, domainName } = useRequestContext();
  if (!apiG) {
    apiG = new ApiGatewayManagementApi({
      endpoint: `${domainName}/${stage}`,
    });
  }

  return apiG;
}
