const limitAlphanumeric = function (text: string): string {
  return text.replace(/[\W_]+/gu, '');
};

export default limitAlphanumeric;
