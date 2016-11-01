import { Readable } from 'stream';
import { EventEmitter } from 'events'

export class Type {
    title: string
    description: string
    type: DataType = new DataType()
    properties: Type[] = []
}

export class DataType {
    name: string
    size?: number
    values: (number | string)[] = []
    decimals?: number
    binary: boolean = false
    characterSet?: string
    collate?: number
    default?: number | string
    nullable: boolean
}

export type JsonSchemaType = "array" | "boolean" | "integer" | "number" | "null" | "object" | "string"

export interface JsonSchema {
    title?: string
    description?: string
    type?: JsonSchemaType | JsonSchemaType[]
    properties?: JsonSchema[]
    enum?: (number | string)[]
    uniqueItems?: boolean
    maxLength?: number
    minLenth?: number
    maxValue?: number
    minValue?: number
    default?: string | number
}

export interface Translator {
    parse(file: string | Readable): Object
    on(event: string, callback: Function): Translator
}