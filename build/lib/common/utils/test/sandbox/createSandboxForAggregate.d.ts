import { SandboxConfigurationForAggregate } from './SandboxConfiguration';
import { SandboxForAggregate } from './SandboxForAggregate';
declare const createSandboxForAggregate: <TState extends object>(sandboxConfiguration: SandboxConfigurationForAggregate) => SandboxForAggregate<TState>;
export { createSandboxForAggregate };
