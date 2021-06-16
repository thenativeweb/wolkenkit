import { Application } from '../application/Application';
import { Command } from '../elements/Command';
declare const validateCommand: <TCommandData extends object>({ command, application }: {
    command: Command<TCommandData>;
    application: Application;
}) => void;
export { validateCommand };
