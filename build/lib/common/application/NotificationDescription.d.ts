import { Schema } from '../elements/Schema';
export interface NotificationDescription {
    documentation?: string;
    dataSchema?: Schema;
    metadataSchema?: Schema;
}
