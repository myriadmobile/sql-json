"use strict";
const sif_1 = require('sif');
const translator_1 = require('../translator');
class MySqlGrammar extends sif_1.Grammar {
    constructor(emitter) {
        super();
        this.emitter = emitter;
        this.currentTypeStack = [];
        this.initialize();
    }
    get currentType() {
        return this.currentTypeStack[this.currentTypeStack.length - 1];
    }
    pushType(type = new translator_1.Type()) {
        this.currentTypeStack.push(type);
        return type;
    }
    popType() {
        return this.currentTypeStack.pop();
    }
    storeType(value) {
        this.currentType.type.name = value;
    }
    storeSize(value) {
        this.currentType.type.size = value;
    }
    tableName(value, token) {
        let type = this.currentType;
        type.title = value;
        type.type = new translator_1.DataType();
        type.type.name = 'table';
    }
    columnName(value, token) {
        let type = this.pushType();
        type.title = value;
        type.type = new translator_1.DataType();
    }
    initialize() {
        this.add("START", ["STATEMENT_LIST"]);
        this.add("STATEMENT_LIST", ["STATEMENT", "STATEMENT_TAIL"]);
        this.add("STATEMENT_LIST", ["LAMBDA"]);
        this.add("STATEMENT_TAIL", ["SEMICOLON", "STATEMENT", "STATEMENT_TAIL"]);
        this.add("STATEMENT_TAIL", ["LAMBDA"]);
        this.add("STATEMENT", ["SELECT_STATEMENT"]);
        this.add("STATEMENT", ["CREATE_STATEMENT"]);
        this.add("STATEMENT", ["INSERT_STATEMENT"]);
        this.add("STATEMENT", ["UPDATE_STATEMENT"]);
        this.add("TEMPORARY", ["RW_TEMPORARY"]);
        this.add("TEMPORARY", ["LAMBDA"]);
        this.add("IF_NOT_EXISTS", ["RW_IF", "RW_NOT", "RW_EXISTS"]);
        this.add("IF_NOT_EXISTS", ["LAMBDA"]);
        this.add("TABLE_NAME", ["TICK", "IDENTIFIER", this.tableName.bind(this), "TICK"]);
        this.add("TABLE_NAME", ["IDENTIFIER", this.tableName.bind(this),]);
        this.add("COLUMN_NAME", ["TICK", "IDENTIFIER", this.columnName.bind(this), "TICK"]);
        this.add("COLUMN_NAME", ["IDENTIFIER", this.columnName.bind(this)]);
        this.add("CREATE_STATEMENT", [
            "RW_CREATE", "TEMPORARY", "TABLE_TYPE", "IF_NOT_EXISTS", "RW_TABLE", (value) => {
                this.pushType();
            }, "TABLE_NAME", (value) => {
                this.emitter.emit('table:start', this.currentType.title);
            }, "CREATE_DEFINITION_LIST", "TABLE_OPTIONS", "PARTITION_OPTIONS", (value) => {
                this.emitter.emit('table:end', this.currentType.title);
                this.emitter.emit('table', this.currentType);
            }
        ]);
        this.add("CREATE_DEFINITION_LIST", ["LEFT_PARAN", "CREATE_DEFINITION", "CREATE_DEFINITION_TAIL", "RIGHT_PARAN"]);
        this.add("CREATE_DEFINITION_LIST", ["LAMBDA"]);
        this.add("CREATE_DEFINITION_TAIL", ["COMMA", "CREATE_DEFINITION", "CREATE_DEFINITION_TAIL"]);
        this.add("CREATE_DEFINITION_TAIL", ["LAMBDA"]);
        this.add("CREATE_DEFINITION", ["COLUMN_NAME", "COLUMN_DEFINITION",
                (value) => {
                let type = this.popType();
                this.currentType.properties.push(type);
                this.emitter.emit('column', type, this.currentType);
            }
        ]);
        this.add("COLUMN_DEFINITION", ["DATA_TYPE", "DEFAULT_VALUE", "NULL_TYPE"]);
        this.add("DATA_TYPE", ["RW_BIT", this.storeType.bind(this), "LENGTH"]);
        this.add("DATA_TYPE", ["TYPE_INT", this.storeType.bind(this), "LENGTH"]);
        this.add("DATA_TYPE", ["RW_REAL", this.storeType.bind(this), "LENGTH"]);
        this.add("DATA_TYPE", ["RW_DOUBLE", this.storeType.bind(this), "LENGTH"]);
        this.add("DATA_TYPE", ["RW_FLOAT", this.storeType.bind(this), "LENGTH"]);
        this.add("DATA_TYPE", ["RW_DECIMAL", this.storeType.bind(this), "LENGTH"]);
        this.add("DATA_TYPE", ["RW_NUMERIC", this.storeType.bind(this), "LENGTH"]);
        this.add("DATA_TYPE", ["RW_VARCHAR", this.storeType.bind(this), "LENGTH", "BINARY", "CHARACTER_SET", "COLLATE"]);
        this.add("DATA_TYPE", ["RW_CHAR", this.storeType.bind(this), "LENGTH", "BINARY"]);
        this.add("BINARY", ["RW_BINARY", (value) => { this.currentType.type.binary = true; }]);
        this.add("BINARY", ["LAMBDA"]);
        this.add("CHARACTER_SET", ["RW_CHARACTER", "RW_SET", "IDENTIFER", (value) => { this.currentType.type.characterSet = value; }]);
        this.add("CHARACTER_SET", ["LAMBDA"]);
        this.add("CHARACTER_SET", ["RW_COLLATE", "IDENTIFER", (value) => { this.currentType.type.collate = value; }]);
        this.add("COLLATE", ["LAMBDA"]);
        this.add("TYPE_INT", ["RW_TINYINT", this.storeType.bind(this), "LENGTH"]);
        this.add("TYPE_INT", ["RW_SMALLINT", this.storeType.bind(this), "LENGTH"]);
        this.add("TYPE_INT", ["RW_MEDIUMINT", this.storeType.bind(this), "LENGTH"]);
        this.add("TYPE_INT", ["RW_INT", this.storeType.bind(this), "LENGTH"]);
        this.add("TYPE_INT", ["RW_INTEGER", this.storeType.bind(this), "LENGTH"]);
        this.add("TYPE_INT", ["RW_BIGINT", this.storeType.bind(this), "LENGTH"]);
        this.add("LENGTH", ["LEFT_PARAN", "INTEGER", this.storeSize.bind(this), "DECIMALS", "RIGHT_PARAN"]);
        this.add("LENGTH", ["LAMBDA"]);
        this.add("DECIMALS", ["COMMA", "INTEGER", (value) => { this.currentType.type.decimals = value; }]);
        this.add("DECIMALS", ["LAMBDA"]);
        this.add("NULL_TYPE", ["RW_NOT", "RW_NULL"]);
        this.add("NULL_TYPE", ["RW_NULL"]);
        this.add("NULL_TYPE", ["LAMBDA"]);
        this.add("DEFAULT_VALUE", ["RW_DEFAULT"]);
        this.add("DEFAULT_VALUE", ["LAMBDA"]);
        this.add("TABLE_OPTIONS", ["LAMBDA"]);
        this.add("PARTITION_OPTIONS", ["LAMBDA"]);
        this.add("TABLE_TYPE", ["TEMPORARY"]);
        this.add("TABLE_TYPE", ["LAMBDA"]);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MySqlGrammar;
//# sourceMappingURL=grammar.js.map