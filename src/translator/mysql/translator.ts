import { EventEmitter } from 'events';
import { readFileSync } from 'fs';
import { Readable } from 'stream';
import { DataType, Translator, Type } from '../translator';

import { Tokenizer, Grammar, Lexer } from 'sif'
import MySqlGrammar from './grammar'

import { tokens } from './tokens'

export default class MySqlTranslator implements Translator {
    private tokenizer: Tokenizer
    private grammar: MySqlGrammar
    private lexer: Lexer
    private emitter: EventEmitter = new EventEmitter()

    constructor() {
        this.tokenizer = Tokenizer.fromJson(tokens)
        this.grammar = new MySqlGrammar(this.emitter)
        this.lexer = new Lexer("START", this.grammar, this.tokenizer)
    }

    public on(event: string, callback: Function): MySqlTranslator {
        this.emitter.on(event, callback)
        return this
    }

    public parse(file: string | Readable): Object {
        if (typeof file == "string") {
            return this.parseFile(file)
        } else {
            return this.parseStream(file)
        }
    }

    private translateMySqlType(type: DataType) {
        switch(type.name.toLowerCase()) {
            case "tinyint":
            case "smallint":
            case "mediumint":
            case "integer":
            case "bigint":
                return "number"
            case "varchar":
                return "string"
        }
    }

    private parseFile(filename: string): Object {
        // Read the file
        // TODO : auhanson : Implement streaming parsing
        let tables: {[name: string]: { title:string, type: string, properties: Object[] }} = {}
        this.on('table:start', (name) => tables[name] = {
            title: name, type: "object", properties: []
        })
        this.on('column', (column: Type, table: Type) => tables[table.title].properties.push({
                title: column.title,
                type: this.translateMySqlType(column.type)
            })
        )
        this.lexer.parse(filename)
        return tables
    }

    private parseStream(stream: Readable): Object {
        // TODO : auhanson : Implement streaming parsing
        throw('Not implemented')
    }
}