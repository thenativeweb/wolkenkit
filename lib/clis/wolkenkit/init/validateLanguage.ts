import { arrayToSentence } from '../../../common/utils/arrayToSentence';
import { languages } from './languages';

const languageIds = languages.map((language): string => language.id);

const validateLanguage = function (value: string): void {
  if (!languageIds.includes(value)) {
    throw new Error(`Invalid language '${value}', must be ${arrayToSentence({
      data: languageIds,
      conjunction: 'or',
      itemPrefix: `'`,
      itemSuffix: `'`
    })}.`);
  }
};

export { validateLanguage };
