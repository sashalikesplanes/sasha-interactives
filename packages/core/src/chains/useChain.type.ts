import { Runnable } from "@langchain/core/dist/runnables";

export type Chain = Runnable<{ input: string }, string>;
export type ChainFactory = (input: string) => Chain;
