declare function defekt(
  errorDefinitions: string[]
): { [ key: string ]: new() => Error };

export default defekt;
