declare function defekt(
  errorDefinitions: string[]
): { new(): Error }[];

export default defekt;
