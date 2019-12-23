const parseGetReplayForAggregateQueryParameters = function ({ parameters }: {
  parameters: any;
}): {
    fromRevision: number | undefined;
    toRevision: number | undefined;
    observe: boolean;
  } {
  if (parameters.fromRevision !== undefined && isNaN(Number(parameters.fromRevision))) {
    throw new Error(`Expected query parameter 'fromRevision' to be a number.`);
  }
  if (parameters.toRevision !== undefined && isNaN(Number(parameters.toRevision))) {
    throw new Error(`Expected query parameter 'toRevision' to be a number.`);
  }

  const fromRevisionParsed = Number(parameters.fromRevision);
  const toRevisionParsed = Number(parameters.toRevision);

  const fromRevision = isNaN(fromRevisionParsed) ? undefined : fromRevisionParsed;
  const toRevision = isNaN(toRevisionParsed) ? undefined : toRevisionParsed;

  if (fromRevision !== undefined && fromRevision < 1) {
    throw new Error(`Expected query parameter 'fromRevision' to be at least 1.`);
  }
  if (toRevision !== undefined && toRevision < 1) {
    throw new Error(`Expected query parameter 'toRevision' to be at least 1.`);
  }
  if (fromRevision !== undefined && toRevision !== undefined && toRevision < fromRevision) {
    throw new Error(`Expected query parameter 'toRevision' to be greater or equal to 'fromRevision'.`);
  }

  if (parameters.observe !== undefined && ![ 'true', 'false' ].includes(parameters.observe)) {
    throw new Error(`Expected query parameter 'observe' to be either 'true' or 'false'.`);
  }

  const observe = parameters.observe === 'true';

  return { fromRevision, toRevision, observe };
};

export {
  parseGetReplayForAggregateQueryParameters
};
