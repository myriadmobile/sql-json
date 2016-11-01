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
    get storeType() {
        let self = this;
        return function (value) {
            self.currentType.type.name = value;
        };
    }
    get storeSize() {
        let self = this;
        return function (value) {
            self.currentType.type.size = value;
        };
    }
    get storeValue() {
        let self = this;
        return function (value) {
            self.currentType.type.values.push(value);
        };
    }
    get storeDefault() {
        let self = this;
        return function (value) {
            self.currentType.type.default = value;
        };
    }
    storeNullable(nullable) {
        let self = this;
        return function (value) {
            self.currentType.type.nullable = nullable;
        };
    }
    get tableName() {
        let self = this;
        return function (value) {
            let type = this.currentType;
            type.title = value;
            type.type = new translator_1.DataType();
            type.type.name = 'table';
        };
    }
    get createColumn() {
        let self = this;
        return function () {
            let type = self.popType();
            self.currentType.properties.push(type);
            self.emitter.emit('column', type, self.currentType);
        };
    }
    get columnName() {
        let self = this;
        return function (value) {
            let type = self.pushType();
            type.title = value;
            type.type = new translator_1.DataType();
        };
    }
    get pushValueUp() {
        let self = this;
        return function (value, token, phrase, word, isFinal, context) {
            context.parent.value = value;
        };
    }
    get pushStringValueUp() {
        let self = this;
        return function (value, token, phrase, word, isFinal, context) {
            context.parent.value = value.slice(1, -1);
        };
    }
    initialize() {
        this.add("START", ["STATEMENT_LIST"]);
        this.add("STATEMENT_LIST", ["STATEMENT", "STATEMENT_TAIL"], ["LAMBDA"]);
        this.add("STATEMENT_TAIL", ["SEMICOLON", "STATEMENT", "STATEMENT_TAIL"], ["LAMBDA"]);
        this.add("STATEMENT", ["SELECT_STATEMENT"], ["CREATE_STATEMENT"], ["INSERT_STATEMENT"], ["UPDATE_STATEMENT"]);
        this.add("TEMPORARY", ["RW_TEMPORARY"], ["LAMBDA"]);
        this.add("IF_NOT_EXISTS", ["RW_IF", "RW_NOT", "RW_EXISTS"]);
        this.add("IF_NOT_EXISTS", ["LAMBDA"]);
        this.add("TABLE_NAME", ["TICK_STRING", this.pushStringValueUp], ["IDENTIFIER", this.pushValueUp]);
        this.add("COLUMN_NAME", ["TICK_STRING", this.pushStringValueUp], ["IDENTIFIER", this.pushValueUp]);
        this.add("CREATE_STATEMENT", [
            "RW_CREATE", "TEMPORARY", "TABLE_TYPE", "IF_NOT_EXISTS", "RW_TABLE", "TABLE_NAME",
                (value) => {
                this.pushType();
                this.tableName(value);
                this.emitter.emit('table:start', this.currentType.title);
            }, "CREATE_DEFINITION_LIST", "TABLE_OPTIONS_LIST", "PARTITION_OPTIONS_LIST", (value) => {
                this.emitter.emit('table:end', this.currentType.title);
                this.emitter.emit('table', this.currentType);
            }
        ]);
        this.add("CREATE_DEFINITION_LIST", ["LEFT_PARAN", "CREATE_DEFINITION", "CREATE_DEFINITION_TAIL", "RIGHT_PARAN"], ["LAMBDA"]);
        this.add("CREATE_DEFINITION_TAIL", ["COMMA", "CREATE_DEFINITION", "CREATE_DEFINITION_TAIL"], ["LAMBDA"]);
        this.add("CREATE_DEFINITION", ["COLUMN_NAME", this.columnName, "COLUMN_DEFINITION", this.createColumn], ["INDEX_OR_KEY", "INDEX_NAME", "INDEX_TYPE", "COLUMN_LIST", "INDEX_OPTION"], ["CONSTRAINT", "CONSTRAINT_OPTIONS"]);
        this.add("INDEX_NAME", ["IDENTIFIER"], ["TICK_STRING"], ["LAMBDA"]);
        this.add("CONSTRAINT_NAME", ["IDENTIFIER"], ["TICK_STRING"], ["LAMBDA"]);
        this.add("INDEX_OR_KEY", ["RW_INDEX"], ["RW_KEY"]);
        this.add("CONSTRAINT", ["RW_CONSTRAINT", "CONSTRAINT_NAME"], ["RW_CONSTRAINT"], ["LAMBDA"]);
        this.add("CONSTRAINT_OPTIONS", ["RW_PRIMARY", "RW_KEY", "INDEX_TYPE", "COLUMN_LIST", "INDEX_OPTION"], ["RW_UNIQUE", "UNIQUE_CONSTRAINT_OPTIONS"], ["RW_FOREIGN", "RW_KEY", "INDEX_NAME", "COLUMN_LIST", "REFERENCE_DEFINITION"]);
        this.add("REFERENCE_DEFINITION", ["RW_REFERENCES", "TABLE_NAME", "COLUMN_LIST", "MATCH_TYPE", "ON_DELETE", "ON_UPDATE"]);
        this.add("MATCH_TYPE", ["RW_MATCH", "FULL"], ["RW_MATCH", "PARTIAL"], ["RW_MATCH", "SIMPLE"], ["LAMBDA"]);
        this.add("ON_DELETE", ["RW_ON", "RW_DELETE", "REFERENCE_OPTION"], ["LAMBDA"]);
        this.add("ON_UPDATE", ["RW_ON", "RW_UPDATE", "REFERENCE_OPTION"], ["LAMBDA"]);
        this.add("REFERENCE_OPTION", ["RW_RESTRICT"], ["RW_CASCADE"], ["RW_SET", "RW_NULL"], ["RW_NO", "RW_ACTION"]);
        this.add("UNIQUE_CONSTRAINT_OPTIONS", ["RW_INDEX", "LEFT_PARAN", "IDENTIFIER", "RIGHT_PARAN", "INDEX_TYPE", "COLUMN_LIST", "INDEX_OPTION"], ["RW_KEY", "INDEX_NAME", "INDEX_TYPE", "COLUMN_LIST", "INDEX_OPTION"]);
        this.add("INDEX_TYPE", ["RW_USING", "RW_BTREE"], ["RW_USING", "RW_HASH"], ["LAMBDA"]);
        this.add("COLUMN_LIST", ["LEFT_PARAN", "COLUMN_NAME", "LENGTH", "DIRECTION", "COLUMN_TAIL"]);
        this.add("COLUMN_TAIL", ["COMMA", "COLUMN_NAME", "LENGTH", "DIRECTION", "COLUMN_TAIL"], ["RIGHT_PARAN"]);
        this.add("DIRECTION", ["RW_ASC"], ["RW_DESC"], ["LAMBDA"]);
        this.add("INDEX_OPTION", ["RW_KEY_BLOCK_SIZE", "EQUALS", "INTEGER"], ["INDEX_TYPE"], ["RW_WITH", "RW_PARSER", "IDENTIFIER"], ["COMMENT"], ["LAMBDA"]);
        this.add("COMMENT", ["RW_COMMENT", "STRING"], ["LAMBDA"]);
        this.add("COLUMN_DEFINITION", ["DATA_TYPE", "NULL_TYPE", "DEFAULT_VALUE", "AUTO_INCREMENT", "UNIQUE_PRIMARY_KEY", "COMMENT", "COLUMN_FORMAT", "OPTIONAL_REFERENCE_DEFINITION"]);
        this.add("OPTIONAL_REFERENCE_DEFINITION", ["REFERENCE_DEFINITION"], ["LAMBDA"]);
        this.add("COLUMN_FORMAT", ["RW_COLUMN_FORMAT", "COLUMN_FORMAT_TYPE"], ["LAMBDA"]);
        this.add("COLUMN_FORMAT_TYPE", ["RW_FIXED"], ["RW_DYNAMIC"], ["RW_DEFAULT"], ["LAMBDA"]);
        this.add("AUTO_INCREMENT", ["RW_AUTO_INCREMENT"], ["LAMBDA"]);
        this.add("UNIQUE_PRIMARY_KEY", ["RW_UNIQUE", "RW_KEY"], ["RW_UNIQUE"], ["RW_PRIMARY", "RW_KEY"], ["RW_PRIMARY"], ["LAMBDA"]);
        this.add("DATA_TYPE", ["RW_BIT", this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_BIT", this.storeType], ["TYPE_INT", "LENGTH", "UNSIGNED", "ZEROFILL"], ["TYPE_INT"], ["RW_REAL", this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_REAL", this.storeType], ["RW_DOUBLE", this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_DOUBLE", this.storeType], ["RW_FLOAT", this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_FLOAT", this.storeType], ["RW_DECIMAL", this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_DECIMAL", this.storeType], ["RW_NUMERIC", this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_NUMERIC", this.storeType], ["RW_DATE", this.storeType], ["RW_TIME", this.storeType, "LENGTH"], ["RW_TIME", this.storeType], ["RW_TIMESTAMP", this.storeType, "LENGTH"], ["RW_TIMESTAMP", this.storeType], ["RW_YEAR", this.storeType, "LENGTH", "BINARY"], ["RW_CHAR", this.storeType, "LENGTH"], ["RW_CHAR", this.storeType], ["RW_VARCHAR", this.storeType, "LENGTH", "BINARY", "CHARACTER_SET", "COLLATE"], ["RW_VARCHAR", this.storeType, "LENGTH"], // Non-optional length
        ["RW_BINARY", this.storeType, "LENGTH"], ["RW_BINARY", this.storeType], ["RW_VARBINARY", this.storeType, "LENGTH"], // Non-optional length
        ["TYPE_BLOB",], ["TYPE_TEXT", "BINARY", "CHARACTER_SET", "COLLATE"], ["TYPE_TEXT"], ["RW_ENUM", this.storeType, "LEFT_PARAN", "ENUM_STRING_LIST", "RIGHT_PARAN"], ["RW_SET", this.storeType, "LEFT_PARAN", "SET_STRING_LIST", "RIGHT_PARAN"], ["RW_JSON", this.storeType]);
        this.add("BINARY", ["RW_BINARY", (value) => { this.currentType.type.binary = true; }], ["LAMBDA"]);
        this.add("CHARACTER_SET", ["RW_CHARACTER", "RW_SET", "IDENTIFIER", (value) => { this.currentType.type.characterSet = value; }], ["LAMBDA"]);
        this.add("COLLATE", ["RW_COLLATE", "IDENTIFIER", (value) => { this.currentType.type.collate = value; }], ["LAMBDA"]);
        this.add("TYPE_INT", ["RW_TINYINT", this.storeType], ["RW_SMALLINT", this.storeType], ["RW_MEDIUMINT", this.storeType], ["RW_INT", this.storeType], ["RW_INTEGER", this.storeType], ["RW_BIGINT", this.storeType]);
        this.add("TYPE_BLOB", ["RW_TINYBLOB", this.storeType], ["RW_BLOB", this.storeType], ["RW_MEDIUMBLOB", this.storeType], ["RW_LONGBLOB", this.storeType]);
        this.add("TYPE_TEXT", ["RW_TINYTEXT", this.storeType], ["RW_TEXT", this.storeType], ["RW_MEDIUMTEXT", this.storeType], ["RW_LONGTEXT", this.storeType]);
        this.add("ENUM_STRING_LIST", ["STRING", this.storeValue, "ENUM_STRING_LIST_TAIL"], ["LAMBDA"]);
        this.add("ENUM_STRING_LIST_TAIL", ["COMMA", "STRING", this.storeValue, "ENUM_STRING_LIST_TAIL"], ["LAMBDA"]);
        this.add("SET_STRING_LIST", ["STRING", this.storeValue, "SET_STRING_LIST_TAIL"], ["LAMBDA"]);
        this.add("SET_STRING_LIST_TAIL", ["COMMA", "STRING", this.storeValue, "SET_STRING_LIST_TAIL"], ["LAMBDA"]);
        this.add("LENGTH", ["LEFT_PARAN", "INTEGER", this.storeSize, "DECIMALS", "RIGHT_PARAN"], ["LAMBDA"]);
        this.add("UNSIGNED", ["RW_UNSIGNED"], ["LAMBDA"]);
        this.add("ZEROFILL", ["RW_ZEROFILL"], ["LAMBDA"]);
        this.add("DECIMALS", ["COMMA", "INTEGER", (value) => { this.currentType.type.decimals = value; }], ["LAMBDA"]);
        this.add("NULL_TYPE", ["RW_NOT", "RW_NULL", this.storeNullable(false)], ["RW_NULL", this.storeNullable(true)], ["LAMBDA", this.storeNullable(true)]);
        this.add("DEFAULT_VALUE", ["RW_DEFAULT", "VALUE", this.storeDefault], ["LAMBDA"]);
        this.add("VALUE", ["STRING", this.pushValueUp], ["INTEGER", this.pushValueUp], ["FLOAT", this.pushValueUp], ["RW_NULL", this.pushValueUp]);
        this.add("TABLE_OPTIONS_LIST", ["TABLE_OPTION", "TABLE_OPTIONS_LIST"], ["LAMBDA"]);
        // this.add("TABLE_OPTIONS_TAIL",
        //     ["TABLE_OPTION", "TABLE_OPTIONS_TAIL"]
        //     ["LAMBDA"])
        this.add("TABLE_OPTION", ["RW_ENGINE", "OPTIONAL_EQUALS", "IDENTIFIER"], ["RW_AUTO_INCREMENT", "OPTIONAL_EQUALS", "INTEGER"], ["RW_AVG_ROW_LENGTH", "OPTIONAL_EQUALS", "INTEGER"], ["RW_DEFAULT", "RW_CHARACTER", "RW_SET", "OPTIONAL_EQUALS", "IDENTIFIER"], ["RW_DEFAULT", "RW_CHARSET", "OPTIONAL_EQUALS", "IDENTIFIER"], ["RW_CHARACTER", "RW_SET", "OPTIONAL_EQUALS", "IDENTIFIER"], ["RW_CHECKSUM", "OPTIONAL_EQUALS", "INTEGER"], ["RW_DEFAULT", "RW_COLLATE", "OPTIONAL_EQUALS", "IDENTIFIER"], ["RW_COMMENT", "RW_COLLATE", "OPTIONAL_EQUALS", "STRING"], ["RW_COMPRESSION", "OPTIONAL_EQUALS", "COMPRESSION_TYPE"], ["RW_CONNECTION", "OPTIONAL_EQUALS", "COMPRESSION_TYPE"], ["RW_DATA", "RW_DIRECTORY", "OPTIONAL_EQUALS", "STRING"], ["RW_DELTA_KEY_WRITE", "OPTIONAL_EQUALS", "INTEGER"], ["RW_ENCRYPTION", "OPTIONAL_EQUALS", "STRING"], ["RW_INDEX", "RW_DIRECTORY", "OPTIONAL_EQUALS", "STRING"], ["RW_INSERT_METHOD", "OPTIONAL_EQUALS", "IDENTIFIER"], ["RW_KEY_BLOCK_SIZE", "OPTIONAL_EQUALS", "INTEGER"], ["RW_MAX_ROWS", "OPTIONAL_EQUALS", "INTEGER"], ["RW_MIN_ROWS", "OPTIONAL_EQUALS", "INTEGER"], ["RW_PACK_KEYS", "OPTIONAL_EQUALS", "INTEGER_OR_IDENTIFIER"], ["RW_PASSWORD", "OPTIONAL_EQUALS", "STRING"], ["RW_ROW_FORMAT", "OPTIONAL_EQUALS", "IDENTIFIER"], ["RW_STATS_AUTO_RECALC", "OPTIONAL_EQUALS", "INTEGER_OR_IDENTIFIER"], ["RW_STATS_PERSISTENT", "OPTIONAL_EQUALS", "INTEGER_OR_IDENTIFIER"], ["RW_STATS_SAMPLE_PAGES", "OPTIONAL_EQUALS", "INTEGER"], ["RW_TABLESPACE", "IDENTIFIER", "TABLESPACE_OPTIONS"], ["RW_UNION", "OPTIONAL_EQUALS", "COLUMN_LIST"]);
        this.add("TABLESPACE_OPTIONS", ["RW_STORAGE", "TABLESPACE_STORAGE_TYPE"], ["LAMBDA"]);
        this.add("TABLESPACE_STORAGE_TYPE", ["RW_DISK"], ["RW_MEMORY"], ["RW_DEFAULT"]);
        this.add("INTEGER_OR_IDENTIFIER", ["INTEGER"], ["RW_DEFAULT"]);
        this.add("OPTIONAL_EQUALS", ["EQUALS"], ["LAMBDA"]);
        this.add("PARTITION_OPTIONS_LIST", ["LAMBDA"]);
        this.add("TABLE_TYPE", ["TEMPORARY"], ["LAMBDA"]);
        this.add("STRING", ["SQ_STRING", function (value, token, phrase, word, isFinal, context) {
                context.parent.value = value.replace(/\\'/, "'").slice(1, -1);
            }], ["DQ_STRING", (value, token, phrase, word, isFinal, context) => {
                context.parent.value = value.replace(/\\"/, "'").slice(1, -1);
            }]);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MySqlGrammar;
//# sourceMappingURL=grammar.js.map