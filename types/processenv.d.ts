declare function processenv<T>(): { [key: string]: any };
declare function processenv<T>(name: string, defaultValue?: T): T;

export default processenv;
