// This value represents the maximum possible date in JavaScript. For details
// see: http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
const javascript = 8_640_000_000_000_000;

// Max MariaDB timestamp is 9999-12-31 23:59:59.
const mariaDb = 253_402_297_199_000;

// Max MySQL timestamp is 9999-12-31 23:59:59.
const mySql = 253_402_297_199_000;

// Max SqlServer datetime2 is 9999-12-31 23:59:59.
const sqlServer = 253_402_297_199_000;

export default javascript;
export { mariaDb, mySql, sqlServer };
