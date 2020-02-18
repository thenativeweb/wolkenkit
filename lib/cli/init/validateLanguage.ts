import { arrayToSentence } from '../../common/utils/arrayToSentence';
import { validLanguages } from './validLanguages';

const validLanguageIds = validLanguages.map((validLanguage): string => validLanguage.id);

const validateLanguage = function (value: string): void {
  if (!validLanguageIds.includes(value)) {
    throw new Error(`Invalid language '${value}', must be ${arrayToSentence({
      data: validLanguageIds,
      conjunction: 'or',
      itemPrefix: `'`,
      itemSuffix: `'`
    })}.`);
  }
};

export { validateLanguage };
