import { arrayToSentence } from '../../../common/utils/arrayToSentence';
import { templates } from './templates';

const templateIds = templates.map((template): string => template.id);

const validateTemplate = function (value: string): void {
  if (!templateIds.includes(value)) {
    throw new Error(`Invalid template '${value}', must be ${arrayToSentence({
      data: templateIds,
      conjunction: 'or',
      itemPrefix: `'`,
      itemSuffix: `'`
    })}.`);
  }
};

export { validateTemplate };
