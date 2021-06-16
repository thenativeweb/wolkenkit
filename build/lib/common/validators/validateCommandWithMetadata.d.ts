import { Application } from '../application/Application';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
declare const validateCommandWithMetadata: <TCommandData extends object>({ command, application }: {
    command: CommandWithMetadata<TCommandData>;
    application: Application;
}) => void;
export { validateCommandWithMetadata };
