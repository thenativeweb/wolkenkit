const parseGetReplayForAggregateQueryParameters = function ({ parameters }: {
  parameters: any;
}): {
    fromRevision: number | undefined;
    toRevision: number | undefined;
    observe: boolean;
  } {
  if (parameters.fromRevision !== undefined && isNaN(Number(parameters.fromRevision))) {
    throw new Error(`Query parameter 'fromRevision' must be a number.`);
  }
  if (parameters.toRevision !== undefined && isNaN(Number(parameters.toRevision))) {
    throw new Error(`Query parameter 'toRevision' must be a number.`);
  }

  const fromRevisionParsed = Number(parameters.fromRevision);
  const toRevisionParsed = Number(parameters.toRevision);

  const fromRevision = isNaN(fromRevisionParsed) ? undefined : fromRevisionParsed;
  const toRevision = isNaN(toRevisionParsed) ? undefined : toRevisionParsed;

  if (fromRevision !== undefined && fromRevision < 1) {
    throw new Error(`Query parameter 'fromRevision' must be at least 1.`);
  }
  if (toRevision !== undefined && toRevision < 1) {
    throw new Error(`Query parameter 'toRevision' must be at least 1.`);
  }
  if (fromRevision !== undefined && toRevision !== undefined && toRevision < fromRevision) {
    throw new Error(`Query parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
  }

  if (parameters.observe !== undefined && ![ 'true', 'false' ].includes(parameters.observe)) {
    throw new Error(`Query parameter 'observe' must be either 'true' or 'false'.`);
  }

  const observe = parameters.observe === 'true';

  return { fromRevision, toRevision, observe };
};

export {
  parseGetReplayForAggregateQueryParameters
};
