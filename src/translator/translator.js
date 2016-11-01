"use strict";
class Type {
    constructor() {
        this.type = new DataType();
        this.properties = [];
    }
}
exports.Type = Type;
class DataType {
    constructor() {
        this.values = [];
        this.binary = false;
    }
}
exports.DataType = DataType;
//# sourceMappingURL=translator.js.map