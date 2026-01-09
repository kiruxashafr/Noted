import { RedisConnectionConfig } from "./redis-conection-config.interface";

export interface CustomQueueOptions {
  connection: RedisConnectionConfig;
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
  };
}
