import { arrayToSentence } from '../../common/utils/arrayToSentence';
import { modes } from './modes';

const modeIds = modes.map((mode): string => mode.id);

const validateMode = function (value: string): void {
  if (!modeIds.includes(value)) {
    throw new Error(`Invalid mode '${value}', must be ${arrayToSentence({
      data: modeIds,
      conjunction: 'or',
      itemPrefix: `'`,
      itemSuffix: `'`
    })}.`);
  }
};

export { validateMode };
