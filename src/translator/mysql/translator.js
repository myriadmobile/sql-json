"use strict";
const events_1 = require('events');
const sif_1 = require('sif');
const grammar_1 = require('./grammar');
const tokens_1 = require('./tokens');
class MySqlTranslator {
    constructor() {
        this.emitter = new events_1.EventEmitter();
        this.tokenizer = sif_1.Tokenizer.fromJson(tokens_1.tokens.reverse());
        this.grammar = new grammar_1.default(this.emitter);
        this.lexer = new sif_1.Lexer("START", this.grammar, this.tokenizer);
    }
    on(event, callback) {
        this.emitter.on(event, callback);
        return this;
    }
    parse(file) {
        if (typeof file == "string") {
            return this.parseFile(file);
        }
        else {
            return this.parseStream(file);
        }
    }
    translateMySqlType(type, nullable) {
        let translatedType = "object";
        switch (type.name.toLowerCase()) {
            case "bit":
            case "tinyint":
            case "smallint":
            case "mediumint":
            case "int":
            case "bigint":
            case "timestamp":
                translatedType = "integer";
                break;
            case "real":
            case "double":
            case "float":
            case "decimal":
            case "numeric":
                translatedType = "number";
                break;
            case "date":
            case "time":
            case "year":
            case "char":
            case "varchar":
            case "tinyblob":
            case "blob":
            case "mediumblob":
            case "longblob":
            case "tinytext":
            case "text":
            case "mediumtext":
            case "longtext":
            case "binary":
            case "varbinary":
            case "json":
                translatedType = "string";
                break;
            case "enum":
                translatedType = "array";
                break;
            case "set":
                translatedType = "array";
                break;
        }
        if (nullable) {
            return [translatedType, "null"];
        }
        else {
            return translatedType;
        }
    }
    parseFile(filename) {
        // Read the file
        // TODO : auhanson : Implement streaming parsing
        let tables = {};
        this.on('table:start', (name) => tables[name] = {
            title: name,
            type: "object",
            properties: []
        });
        this.on('column', (column, table) => {
            let type = {
                title: column.title,
                type: this.translateMySqlType(column.type, column.type.nullable)
            };
            if (column.type.default) {
                type.default = column.type.default;
            }
            let mysqlType = column.type.name.toLowerCase();
            if (mysqlType === 'enum') {
                delete type.type;
                type.enum = column.type.values;
            }
            else {
                if (mysqlType === 'set') {
                    type.uniqueItems = true;
                }
                if (column.type.size) {
                    if (type.type === 'string' || (type.type instanceof Array && type.type.find(type => type === 'string'))) {
                        type.maxLength = column.type.size;
                    }
                }
            }
            tables[table.title].properties.push(type);
        });
        this.lexer.parse(filename);
        return tables;
    }
    parseStream(stream) {
        // TODO : auhanson : Implement streaming parsing
        throw ('Not implemented');
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MySqlTranslator;
//# sourceMappingURL=translator.js.map