import { Runnable } from "@langchain/core/dist/runnables";
import { IterableReadableStream } from "@langchain/core/dist/utils/stream";

export type ChainStream = IterableReadableStream<string>
export type Chain = Runnable<{ input: string }, string>;
export type ChainFactory = (input: string) => Chain;
