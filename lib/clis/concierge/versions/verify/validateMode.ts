import { arrayToSentence } from '../../../../common/utils/arrayToSentence';

const modes = [ 'error', 'warn' ];

const validateMode = function (value: string): void {
  if (!modes.includes(value)) {
    throw new Error(`Invalid mode '${value}', must be ${arrayToSentence({
      data: modes,
      conjunction: 'or',
      itemPrefix: `'`,
      itemSuffix: `'`
    })}.`);
  }
};

export { validateMode };
