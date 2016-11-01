import { Readable } from 'stream';
import { Translator } from '../translator';
export default class MySqlTranslator implements Translator {
    private tokenizer;
    private grammar;
    private lexer;
    private emitter;
    constructor();
    on(event: string, callback: Function): MySqlTranslator;
    parse(file: string | Readable): Object;
    private translateMySqlType(type, nullable);
    private parseFile(filename);
    private parseStream(stream);
}
