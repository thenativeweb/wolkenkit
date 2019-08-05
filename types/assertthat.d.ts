declare const assert: {
  that: (actual: any) => {
    is: {
      atLeast: (expected: number) => void;
      atMost: (expected: number) => void;
      between: (expectedLower: number, expectedUpper: number) => void;
      containing: (expected: any) => void;
      containingAnyOf: (expected: any[]) => void;
      containingAllOf: (expected: any[]) => void;
      endingWith: (expected: string) => void;
      equalTo: (expected: any) => void;
      false: () => void;
      falsy: () => void;
      greaterThan: (expected: number) => void;
      instanceOf: (expected: new() => {}) => void;
      lessThan: (expected: number) => void;
      matching: (expected: RegExp) => void;
      NaN: () => void;
      null: () => void;
      ofType: (expected: string) => void;
      sameAs: (expected: any) => void;
      sameJsonAs: (expected: any) => void;
      startingWith: (expected: string) => void;
      throwing: (expected?: string | ((ex: Error) => boolean)) => void;
      throwingAsync: (expected?: string | ((ex: Error) => boolean)) => void;
      true: () => void;
      undefined: () => void;

      not: {
        atLeast: (expected: number) => void;
        atMost: (expected: number) => void;
        between: (expectedLower: number, expectedUpper: number) => void;
        containing: (expected: any) => void;
        containingAnyOf: (expected: any[]) => void;
        containingAllOf: (expected: any[]) => void;
        endingWith: (expected: string) => void;
        equalTo: (expected: any) => void;
        false: () => void;
        falsy: () => void;
        greaterThan: (expected: number) => void;
        instanceOf: (expected: new() => {}) => void;
        lessThan: (expected: number) => void;
        matching: (expected: RegExp) => void;
        NaN: () => void;
        null: () => void;
        ofType: (expected: string) => void;
        sameAs: (expected: any) => void;
        sameJsonAs: (expected: any) => void;
        startingWith: (expected: string) => void;
        throwing: (expected?: string | ((ex: Error) => boolean)) => void;
        throwingAsync: (expected?: string | ((ex: Error) => boolean)) => void;
        true: () => void;
        undefined: () => void;
      }
    };
  };
};

export default assert;
