import { AskInfrastructure } from '../common/elements/AskInfrastructure';
import { TellInfrastructure } from '../common/elements/TellInfrastructure';
import { View } from '../common/elements/View';
export declare type ViewEnhancer = (view: View<AskInfrastructure & TellInfrastructure>) => View<AskInfrastructure & TellInfrastructure>;
