import { mapKeysDeep } from '../../../common/utils/mapKeysDeep';

/* eslint-disable quote-props */
const escapeMap: Record<string, string> = {
  '\\': '\\\\',
  '.': '\\dot',
  '$': '\\dollar'
};
/* eslint-enable quote-props */

const unescapeMap: Record<string, string> = {
  '\\\\': '\\',
  '\\dot': '.',
  '\\dollar': '$'
};

const escapeFieldNames = function (object: any): object {
  return mapKeysDeep(object, (_value, key): string =>
    key.replace(/[\\.$]/gu, (char): string => escapeMap[char]));
};

const unescapeFieldNames = function (object: any): object {
  return mapKeysDeep(object, (_value, key): string =>
    key.replace(/(?:\\\\|\\dot|\\dollar)/gu, (char): string => unescapeMap[char]));
};

export { escapeFieldNames, unescapeFieldNames };
