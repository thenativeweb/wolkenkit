export interface Configuration {
  healthCorsOrigin: string | string[];
  healthPort: number;
  port: number;
  publishCorsOrigin: string | string[];
  pubSubOptions: {
    subscriber: object;
    publisher: object;
  };
  pubSubType: string;
  subscribeCorsOrigin: string | string[];
}
