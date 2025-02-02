import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  RootOperationNode,
  PluginTransformResultArgs,
  QueryResult,
  UnknownRow,
} from 'kysely'
import { cryptoMethodology } from './utils/crypto-utils'
import { CryptoOptions, NestedKeysOrString } from './types/types'
import { CryptoTransformer } from './crypto-transformer'

export class KyselyCryptoPlugin<T> implements KyselyPlugin {
  readonly #cryptoTransformer: CryptoTransformer<T>
  private options: CryptoOptions<T>
  readonly #fieldsToDecrypt: Set<NestedKeysOrString<T>>

  constructor(options: CryptoOptions<T>) {
    this.options = options
    this.#cryptoTransformer = new CryptoTransformer<T>(options)
    this.#fieldsToDecrypt = new Set(options.fieldsToDecrypt || [])
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#cryptoTransformer.transformNode(args.node)
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return this.decryptValues(args)
  }

  /*
   * Method that decrypt the result
   */
  private decryptValues({
    result,
  }: PluginTransformResultArgs): QueryResult<UnknownRow> {
    return {
      ...result,
      rows: result.rows.map((row) => {
        const decryptedRow: UnknownRow = { ...row }

        for (const key of Object.keys(decryptedRow)) {
          if (this.#fieldsToDecrypt.has(key)) {
            decryptedRow[key] = cryptoMethodology(
              decryptedRow[key] as string,
              'decrypt',
              this.options.cryptoParameters,
            )
          }
        }

        return decryptedRow
      }),
    }
  }
}
