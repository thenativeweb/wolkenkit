import { CommandData } from '../../elements/CommandData';
import { CommandService } from '../CommandService';
import { CommandWithMetadata } from '../../elements/CommandWithMetadata';
import { DomainEvent } from '../../elements/DomainEvent';
import { DomainEventData } from '../../elements/DomainEventData';
export declare type GetCommandService = (parameters: {
    domainEvent: DomainEvent<DomainEventData>;
    issueCommand: (issueCommandParameters: {
        command: CommandWithMetadata<CommandData>;
    }) => void | Promise<void>;
}) => CommandService;
