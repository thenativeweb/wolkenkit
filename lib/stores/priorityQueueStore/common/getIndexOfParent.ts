const getIndexOfParent = function ({ index }: { index: number }): number {
  const isLeftChild = index % 2 === 1;

  if (isLeftChild) {
    return (index - 1) / 2;
  }

  return (index - 2) / 2;
};

export { getIndexOfParent };
