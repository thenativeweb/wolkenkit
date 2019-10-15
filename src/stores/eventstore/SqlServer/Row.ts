import { TediousType } from 'tedious';

export type Row =
  { key: string; value: string; type: TediousType; options: undefined } |
  { key: string; value: number; type: TediousType; options: undefined } |
  { key: string; value: string; type: TediousType; options: { length: number }} |
  { key: string; value: boolean; type: TediousType; options: undefined };
