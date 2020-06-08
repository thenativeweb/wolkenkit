import { createHash } from 'crypto';

const getHash = function ({ value }: {
  value: string;
}): string {
  const hash = createHash('sha256').update(value).digest('hex');

  return hash;
};

export { getHash };
