const getOpenApiPathFromExpressPath = function ({ expressPath }: {
  expressPath: string;
}): string {
  return expressPath.
    split('/').
    map((pathSegment: string): string => {
      if (!pathSegment.startsWith(':')) {
        return pathSegment;
      }

      return `{${pathSegment.slice(1)}}`;
    }).
    join('/');
};

export { getOpenApiPathFromExpressPath };
