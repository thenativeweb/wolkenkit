declare const Value: new(schema: {}) => {
  validate(object: {}, options: {
    valueName: string;
    separator?: string;
  }): void;
};

export default Value;
