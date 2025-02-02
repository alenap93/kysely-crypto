import {
  OperationNodeTransformer,
  BinaryOperationNode,
  InsertQueryNode,
  ColumnUpdateNode,
  ValuesNode,
  ColumnNode,
  ReferenceNode,
  ValueNode,
} from 'kysely'
import { CryptoOptions, NestedKeysOrString } from './types/types'
import { cryptoMethodology } from './utils/crypto-utils'

export class CryptoTransformer<T> extends OperationNodeTransformer {
  private options: CryptoOptions<T>
  private encryptedFields: Set<NestedKeysOrString<T>>

  constructor(options: CryptoOptions<T>) {
    super()
    this.options = options
    this.encryptedFields = new Set(options.fieldsToEncrypt || [])
  }

  protected override transformBinaryOperation(
    node: BinaryOperationNode,
  ): BinaryOperationNode {
    return this.encryptWhereValues(super.transformBinaryOperation(node))
  }

  protected override transformInsertQuery(
    node: InsertQueryNode,
  ): InsertQueryNode {
    return this.encryptInsertValues(super.transformInsertQuery(node))
  }

  protected override transformColumnUpdate(
    node: ColumnUpdateNode,
  ): ColumnUpdateNode {
    return this.encryptUpdateValues(super.transformColumnUpdate(node))
  }

  private encryptInsertValues(node: InsertQueryNode): InsertQueryNode {
    // if (!(<ValuesNode>node?.values).values.length) return node

    const encryptedValues = (<ValuesNode>node?.values)?.values.map(
      (valueList) => ({
        ...valueList,
        values: valueList.values.map((value, idx) =>
          this.maybeEncrypt(<string>value, node.columns?.[idx]?.column?.name),
        ),
      }),
    )

    return {
      ...node,
      values: <ValuesNode>{
        ...node.values,
        values: encryptedValues,
      },
    }
  }

  private encryptUpdateValues(node: ColumnUpdateNode): ColumnUpdateNode {
    const columnName = (<ColumnNode>(<ReferenceNode>node?.column)?.column)
      ?.column.name
    const currentValue = (<ValueNode>node.value).value
    const encryptedValue = this.maybeEncrypt(<string>currentValue, columnName)

    return columnName &&
      currentValue &&
      encryptedValue &&
      currentValue !== encryptedValue
      ? { ...node, value: <ValueNode>{ ...node.value, value: encryptedValue } }
      : node
  }

  private encryptWhereValues(node: BinaryOperationNode): BinaryOperationNode {
    const columnName = (<ColumnNode>(<ReferenceNode>node.leftOperand)?.column)
      ?.column?.name
    const currentValue = (<ValueNode>node.rightOperand)?.value
    const encryptedValue = this.maybeEncrypt(<string>currentValue, columnName)

    return columnName &&
      currentValue &&
      encryptedValue &&
      currentValue !== encryptedValue
      ? {
          ...node,
          rightOperand: <ValueNode>{
            ...node.rightOperand,
            value: encryptedValue,
          },
        }
      : node
  }

  private maybeEncrypt(value: string, columnName?: string): string {
    return columnName && value && this.encryptedFields.has(columnName)
      ? cryptoMethodology(value, 'encrypt', this.options.cryptoParameters)
      : value
  }
}
