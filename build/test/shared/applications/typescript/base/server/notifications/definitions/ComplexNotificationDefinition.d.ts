import { NotificationDefinition } from 'wolkenkit';
export interface ComplexNotificationDefinition extends NotificationDefinition {
    data: {
        message: string;
    };
    metadata: {
        public: boolean;
    };
}
