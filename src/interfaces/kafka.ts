import { IHeaders } from "kafkajs";
export interface KafkaMessageMetadata {
  topic: string;
  partition: number;
  offset: string;
  headers?: IHeaders | Record<string, string> | undefined;
  timestamp?: string;
}

export type KafkaMessageCallback<T = any> = (
  message: T,
  metadata: KafkaMessageMetadata
) => Promise<void> | void;
