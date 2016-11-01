import { EventEmitter } from 'events';
import { readFileSync } from 'fs';
import { Readable } from 'stream';
import { DataType, JsonSchema, JsonSchemaType, Translator, Type } from '../translator';

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

    private translateMySqlType(type: DataType, nullable: boolean): JsonSchemaType | JsonSchemaType[] {
        let translatedType: JsonSchemaType = "object"

        switch(type.name.toLowerCase()) {
            case "bit":
            case "tinyint":
            case "smallint":
            case "mediumint":
            case "int":
            case "bigint":
            case "timestamp":
                translatedType = "integer"
                break
            case "real":
            case "double":
            case "float":
            case "decimal":
            case "numeric":
                translatedType = "number"
                break
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
                translatedType = "string"
                break
            case "enum":
                translatedType = "array"
                break
            case "set":
                translatedType = "array"
                break
        }

        if (nullable) {
            return [translatedType, "null"]
        } else {
            return translatedType
        }
    }

    private parseFile(filename: string): Object {
        // Read the file
        // TODO : auhanson : Implement streaming parsing
        let tables: {[name: string]: JsonSchema} = {}
        this.on('table:start', (name) => tables[name] = {
            title: name,
            type: "object",
            properties: []
        } as JsonSchema)
        this.on('column', (column: Type, table: Type) => {
                let type: JsonSchema = {
                    title: column.title,
                    type: this.translateMySqlType(column.type, column.type.nullable)
                } as JsonSchema

                if (column.type.default) {
                    type.default = column.type.default
                }

                let mysqlType = column.type.name.toLowerCase()
                if (mysqlType === 'enum') {
                    delete type.type
                    type.enum = column.type.values
                } else {
                    if (mysqlType === 'set') {
                        type.uniqueItems = true
                    }

                    if (column.type.size) {
                        if (type.type === 'string' || (type.type instanceof Array && (type.type as JsonSchemaType[]).find(type => type === 'string'))) {
                            type.maxLength = column.type.size
                        }
                    }
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