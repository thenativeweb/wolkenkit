/// <reference types="node" />
/// <reference types="mocha" />
declare const startProcess: ({ runtime, name, enableDebugMode, portOrSocket, env, onExit }: {
    runtime: string;
    name: string;
    enableDebugMode: boolean;
    portOrSocket: number | string;
    env: NodeJS.ProcessEnv;
    onExit?: ((exitCode: number, stdout: string, stderr: string) => void) | undefined;
}) => Promise<() => Promise<void>>;
export { startProcess };
