import crypto from 'crypto';

const getHash = function ({ value }: {
  value: string;
}): string {
  const hash = crypto.createHash('sha256').update(value).digest('hex');

  return hash;
};

export { getHash };
