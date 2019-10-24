export interface User {
  id: string;

  claims: {
    sub: string;
  };
}
