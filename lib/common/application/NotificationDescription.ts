import { GraphqlIncompatibleSchema } from '../elements/Schema';

export interface NotificationDescription {
  documentation?: string;

  dataSchema?: GraphqlIncompatibleSchema;

  metadataSchema?: GraphqlIncompatibleSchema;
}
