# sql-json
SQL/JSON Schema translation

Provides utilities for converting between SQL schema and [JSON schema](http://json-schema.org/).

## SQL Support
* Loose support for MySQL create statements right now

## Example
```bash
```

## TODO
* Complete MySQL CREATE parsing
* Complete MySQL -> JSON Schema translation

## Development
### Setup
```bash
# Yarn has issues with global symlinking binaries
npm install -s -g typescript@next
npm install -s -g typings@next
yarn install
typings install
tsc -p .
```