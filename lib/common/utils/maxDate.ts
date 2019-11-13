// The maximum possible date in JavaScript. For details see
// http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
const javascript = 8_640_000_000_000_000;

// The maximum possible date in MariaDB is 9999-12-31 23:59:59.
const mariaDb = 253_402_297_199_000;

// The maximum possible date in MySQL is 9999-12-31 23:59:59.
const mySql = 253_402_297_199_000;

// The maximum possible date in Sql Server is 9999-12-31 23:59:59, using a
// datetime2 column.
const sqlServer = 253_402_297_199_000;

export { javascript, mariaDb, mySql, sqlServer };
