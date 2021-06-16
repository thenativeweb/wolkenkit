import { ConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/ConsumerProgressStore';
declare const getTestsFor: ({ createConsumerProgressStore }: {
    createConsumerProgressStore: ({ suffix }: {
        suffix: string;
    }) => Promise<ConsumerProgressStore>;
}) => void;
export { getTestsFor };
