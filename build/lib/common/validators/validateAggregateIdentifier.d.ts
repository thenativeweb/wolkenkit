import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { Application } from '../application/Application';
declare const validateAggregateIdentifier: ({ aggregateIdentifier, application }: {
    aggregateIdentifier: AggregateIdentifier;
    application: Application;
}) => void;
export { validateAggregateIdentifier };
