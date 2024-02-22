import { SSTConfig } from "sst";
import { Functions } from "./stacks/stack";

export default {
  config(_input) {
    return {
      name: "sasha-interactives",
      stage: "sasha3",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(Functions);
  }
} satisfies SSTConfig;
