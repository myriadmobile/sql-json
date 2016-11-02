import { EventEmitter } from 'events';
import { Grammar } from 'sif';
export default class MySqlGrammar extends Grammar {
    private emitter;
    private currentTypeStack;
    constructor(emitter: EventEmitter);
    private readonly currentType;
    private pushType(type?);
    private popType();
    private readonly storeType;
    private readonly storeSize;
    private readonly storeValue;
    private readonly storeDefault;
    private storeNullable(nullable);
    private readonly tableName;
    private readonly createColumn;
    private readonly columnName;
    private readonly pushValueUp;
    private readonly pushStringValueUp;
    private initialize();
}
