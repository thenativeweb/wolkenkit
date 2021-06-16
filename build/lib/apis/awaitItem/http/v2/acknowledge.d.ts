import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const acknowledge: {
    description: string;
    path: string;
    request: {
        body: Schema;
    };
    response: {
        statusCodes: number[];
        body: Schema;
    };
    getHandler<TItem extends object>({ priorityQueueStore }: {
        priorityQueueStore: PriorityQueueStore<TItem, ItemIdentifier>;
    }): WolkenkitRequestHandler;
};
export { acknowledge };
