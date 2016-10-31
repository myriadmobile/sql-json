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
    size: number
    values: string[] = []
    decimals: number
    binary: boolean
    characterSet: string
    collate: number
}

export interface Translator {
    parse(file: string | Readable): Object
    on(event: string, callback: Function): Translator
}