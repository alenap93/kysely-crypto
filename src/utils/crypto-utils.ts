import CryptoJS from 'crypto-js'
import {
  CryptoAlgorithm,
  CryptoParameters,
  Methods,
  Mode,
} from '../types/types'

/*
 * Algorithm map to reduce switch statement redundancy
 */
const CRYPTO_ALGORITHMS = {
  AES: CryptoJS.AES,
  DES: CryptoJS.DES,
  TripleDES: CryptoJS.TripleDES,
  Blowfish: CryptoJS.Blowfish,
  RabbitLegacy: CryptoJS.RabbitLegacy,
  Rabbit: CryptoJS.Rabbit,
  RC4: CryptoJS.RC4,
  RC4Drop: CryptoJS.RC4Drop,
} as const

const HEX_REGEX = /^[0-9a-f]+$/i

const BLOCK_SIZES: Record<CryptoAlgorithm, number> = {
  AES: 16,
  DES: 8,
  TripleDES: 8,
  Blowfish: 8,
  RabbitLegacy: 8,
  Rabbit: 8,
  RC4: 0,
  RC4Drop: 0,
}

const KEY_CONSTRAINTS: Record<CryptoAlgorithm, { min: number; max: number }> = {
  AES: { min: 16, max: 32 },
  DES: { min: 8, max: 8 },
  TripleDES: { min: 24, max: 24 },
  Blowfish: { min: 4, max: 56 },
  RabbitLegacy: { min: 0, max: Infinity },
  Rabbit: { min: 0, max: Infinity },
  RC4: { min: 1, max: 256 },
  RC4Drop: { min: 1, max: 256 },
}

/*
 * Unified crypto processing function
 */
export function cryptoMethodology(
  data: string,
  method: Methods,
  options: CryptoParameters = {},
): string {
  const { cryptoAlgorithm, secretKey } = options
  if (!cryptoAlgorithm || !secretKey) {
    const methodName = method.charAt(0).toUpperCase() + method.slice(1)
    throw new Error(
      `KyselyCryptoPlugin: ${methodName} algorithm and secretKey required.`,
    )
  }

  return method === 'encrypt'
    ? processCrypto(data, cryptoAlgorithm, secretKey, options, 'encrypt')
    : processCrypto(data, cryptoAlgorithm, secretKey, options, 'decrypt')
}

function validateHex(input: string, name: string): void {
  if (!HEX_REGEX.test(input)) {
    throw new Error(
      `KyselyCryptoPlugin: ${name} must be a valid hexadecimal string`,
    )
  }
  if (input.length % 2 !== 0) {
    throw new Error(
      `KyselyCryptoPlugin: ${name} must have even number of characters`,
    )
  }
}

function validateKeyLength(
  algorithm: CryptoAlgorithm,
  keyByteLength: number,
): void {
  const { min, max } = KEY_CONSTRAINTS[algorithm]
  if (keyByteLength < min || keyByteLength > max) {
    throw new Error(
      `KyselyCryptoPlugin: Invalid key length for ${algorithm}. ` +
        `Valid lengths: ${min}-${max === Infinity ? 'unlimited' : max} bytes`,
    )
  }
}

function validateIV(
  algorithm: CryptoAlgorithm,
  mode?: Mode,
  iv?: string,
): void {
  if (mode === 'ECB') {
    if (iv) throw new Error('KyselyCryptoPlugin: IV not allowed in ECB mode')
    return
  }

  const blockSize = BLOCK_SIZES[algorithm]
  if (blockSize === 0) {
    if (iv) throw new Error(`KyselyCryptoPlugin: ${algorithm} does not use IV`)
    return
  }

  if (!iv)
    throw new Error(
      `KyselyCryptoPlugin: IV required for ${algorithm} in ${mode} mode`,
    )

  validateHex(iv, 'IV')
  const ivByteLength = iv.length / 2
  if (ivByteLength !== blockSize) {
    throw new Error(
      `KyselyCryptoPlugin: IV must be ${blockSize} bytes for ${algorithm}`,
    )
  }
}

function checkCryptoParams(
  algorithm: CryptoAlgorithm,
  secretKey: string,
  mode?: Mode,
  iv?: string,
): void {
  // Validate secret key
  validateHex(secretKey, 'Secret key')
  const keyByteLength = secretKey.length / 2
  validateKeyLength(algorithm, keyByteLength)

  // Validate IV
  validateIV(algorithm, mode, iv)
}

/*
 * Generic crypto processor for both encryption and decryption
 */
function processCrypto(
  data: string,
  algorithm: CryptoAlgorithm,
  secretKey: string,
  options: CryptoParameters,
  operation: 'encrypt' | 'decrypt',
): string {
  checkCryptoParams(algorithm, secretKey, options.mode, options.iv)

  const { parsedIV, parsedPadding, parsedMode, parsedKey } = getCryptoParams(
    options,
    algorithm,
  )
  const cryptoModule = CRYPTO_ALGORITHMS[algorithm]

  const result =
    operation === 'encrypt'
      ? cryptoModule.encrypt(data, parsedKey, {
          iv: parsedIV,
          padding: parsedPadding,
          mode: parsedMode,
        })
      : cryptoModule.decrypt(data, parsedKey, {
          iv: parsedIV,
          padding: parsedPadding,
          mode: parsedMode,
        })

  return operation === 'encrypt'
    ? result.toString()
    : // @ts-ignore
      result.toString(CryptoJS.enc.Utf8)
}

/*
 * Helper to get standardized crypto parameters
 */
function getCryptoParams(
  options: CryptoParameters,
  algorithm: CryptoAlgorithm,
) {
  const { iv, padding, mode, secretKey } = options
  const blockSize = BLOCK_SIZES[algorithm]
  return {
    parsedIV: iv
      ? CryptoJS.enc.Hex.parse(iv)
      : CryptoJS.lib.WordArray.random(blockSize),
    parsedPadding: padding ? CryptoJS.pad[padding] : CryptoJS.pad.Pkcs7,
    parsedMode: mode ? CryptoJS.mode[mode] : CryptoJS.mode.CBC,
    parsedKey: CryptoJS.enc.Hex.parse(secretKey!),
  }
}
