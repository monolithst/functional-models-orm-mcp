import { ModelType } from 'functional-models'
import { McpToolMeta, OpenAPISchema, ModelOperation } from './types'

export const getOrmSearchSchema = (): OpenAPISchema => {
  return {
    type: 'object',
    properties: {
      modelType: { type: 'string', description: 'The model type' },
      query: {
        type: 'object',
        description: 'Search query',
        // @ts-ignore
        properties: {
          take: { type: 'integer', description: 'Max records to return' },
          sort: {
            type: 'object',
            // @ts-ignore
            properties: {
              key: { type: 'string', description: 'Property key/column' },
              order: {
                type: 'string',
                enum: ['asc', 'dsc'],
                description: 'Sort order (asc or dsc)',
              },
            },
            required: ['key', 'order'],
            description: 'Sorting statement',
          },
          page: {
            type: 'object',
            description: 'Pagination information (any shape)',
          },
          query: {
            type: 'array',
            description: 'Query tokens',
            // @ts-ignore
            items: {
              oneOf: [
                {
                  type: 'string',
                  enum: ['AND', 'OR'],
                  description: 'Boolean query',
                },
                {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['property'],
                      description: 'property',
                    },
                    key: { type: 'string' },
                    value: {},
                    valueType: {
                      type: 'string',
                      enum: ['string', 'number', 'date', 'object', 'boolean'],
                    },
                    equalitySymbol: {
                      type: 'string',
                      enum: ['=', '<', '<=', '>', '>='],
                    },
                    options: {
                      type: 'object',
                      properties: {
                        caseSensitive: { type: 'boolean' },
                        startsWith: { type: 'boolean' },
                        endsWith: { type: 'boolean' },
                      },
                    },
                  },
                  required: [
                    'type',
                    'key',
                    'value',
                    'valueType',
                    'equalitySymbol',
                  ],
                },
                {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['datesAfter'],
                      description: 'datesAfter',
                    },
                    key: { type: 'string' },
                    date: { type: 'string', format: 'date-time' },
                    valueType: {
                      type: 'string',
                      enum: ['string', 'number', 'date', 'object', 'boolean'],
                    },
                    options: {
                      type: 'object',
                      properties: {
                        equalToAndAfter: { type: 'boolean' },
                      },
                    },
                  },
                  required: ['type', 'key', 'date', 'valueType'],
                },
                {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['datesBefore'],
                      description: 'datesBefore',
                    },
                    key: { type: 'string' },
                    date: { type: 'string', format: 'date-time' },
                    valueType: {
                      type: 'string',
                      enum: ['string', 'number', 'date', 'object', 'boolean'],
                    },
                    options: {
                      type: 'object',
                      properties: {
                        equalToAndBefore: { type: 'boolean' },
                      },
                    },
                  },
                  required: ['type', 'key', 'date', 'valueType'],
                },
                {
                  type: 'array',
                  items: { $ref: '#' },
                  description: 'Nested QueryTokens',
                },
              ],
            },
          },
        },
      },
    },
    required: ['modelType', 'query'],
  }
}

export const getModelIdSchema = (): OpenAPISchema => {
  return {
    type: 'object',
    properties: {
      modelType: { type: 'string', description: 'The model type' },
      id: { type: 'string', description: 'The model ID' },
    },
    required: ['modelType', 'id'],
  }
}

export const getModelIdArraySchema = (): OpenAPISchema => {
  return {
    type: 'object',
    properties: {
      modelType: { type: 'string', description: 'The model type' },
      ids: { type: 'array', description: 'The model IDs' },
    },
    required: ['modelType', 'ids'],
  }
}

export const createMcpToolSave = (model?: ModelType<any>): McpToolMeta => {
  const schema = model?.getModelDefinition().schema || { type: 'object' }
  return {
    name: `model_save`,
    description: `Save (create or update) a model record`,
    inputSchema: {
      type: 'object',
      properties: {
        modelType: { type: 'string' },
        instance: schema,
      },
      required: ['modelType', 'instance'],
    },
    outputSchema: schema,
  }
}

export const createMcpToolRetrieve = (model?: ModelType<any>): McpToolMeta => {
  const schema = model?.getModelDefinition().schema || { type: 'object' }
  const idSchema: OpenAPISchema = getModelIdSchema()
  return {
    name: `model_retrieve`,
    description: `Retrieve a model record by ID`,
    inputSchema: idSchema,
    outputSchema: {
      oneOf: [schema, { type: 'null' }],
    },
  }
}

export const createMcpToolDelete = (): McpToolMeta => {
  const idSchema: OpenAPISchema = getModelIdSchema()
  return {
    name: `model_delete`,
    description: `Delete a model record by ID`,
    inputSchema: idSchema,
    outputSchema: { type: 'null' },
  }
}

export const createMcpToolSearch = (model?: ModelType<any>): McpToolMeta => {
  const schema = model?.getModelDefinition().schema || { type: 'object' }
  const querySchema: OpenAPISchema = getOrmSearchSchema()
  return {
    name: `model_search`,
    description: `Search for model records`,
    inputSchema: querySchema,
    outputSchema: {
      type: 'object',
      properties: {
        instances: { type: 'array', items: schema },
        page: { type: 'object' },
      },
      required: ['instances'],
    },
  }
}

export const createMcpToolBulkInsert = (
  model?: ModelType<any>
): McpToolMeta => {
  const schema = model?.getModelDefinition().schema || { type: 'object' }
  return {
    name: `model_bulk_insert`,
    description: `Bulk insert model records`,
    inputSchema: {
      type: 'object',
      properties: {
        modelType: { type: 'string' },
        items: {
          type: 'array',
          items: schema,
        },
      },
      required: ['modelType', 'items'],
    },
    outputSchema: { type: 'null' },
  }
}

export const createMcpToolBulkDelete = (): McpToolMeta => {
  const idArraySchema: OpenAPISchema = getModelIdArraySchema()
  return {
    name: `model_bulk_delete`,
    description: `Bulk delete model records by IDs`,
    inputSchema: idArraySchema,
    outputSchema: { type: 'null' },
  }
}

export const generateMcpToolForModelOperation = (
  model: ModelType<any>,
  operation: ModelOperation
): McpToolMeta => {
  switch (operation) {
    case ModelOperation.save:
      return createMcpToolSave(model)
    case ModelOperation.retrieve:
      return createMcpToolRetrieve(model)
    case ModelOperation.delete:
      return createMcpToolDelete()
    case ModelOperation.search:
      return createMcpToolSearch(model)
    case ModelOperation.bulkInsert:
      return createMcpToolBulkInsert(model)
    case ModelOperation.bulkDelete:
      return createMcpToolBulkDelete()
    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}

export const generateMcpToolsForModel = (
  model: ModelType<any>
): McpToolMeta[] => {
  const operations: ModelOperation[] = [
    ModelOperation.save,
    ModelOperation.retrieve,
    ModelOperation.delete,
    ModelOperation.search,
    ModelOperation.bulkInsert,
    ModelOperation.bulkDelete,
  ]
  return operations.map(op => generateMcpToolForModelOperation(model, op))
}
