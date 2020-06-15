const getIndexOfRightChild = function ({ index }: { index: number }): number {
  return (2 * index) + 2;
};

export { getIndexOfRightChild };
