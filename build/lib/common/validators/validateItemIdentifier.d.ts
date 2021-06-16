import { Application } from '../application/Application';
import { ItemIdentifier } from '../elements/ItemIdentifier';
declare const validateItemIdentifier: ({ itemIdentifier, application, itemType }: {
    itemIdentifier: ItemIdentifier;
    application: Application;
    itemType?: "command" | "domain-event" | undefined;
}) => void;
export { validateItemIdentifier };
