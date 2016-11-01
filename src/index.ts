import * as console from 'console';
import * as Commander from 'commander'
import { parse, ParsedPath } from 'path'
import * as eyes from 'eyes'

import MySqlTranslator from './translator/mysql/translator'

export function translateMySql(filename: string) {
    return new MySqlTranslator().parse(filename)
}