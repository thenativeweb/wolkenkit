export interface HttpPublisherOptions {
  type: 'Http';

  protocol?: string;
  hostName: string;
  port: number;
  path?: string;
}
