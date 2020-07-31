import { Schema } from '../elements/Schema';

const regex = /(?:^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$)|(?:^0{8}-0{4}-0{4}-0{4}-0{12}$)/u;

// eslint-disable-next-line @typescript-eslint/no-base-to-string
const jsonSchema: Schema = { type: 'string', pattern: regex.toString().slice(1, -2) };

export { jsonSchema, regex };
