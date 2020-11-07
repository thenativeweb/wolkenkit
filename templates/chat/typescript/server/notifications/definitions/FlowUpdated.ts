import { NotificationDefinition } from 'wolkenkit';

export interface FlowUpdated extends NotificationDefinition {
  data: object;
  metadata: object;
}
