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
  /**
   * cipher algorithm
   */
  cryptoAlgorithm?: CryptoAlgorithm
  /**
   * custom secretKey
   */
  secretKey?: string
  /**
   * custom iv in hex to be converted in word array (using CryptoJS.enc.Hex.parse(iv))
   */
  iv?: string
  /**
   * block padding, default: Pkcs7
   */
  padding?: Padding
  /**
   * block mode, default: CBC
   */
  mode?: Mode
}

type NestedKeys<T> = {
  [K in keyof T]: keyof T[K]
}[keyof T]

export type NestedKeysOrString<T> = NestedKeys<T> | (string & {})

export type CryptoOptions<T> = {
  /**
   * field to decrypt in result (use alias if it is used)
   */
  fieldsToDecrypt: NestedKeysOrString<T>[]
  /**
   * field to encrypt during insert and update, or in '=' and '!=' where condition (use alias if it is used)
   */
  fieldsToEncrypt: NestedKeysOrString<T>[]
  /**
   * encryption options
   */
  cryptoParameters: CryptoParameters
}
