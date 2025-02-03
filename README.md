
  

# kysely-crypto

  

[![CI](https://github.com/alenap93/kysely-crypto/actions/workflows/ci.yml/badge.svg)](https://github.com/alenap93/kysely-crypto/actions/workflows/ci.yml)

[![NPM version](https://img.shields.io/npm/v/kysely-crypto.svg?style=flat)](https://www.npmjs.com/package/kysely-crypto)

[![NPM downloads](https://img.shields.io/npm/dm/kysely-crypto.svg?style=flat)](https://www.npmjs.com/package/kysely-crypto)

[![js-prettier-style](https://img.shields.io/badge/code%20style-prettier-brightgreen.svg?style=flat)](https://prettier.io/)

  

Crypto plugin for kysely, fully typed, developed for Node.js but also runs on Deno and Bun; with this plugin you can encrypt or decrypt fields using crypto-js library.



## Install

```
npm i kysely kysely-crypto
```

## Usage

**Options**

* fieldsToDecrypt: *field to decrypt in result (use alias if it is used)*

* fieldsToEncrypt: *field to encrypt during insert and update, or in '=' and '!=' where condition (use alias if it is used)*

* cryptoParameters: *encryption options*

    * cryptoAlgorithm: *cipher algorithm*

    * secretKey: *custom secretKey*

    * iv: *custom iv in hex to be converted in word array (using CryptoJS.enc.Hex.parse(iv))*

    * mode: *block mode, default: CBC*

    * padding: *block padding, default: Pkcs7*


**How to use**

    const kyselyInstance = new Kysely<Database>({
        dialect: new SqliteDialect({
            database: new Database(':memory:'),
        }),    
    })
    
    await kyselyInstance.schema
    .createTable('person')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .addColumn('first_name', 'varchar(255)')
    .addColumn('last_name', 'varchar(255)')
    .addColumn('gender', 'varchar(255)')
    .execute()
    
    await kyselyInstance
    .insertInto('person')
    .values([
        {   
            first_name: 'Max',
            last_name: 'Jack',
            gender: 'man',
        },
        {
            first_name: 'George',
            last_name: 'Rossi',
            gender: 'man',
        },
    ])
    .withPlugin(
        new KyselyCryptoPlugin<Database>({
            fieldsToEncrypt: ['last_name'],
            fieldsToDecrypt: [],
            cryptoParameters: {
                cryptoAlgorithm: 'AES',
                secretKey: '996bf1b118a02007ea2c7001d92e0f91',
                iv: 'df77b550164054c9e671ebbf2f9976b0',
            },
        }),
    )
    .execute()
    
    const selectDecrypted = await kyselyInstance
    .selectFrom('person')
    .selectAll()
    .where('last_name', '=', 'Jack')    
    .withPlugin(
        new KyselyCryptoPlugin<Database>({
            fieldsToEncrypt: ['last_name'],
            fieldsToDecrypt: ['last_name'],
            cryptoParameters: {
                cryptoAlgorithm: 'AES',
                secretKey: '996bf1b118a02007ea2c7001d92e0f91',
                iv: 'df77b550164054c9e671ebbf2f9976b0',
            }
        }),
    )
    .executeTakeFirst()  

## License

  

Licensed under [MIT](./LICENSE).
