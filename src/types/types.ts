export type Methods = 'encrypt' | 'decrypt'
export type Padding =
  | 'Pkcs7'
  | 'AnsiX923'
  | 'Iso10126'
  | 'Iso97971'
  | 'ZeroPadding'
  | 'NoPadding'
export type Mode = 'CBC' | 'CFB' | 'CTR' | 'CTRGladman' | 'OFB' | 'ECB'
export type CryptoAlgorithm =
  | 'AES'
  | 'DES'
  | 'TripleDES'
  | 'Blowfish'
  | 'RabbitLegacy'
  | 'Rabbit'
  | 'RC4'
  | 'RC4Drop'

export type CryptoParameters = {
  cryptoAlgorithm?: CryptoAlgorithm
  secretKey?: string
  iv?: string
  padding?: Padding
  mode?: Mode
}

type NestedKeys<T> = {
  [K in keyof T]: keyof T[K]
}[keyof T]

export type NestedKeysOrString<T> = NestedKeys<T> | (string & {})

export type CryptoOptions<T> = {
  /**
   * field to decrypt/decode in result (use alias if it is used), or in '=' and '!=' where condition
   */
  fieldsToDecrypt: NestedKeysOrString<T>[]
  /**
   * field to encrypt/encode/hash during insert and update
   */
  fieldsToEncrypt: NestedKeysOrString<T>[]
  /**
   * options to encrypt/encode/hash
   */
  cryptoParameters: CryptoParameters
}
