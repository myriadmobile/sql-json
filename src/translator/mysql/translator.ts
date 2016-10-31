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
        this.tokenizer = Tokenizer.fromJson(tokens.reverse())
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
            case "bit":
            case "tinyint":
            case "smallint":
            case "mediumint":
            case "int":
            case "bigint":
            case "real":
            case "double":
            case "float":
            case "decimal":
            case "numeric":
            case "timestamp":
                return "number"

            case "date":
            case "time":
            case "year":
            case "char":
            case "varchar":
            case "varchar":
            case "binary":
            case "varbinary":
            case "json":
                return "string"
            case "enum":
                return "enum"
            case "set":
                return "array"
        }
    }

    private parseFile(filename: string): Object {
        // Read the file
        // TODO : auhanson : Implement streaming parsing
        let tables: {[name: string]: { title:string, type: string, properties: Object[] }} = {}
        this.on('table:start', (name) => tables[name] = {
            title: name, type: "object", properties: []
        })
        this.on('column', (column: Type, table: Type) => {
                let type: any = {
                    title: column.title,
                    type: this.translateMySqlType(column.type)
                }

                if (column.type.name != 'ENUM') {
                    type.type = this.translateMySqlType(column.type)
                } else {
                    type.enum = column.type.values
                }

                tables[table.title].properties.push(type)
            }
        )
        this.lexer.parse(filename)
        return tables
    }

    private parseStream(stream: Readable): Object {
        // TODO : auhanson : Implement streaming parsing
        throw('Not implemented')
    }
}