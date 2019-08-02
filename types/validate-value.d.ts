import { JSONSchema4 } from 'json-schema';

declare const Value: new(schema: JSONSchema4) => {
  validate(value: any, options?: {
    valueName?: string;
    separator?: string;
  }): void;

  isValid(value: any): boolean;
};

export default Value;
