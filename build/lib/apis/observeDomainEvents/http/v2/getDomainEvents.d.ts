import { Application } from '../../../../common/application/Application';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { Repository } from '../../../../common/domain/Repository';
import { Schema } from '../../../../common/elements/Schema';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const getDomainEvents: {
    description: string;
    path: string;
    request: {
        query: Schema;
    };
    response: {
        statusCodes: number[];
        stream: boolean;
        body: Schema;
    };
    getHandler({ domainEventEmitter, application, repository, heartbeatInterval }: {
        domainEventEmitter: SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>;
        application: Application;
        repository: Repository;
        heartbeatInterval: number;
    }): WolkenkitRequestHandler;
};
export { getDomainEvents };
