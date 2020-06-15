const getIndexOfLeftChild = function ({ index }: { index: number }): number {
  return (2 * index) + 1;
};

export { getIndexOfLeftChild };
