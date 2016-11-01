"use strict";
const translator_1 = require('./translator/mysql/translator');
function translateMySql(filename) {
    return new translator_1.default().parse(filename);
}
exports.translateMySql = translateMySql;
//# sourceMappingURL=index.js.map