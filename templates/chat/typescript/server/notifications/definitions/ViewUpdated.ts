import { NotificationDefinition } from 'wolkenkit';

export interface ViewUpdated extends NotificationDefinition {
  data: object;
  metadata: object;
}
