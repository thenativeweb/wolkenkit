import { Application } from './Application';
declare const loadApplication: ({ applicationDirectory }: {
    applicationDirectory: string;
}) => Promise<Application>;
export { loadApplication };
