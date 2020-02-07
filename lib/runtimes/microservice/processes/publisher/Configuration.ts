export interface Configuration {
  healthCorsOrigin: string | string[];
  port: number;
  healthPort: number;
  publishCorsOrigin: string | string[];
  subscribeCorsOrigin: string | string[];
  pubSubType: string;
  pubSubOptions: {
    channel: string;
    subscriber: object;
    publisher: object;
  };
}
