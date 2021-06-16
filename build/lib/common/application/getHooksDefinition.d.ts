import { AskInfrastructure } from '../elements/AskInfrastructure';
import { Hooks } from '../elements/Hooks';
import { TellInfrastructure } from '../elements/TellInfrastructure';
declare const getHooksDefinition: ({ hooksDirectory }: {
    hooksDirectory: string;
}) => Promise<Hooks<AskInfrastructure & TellInfrastructure>>;
export { getHooksDefinition };
