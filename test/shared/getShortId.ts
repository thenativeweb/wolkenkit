import { shuffle } from 'lodash';

const characters = 'abcdefghijklmnopqrstuvwxyz',
      digits = '0123456789';

const getShortId = function (): string {
  const alphabet = `${characters}${characters.toUpperCase()}${digits}`;

  let shuffledAlphabet;

  do {
    shuffledAlphabet = shuffle(alphabet.split('')).join('');
  } while (digits.includes(shuffledAlphabet[0]));

  const shortId = shuffledAlphabet.slice(0, 8);

  return shortId;
};

export { getShortId };
