import { translateMySql } from './'
import * as eyes from 'eyes'

let tables = translateMySql('./sample/test.mysql')
for (let table in tables) {
    eyes.inspect(tables[table])
}