import { EventEmitter } from 'events';
import { Grammar } from 'sif'
import { DataType, Translator, Type } from '../translator';

export default class MySqlGrammar extends Grammar {
    private currentTypeStack: Type[] = []

    constructor(private emitter: EventEmitter) {
        super()
        this.initialize()
    }

    private get currentType(): Type {
        return this.currentTypeStack[this.currentTypeStack.length - 1]
    }

    private pushType(type: Type = new Type()): Type {
        this.currentTypeStack.push(type)
        return type
    }

    private popType(): Type {
        return this.currentTypeStack.pop()
    }

    private get storeType() { 
        let self = this

        return function(value) {
            self.currentType.type.name = value
        }
    }

    private get storeSize() {
        let self = this

        return function(value) {
            self.currentType.type.size = value
        }
    }

    private get storeValue() {
        let self = this

        return function(value) {
            self.currentType.type.values.push(value)
        }
    }

    private get tableName() {
        let self = this

        return function(value: string) {
            let type = this.currentType
            type.title = value
            type.type = new DataType()
            type.type.name = 'table'
        }
    }

    private get createColumn() {
        let self = this

        return function() {
            let type = self.popType()
            self.currentType.properties.push(type)
            self.emitter.emit('column', type, self.currentType)
        }
    }

    private get columnName() {
        let self = this

        return function(value: string) {
            let type = self.pushType()
            type.title = value
            type.type = new DataType()
        }
    }

    private get pushValueUp() {
        let self = this

        return function(value, token, phrase, word, isFinal, context) {
            context.parent.value = value
        }
    }

