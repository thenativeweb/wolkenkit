declare const Value: new(schema: {}) => {
  validate(object: {}, options?: {
    valueName?: string;
    separator?: string;
  }): void;

  isValid(object: {}): boolean;
};

export default Value;
