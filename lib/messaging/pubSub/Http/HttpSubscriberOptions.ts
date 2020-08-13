export interface HttpSubscriberOptions {
  type: 'Http';

  protocol?: string;
  hostName: string;
  port: number;
  path?: string;
}