    private initialize() {
        this.add("START",
            ["STATEMENT_LIST"])

        this.add("STATEMENT_LIST",
            ["STATEMENT", "STATEMENT_TAIL"],
            ["LAMBDA"])

        this.add("STATEMENT_TAIL",
            ["SEMICOLON", "STATEMENT", "STATEMENT_TAIL"],
            ["LAMBDA"])

        this.add("STATEMENT", ["SELECT_STATEMENT"],
            ["CREATE_STATEMENT"],
            ["INSERT_STATEMENT"],
            ["UPDATE_STATEMENT"])

        this.add("TEMPORARY",
            ["RW_TEMPORARY"],
            ["LAMBDA"])

        this.add("IF_NOT_EXISTS",
            ["RW_IF", "RW_NOT", "RW_EXISTS"])
        this.add("IF_NOT_EXISTS",
            ["LAMBDA"])

        this.add("TABLE_NAME",
            ["TICK", "IDENTIFIER", this.pushValueUp, "TICK"],
            ["IDENTIFIER", this.pushValueUp, ])

        this.add("COLUMN_NAME",
            ["TICK", "IDENTIFIER", this.pushValueUp, "TICK"],
            ["IDENTIFIER", this.pushValueUp])

        this.add("CREATE_STATEMENT", [
            "RW_CREATE", "TEMPORARY", "TABLE_TYPE", "IF_NOT_EXISTS", "RW_TABLE", "TABLE_NAME",
            (value) => {
                this.pushType()
                this.tableName(value)
                this.emitter.emit('table:start', this.currentType.title)
            }, "CREATE_DEFINITION_LIST", "TABLE_OPTIONS", "PARTITION_OPTIONS", (value) => {
                this.emitter.emit('table:end', this.currentType.title)
                this.emitter.emit('table', this.currentType)
            }
        ])

        this.add("CREATE_DEFINITION_LIST",
            ["LEFT_PARAN", "CREATE_DEFINITION", "CREATE_DEFINITION_TAIL", "RIGHT_PARAN"],
            ["LAMBDA"])

        this.add("CREATE_DEFINITION_TAIL",
            ["COMMA", "CREATE_DEFINITION", "CREATE_DEFINITION_TAIL"],
            ["LAMBDA"])

        this.add("CREATE_DEFINITION",
            ["COLUMN_NAME", this.columnName, "COLUMN_DEFINITION", this.createColumn],
            ["CONSTRAINT", "CONSTRAINT_OPTIONS"],
            ["INDEX_OR_KEY", "INDEX_NAME", "INDEX_TYPE", "INDEX_COLUMN_LIST", "INDEX_OPTION"])
        
        this.add("INDEX_NAME",
            ["IDENTIFIER"],
            ["LAMBDA"])

        this.add("INDEX_OR_KEY",
            ["RW_INDEX"],
            ["RW_KEY"])
        
        this.add("CONSTRAINT",
            ["RW_CONSTRAINT", "STRING"],
            ["RW_CONSTRAINT"],
            ["LAMBDA"])
        
        this.add("CONSTRAINT_OPTIONS",
            ["RW_PRIMARY", "RW_KEY", "INDEX_TYPE", "INDEX_COLUMN_LIST", "INDEX_OPTION"],
            ["RW_UNIQUE", "UNIQUE_CONSTRAINT_OPTIONS"],
            ["RW_FOREIGN", "RW_KEY", "INDEX_NAME", "INDEX_COLUMN_LIST", "REFERENCE_DEFINITION"])
        
        this.add("REFERENCE_DEFINITION",
            ["RW_REFERENCES", "TABLE_NAME", "INDEX_COLUMN_LIST", "MATCH_TYPE", "ON_DELETE", "ON_UPDATE"])
        
        this.add("MATCH_TYPE",
            ["RW_MATCH", "FULL"],
            ["RW_MATCH", "PARTIAL"],
            ["RW_MATCH", "SIMPLE"],
            ["LAMBDA"])

        this.add("ON_DELETE",
            ["RW_ON", "RW_DELETE", "REFERENCE_OPTION"],
            ["LAMBDA"])
        
        this.add("ON_UPDATE",
            ["RW_ON", "RW_UPDATE", "REFERENCE_OPTION"],
            ["LAMBDA"])
        
        this.add("REFERENCE_OPTION",
            ["RW_RESTRICT"],
            ["RW_CASCADE"],
            ["RW_SET", "RW_NULL"],
            ["RW_NO", "RW_ACTION"])
            
        this.add("UNIQUE_CONSTRAINT_OPTIONS",
            ["RW_INDEX", "LEFT_PARAN", "IDENTIFER", "RIGHT_PARAN", "INDEX_TYPE", "INDEX_COLUMN_LIST", "INDEX_OPTION"],
            ["RW_KEY", "INDEX_NAME", "INDEX_TYPE", "INDEX_COLUMN_LIST", "INDEX_OPTION"])

        this.add("INDEX_TYPE",
            ["RW_USING", "RW_BTREE"],
            ["RW_USING", "RW_HASH"],
            ["LAMBDA"])
        
        this.add("INDEX_COLUMN_LIST",
            ["LEFT_PARAN", "IDENTIFIER", "LENGTH", "DIRECTION", "INDEX_COLUMN_TAIL"],
            ["LEFT_PARAN", "TICK", "IDENTIFIER", "LENGTH", "DIRECTION", "TICK", "INDEX_COLUMN_TAIL"])
        this.add("INDEX_COLUMN_TAIL",
            ["COMMA", "IDENTIFIER", "LENGTH", "DIRECTION", "INDEX_COLUMN_TAIL"],
            ["COMMA", "TICK", "IDENTIFIER", "LENGTH", "DIRECTION", "TICK", "INDEX_COLUMN_TAIL"],
            ["RIGHT_PARAN"])
        
        this.add("DIRECTION",
            ["RW_ASC"],
            ["RW_DESC"],
            ["LAMBDA"])
        
        this.add("INDEX_OPTION",
            ["KW_KEY_BLOCK_SIZE", "EQUALS", "INTEGER"],
            ["INDEX_TYPE"],
            ["RW_WITH", "RW_PARSER", "IDENTIFIER"],
            ["RW_COMMENT", "STRING"],
            ["LAMBDA"])

        this.add("COLUMN_DEFINITION",
            ["DATA_TYPE", "NULL_TYPE", "DEFAULT_VALUE"])

        this.add("DATA_TYPE",
            ["RW_BIT",      this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_BIT",       this.storeType],
            
            ["TYPE_INT",    /* internal */  "LENGTH", "UNSIGNED", "ZEROFILL"], ["TYPE_INT"],
            
            ["RW_REAL",     this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_REAL",      this.storeType],
            ["RW_DOUBLE",   this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_DOUBLE",    this.storeType],
            ["RW_FLOAT",    this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_FLOAT",     this.storeType],
            ["RW_DECIMAL",  this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_DECIMAL",   this.storeType],
            ["RW_NUMERIC",  this.storeType, "LENGTH", "UNSIGNED", "ZEROFILL"], ["RW_NUMERIC",   this.storeType],

            ["KW_DATE",     this.storeType],
            ["RW_TIME",     this.storeType, "LENGTH"], ["RW_TIME",      this.storeType],
            ["RW_TIMESTAMP",this.storeType, "LENGTH"], ["RW_TIMESTAMP", this.storeType],
            ["RW_YEAR",     this.storeType, "LENGTH", "BINARY"],

            ["RW_CHAR",     this.storeType, "LENGTH"], ["RW_CHAR",      this.storeType],
            ["RW_VARCHAR",  this.storeType, "LENGTH", "BINARY", "CHARACTER_SET", "COLLATE"],
            ["RW_VARCHAR",  this.storeType, "LENGTH"],  // Non-optional length
            ["RW_BINARY",   this.storeType, "LENGTH"], ["RW_BINARY",    this.storeType],
            ["RW_VARBINARY",this.storeType, "LENGTH"],  // Non-optional length
            
            ["TYPE_BLOB",    /* internal */],
            ["TYPE_TEXT",    /* internal */  "BINARY", "CHARACTER_SET", "COLLATE"], ["TYPE_TEXT"],
            
            ["KW_ENUM",     this.storeType, "LEFT_PARAN", "ENUM_STRING_LIST", "RIGHT_PARAN"],
            ["RW_SET",      this.storeType, "LEFT_PARAN", "SET_STRING_LIST", "RIGHT_PARAN"],
            ["RW_JSON",     this.storeType])

        this.add("BINARY",
            ["RW_BINARY", (value) => { this.currentType.type.binary = true }],
            ["LAMBDA"])

        this.add("CHARACTER_SET",
            ["RW_CHARACTER", "RW_SET", "IDENTIFER", (value) => { this.currentType.type.characterSet = value }],
            ["LAMBDA"],
            ["RW_COLLATE", "IDENTIFER", (value) => { this.currentType.type.collate = value }])

        this.add("COLLATE", ["LAMBDA"])

        this.add("TYPE_INT",
            ["RW_TINYINT",  this.storeType],
            ["RW_SMALLINT", this.storeType],
            ["RW_MEDIUMINT",this.storeType],
            ["RW_INT",      this.storeType],
            ["RW_INTEGER",  this.storeType],
            ["RW_BIGINT",   this.storeType])

        this.add("TYPE_BLOB",
            ["RW_TINYBLOB", this.storeType],
            ["RW_BLOB",     this.storeType],
            ["RW_MEDIUMBLOB", this.storeType],
            ["RW_LONGBLOB", this.storeType])

        this.add("TYPE_TEXT",
            ["RW_TINYTEXT", this.storeType],
            ["RW_TEXT",     this.storeType],
            ["RW_MEDIUMTEXT", this.storeType],
            ["RW_LONGTEXT", this.storeType])
        
        this.add("ENUM_STRING_LIST",
            ["STRING", this.storeValue, "ENUM_STRING_LIST_TAIL"],
            ["LAMBDA"])

        this.add("ENUM_STRING_LIST_TAIL",
            ["COMMA", "STRING", this.storeValue, "ENUM_STRING_LIST_TAIL"],
            ["LAMBDA"])

        this.add("SET_STRING_LIST",
            ["STRING", this.storeValue, "SET_STRING_LIST_TAIL"],
            ["LAMBDA"])

        this.add("SET_STRING_LIST_TAIL",
            ["COMMA", "STRING", this.storeValue, "SET_STRING_LIST_TAIL"],
            ["LAMBDA"])

        this.add("LENGTH",
            ["LEFT_PARAN", "INTEGER", this.storeSize, "DECIMALS", "RIGHT_PARAN"],
            ["LAMBDA"])

        this.add("UNSIGNED",
            ["RW_UNSIGNED"],
            ["LAMBDA"])

        this.add("ZEROFILL",
            ["RW_ZEROFILL"],
            ["LAMBDA"])

        this.add("DECIMALS",
            ["COMMA", "INTEGER", (value) => { this.currentType.type.decimals = value }],
            ["LAMBDA"])

        this.add("NULL_TYPE",
            ["RW_NOT", "RW_NULL"],
            ["RW_NULL"],
            ["LAMBDA"])

        this.add("DEFAULT_VALUE",
            ["RW_DEFAULT", "EXPRESSION"],
            ["LAMBDA"])

        this.add("EXPRESSION",
            ["RW_NULL"])

        this.add("TABLE_OPTIONS",
            ["LAMBDA"])
        this.add("PARTITION_OPTIONS",
            ["LAMBDA"])

        this.add("TABLE_TYPE",
            ["TEMPORARY"],
            ["LAMBDA"])
        
        this.add("STRING",
            ["SQ_STRING", function(value, token, phrase, word, isFinal, context) {
                context.parent.value = value.replace(/\\'/, "'").slice(1, -1)
            }],
            ["DQ_STRING", (value, token, phrase, word, isFinal, context) => {
                context.parent.value = value.replace(/\\"/, "'").slice(1, -1)
            }])
    }
}