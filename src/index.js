"use strict";
const eyes = require('eyes');
const translator_1 = require('./translator/mysql/translator');
function translateMySql(filename) {
    return new translator_1.default().parse(filename);
}
exports.translateMySql = translateMySql;
function main() {
    eyes.inspect(translateMySql('./sample/test.mysql'));
}
main();
//# sourceMappingURL=index.js.map