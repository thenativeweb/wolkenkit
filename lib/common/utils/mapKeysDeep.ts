import { isPlainObject } from 'lodash';

const mapKeysDeep = function (object: any, map: (value: any, key: string) => string): any {
  if (!isPlainObject(object)) {
    return object;
  }

  const mappedObject: Record<string, any> = {};

  for (const [ key, value ] of Object.entries(object)) {
    const mappedValue = isPlainObject(value) ? mapKeysDeep(value, map) : value;
    const mappedKey = map(value, key);

    mappedObject[mappedKey] = mappedValue;
  }

  return mappedObject;
};

export { mapKeysDeep };
