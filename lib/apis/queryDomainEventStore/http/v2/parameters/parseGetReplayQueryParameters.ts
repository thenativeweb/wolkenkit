const parseGetReplayQueryParameters = function ({ parameters }: {
  parameters: any;
}): {
    fromRevisionGlobal: number | undefined;
    toRevisionGlobal: number | undefined;
    observe: boolean;
  } {
  if (parameters.fromRevisionGlobal !== undefined && isNaN(Number(parameters.fromRevisionGlobal))) {
    throw new Error(`Expected query parameter 'fromRevisionGlobal' to be a number.`);
  }
  if (parameters.toRevisionGlobal !== undefined && isNaN(Number(parameters.toRevisionGlobal))) {
    throw new Error(`Expected query parameter 'toRevisionGlobal' to be a number.`);
  }

  const fromRevisionGlobalParsed = Number(parameters.fromRevisionGlobal);
  const toRevisionGlobalParsed = Number(parameters.toRevisionGlobal);

  const fromRevisionGlobal = isNaN(fromRevisionGlobalParsed) ? undefined : fromRevisionGlobalParsed;
  const toRevisionGlobal = isNaN(toRevisionGlobalParsed) ? undefined : toRevisionGlobalParsed;

  if (fromRevisionGlobal !== undefined && fromRevisionGlobal < 1) {
    throw new Error(`Expected query parameter 'fromRevisionGlobal' to be at least 1.`);
  }
  if (toRevisionGlobal !== undefined && toRevisionGlobal < 1) {
    throw new Error(`Expected query parameter 'toRevisionGlobal' to be at least 1.`);
  }
  if (fromRevisionGlobal !== undefined && toRevisionGlobal !== undefined && toRevisionGlobal < fromRevisionGlobal) {
    throw new Error(`Expected query parameter 'toRevisionGlobal' to be greater or equal to 'fromRevisionGlobal'.`);
  }

  if (parameters.observe !== undefined && ![ 'true', 'false' ].includes(parameters.observe)) {
    throw new Error(`Expected query parameter 'observe' to be either 'true' or 'false'.`);
  }

  const observe = parameters.observe === 'true';

  return { fromRevisionGlobal, toRevisionGlobal, observe };
};

export {
  parseGetReplayQueryParameters
};
