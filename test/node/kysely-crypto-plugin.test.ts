import { Generated, Kysely, SqliteDialect } from 'kysely'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { KyselyCryptoPlugin } from '../../src/kysely-crypto-plugin'

export interface Database {
  person: PersonTable
}

export interface PersonTable {
  id: Generated<number>

  first_name: string

  gender: 'man' | 'woman' | 'other'

  last_name: string
}

describe(`KyselyCryptoPlugin - NODE`, () => {
  let kyselyInstance: Kysely<Database>

  beforeEach(async () => {
    kyselyInstance = new Kysely<Database>({
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
  })

  afterEach(async () => {
    await kyselyInstance.destroy()
  })

  it('can select and get decrypted value', async () => {
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
          },
        }),
      )
      .executeTakeFirst()

    expect(selectDecrypted?.last_name).to.be.eq('Jack')
  })

  it('can select and get encrypted value', async () => {
    const selectEncrypted = await kyselyInstance
      .selectFrom('person')
      .selectAll()
      .where('last_name', '=', 'Jack')
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
      .executeTakeFirst()

    expect(selectEncrypted?.last_name).to.be.eq('Q0eMtQg9BFlPEGhHjeHrEA==')
  })

  it('can update and get encrypted value', async () => {
    await kyselyInstance
      .updateTable('person')
      .where('last_name', '=', 'Jack')
      .set('last_name', 'JackNEW')
      .set('first_name', 'MaxNEW')
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

    const selectEncrypted = await kyselyInstance
      .selectFrom('person')
      .selectAll()
      .where('last_name', '=', 'JackNEW')
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
      .executeTakeFirst()

    expect(selectEncrypted?.last_name).to.be.eq('arZw0P7NXpa6doZAgrm/Mg==')
  })

  it('can update and get decrypted value', async () => {
    await kyselyInstance
      .updateTable('person')
      .where('last_name', '=', 'Jack')
      .set('last_name', 'JackNEW')
      .set('first_name', 'MaxNEW')
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
      .where('last_name', '=', 'JackNEW')
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: ['last_name'],
          fieldsToDecrypt: ['last_name'],
          cryptoParameters: {
            cryptoAlgorithm: 'AES',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
            iv: 'df77b550164054c9e671ebbf2f9976b0',
          },
        }),
      )
      .executeTakeFirst()

    expect(selectDecrypted?.last_name).to.be.eq('JackNEW')
  })

  it('can select and get decrypted value with non default MODE and PADDING', async () => {
    await kyselyInstance
      .insertInto('person')
      .values([
        {
          first_name: 'Red',
          last_name: 'Yellow',
          gender: 'man',
        },
      ])
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: ['last_name'],
          fieldsToDecrypt: [],
          cryptoParameters: {
            cryptoAlgorithm: 'AES',
            mode: 'CFB',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
            iv: 'df77b550164054c9e671ebbf2f9976b0',
          },
        }),
      )
      .execute()

    const selectDecrypted = await kyselyInstance
      .selectFrom('person')
      .selectAll()
      .where('last_name', '=', 'Yellow')
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: ['last_name'],
          fieldsToDecrypt: ['last_name'],
          cryptoParameters: {
            cryptoAlgorithm: 'AES',
            mode: 'CFB',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
            iv: 'df77b550164054c9e671ebbf2f9976b0',
          },
        }),
      )
      .executeTakeFirst()

    expect(selectDecrypted?.last_name).to.be.eq('Yellow')
  })

  it('can select and get decrypted value with no IV specified and ECB mode', async () => {
    await kyselyInstance
      .insertInto('person')
      .values([
        {
          first_name: 'Red',
          last_name: 'Yellow',
          gender: 'man',
        },
      ])
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: ['last_name'],
          fieldsToDecrypt: [],
          cryptoParameters: {
            cryptoAlgorithm: 'AES',
            mode: 'ECB',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
          },
        }),
      )
      .execute()

    const selectDecrypted = await kyselyInstance
      .selectFrom('person')
      .selectAll()
      .where('last_name', '=', 'Yellow')
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: ['last_name'],
          fieldsToDecrypt: ['last_name'],
          cryptoParameters: {
            cryptoAlgorithm: 'AES',
            mode: 'ECB',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
          },
        }),
      )
      .executeTakeFirst()

    expect(selectDecrypted?.last_name).to.be.eq('Yellow')
  })

  it('classic insert have to work with no field setted', async () => {
    await kyselyInstance
      .insertInto('person')
      .values([
        {
          first_name: 'Red',
          last_name: 'Yellow',
          gender: 'man',
        },
      ])
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: [],
          fieldsToDecrypt: [],
          cryptoParameters: {
            cryptoAlgorithm: 'AES',
            mode: 'ECB',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
          },
        }),
      )
      .execute()

    const selectDecrypted = await kyselyInstance
      .selectFrom('person')
      .selectAll()
      .where('last_name', '=', 'Yellow')
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: [''],
          fieldsToDecrypt: [''],
          cryptoParameters: {
            cryptoAlgorithm: 'AES',
            mode: 'ECB',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
          },
        }),
      )
      .executeTakeFirst()

    expect(selectDecrypted?.last_name).to.be.eq('Yellow')
  })

  it('will throw an error if mode is not ECB and IV not setted', async () => {
    const selectDecryptedQuery = kyselyInstance
      .selectFrom('person')
      .selectAll()
      .where('last_name', '=', 'Yellow')
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: ['last_name'],
          fieldsToDecrypt: [''],
          cryptoParameters: {
            cryptoAlgorithm: 'AES',
            mode: 'CBC',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
          },
        }),
      )

    await expect(selectDecryptedQuery?.execute()).rejects.toThrowError()
  })

  it('will throw an error if mode is ECB and IV is setted', async () => {
    const selectDecryptedQuery = kyselyInstance
      .selectFrom('person')
      .selectAll()
      .where('last_name', '=', 'Yellow')
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: ['last_name'],
          fieldsToDecrypt: [''],
          cryptoParameters: {
            cryptoAlgorithm: 'AES',
            mode: 'ECB',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
            iv: 'df77b550164054c9e671ebbf2f9976b0',
          },
        }),
      )

    await expect(selectDecryptedQuery?.execute()).rejects.toThrowError()
  })

  it('will throw an error if alg is RC4 and IV is setted', async () => {
    const selectDecryptedQuery = kyselyInstance
      .selectFrom('person')
      .selectAll()
      .where('last_name', '=', 'Yellow')
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: ['last_name'],
          fieldsToDecrypt: [''],
          cryptoParameters: {
            cryptoAlgorithm: 'RC4',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
            iv: 'df77b550164054c9e671ebbf2f9976b0',
          },
        }),
      )

    await expect(selectDecryptedQuery?.execute()).rejects.toThrowError()
  })

  it('will throw an error if no algorithm is specified', async () => {
    const selectDecryptedQuery = kyselyInstance
      .selectFrom('person')
      .selectAll()
      .where('last_name', '=', 'Yellow')
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: ['last_name'],
          fieldsToDecrypt: [''],
          cryptoParameters: {
            mode: 'ECB',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f91',
            iv: 'df77b550164054c9e671ebbf2f9976b0',
          },
        }),
      )

    await expect(selectDecryptedQuery?.execute()).rejects.toThrowError()
  })

  it('will throw an error if iv length is not even', async () => {
    const selectDecryptedQuery = kyselyInstance
      .selectFrom('person')
      .selectAll()
      .where('last_name', '=', 'Yellow')
      .withPlugin(
        new KyselyCryptoPlugin<Database>({
          fieldsToEncrypt: ['last_name'],
          fieldsToDecrypt: [''],
          cryptoParameters: {
            mode: 'ECB',
            padding: 'Iso97971',
            secretKey: '996bf1b118a02007ea2c7001d92e0f9',
            iv: 'df77b550164054c9e671ebbf2f9976b0',
          },
        }),
      )

    await expect(selectDecryptedQuery?.execute()).rejects.toThrowError()
  })
})
