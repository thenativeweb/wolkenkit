import { Dictionary } from '../src/types/Dictionary';

declare function nodeenv(envVars: Dictionary<any>): () => void;
declare function nodeenv(envVarName: string, envVarValue: any): () => void;
declare function nodeenv(nodeEnv: any): () => void;

export default nodeenv;
