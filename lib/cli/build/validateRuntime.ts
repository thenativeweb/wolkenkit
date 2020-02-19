import { arrayToSentence } from '../../common/utils/arrayToSentence';
import { runtimes } from './runtimes';

const runtimeIds = runtimes.map((runtime): string => runtime.id);

const validateRuntime = function (value: string): void {
  if (!runtimeIds.includes(value)) {
    throw new Error(`Invalid runtime '${value}', must be ${arrayToSentence({
      data: runtimeIds,
      conjunction: 'or',
      itemPrefix: `'`,
      itemSuffix: `'`
    })}.`);
  }
};

export { validateRuntime };
