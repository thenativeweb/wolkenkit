declare module 'defekt' {
  export default function defekt(
    errorDefinitions: string[]
  ): { new (): Error }[];
}

declare module 'flaschenpost' {
  const flaschenpost: {
    getLogger(): any;
  };
  export default flaschenpost;
}

declare module 'processenv' {
  export default function processenv<T>(name: string, defaultValue: T): T;
}

declare module 'uuidv4' {
  const uuidv4: {(): string; empty (): string};
  export default uuidv4;
}
