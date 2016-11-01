"use strict";
const _1 = require('./');
const eyes = require('eyes');
let tables = _1.translateMySql('./sample/test.mysql');
for (let table in tables) {
    eyes.inspect(tables[table]);
}
//# sourceMappingURL=test.js.map