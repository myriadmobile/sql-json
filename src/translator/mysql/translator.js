"use strict";
const events_1 = require('events');
const sif_1 = require('sif');
const grammar_1 = require('./grammar');
const tokens_1 = require('./tokens');
class MySqlTranslator {
    constructor() {
        this.emitter = new events_1.EventEmitter();
        this.tokenizer = sif_1.Tokenizer.fromJson(tokens_1.tokens);
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
    translateMySqlType(type) {
        switch (type.name.toLowerCase()) {
            case "tinyint":
            case "smallint":
            case "mediumint":
            case "integer":
            case "bigint":
                return "number";
            case "varchar":
                return "string";
        }
    }
    parseFile(filename) {
        // Read the file
        // TODO : auhanson : Implement streaming parsing
        let tables = {};
        this.on('table:start', (name) => tables[name] = {
            title: name, type: "object", properties: []
        });
        this.on('column', (column, table) => tables[table.title].properties.push({
            title: column.title,
            type: this.translateMySqlType(column.type)
        }));
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