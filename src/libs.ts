import {
  ModelType,
  PropertyConfig,
  PropertyInstance,
  PropertyType,
} from 'functional-models'
import { McpToolMeta, ToolNameGenerator, OpenAPISchema } from './types'

// Default tool name generator: lower_case_with_underscores
export const defaultToolNameGenerator: ToolNameGenerator = (
  model,
  operation
) => {
  const def = model.getModelDefinition()
  return `${def.namespace}_${def.pluralName}_${operation}`
    .replace(/[^a-z0-9]+/giu, '_')
    .toLowerCase()
}

// Map a functional-models property instance to OpenAPI schema property
export const mapPropertyToOpenApi = (
  property: PropertyInstance<any>
): {
  type: string
  description?: string
  enum?: string[]
} => {
  const typeMap: Record<PropertyType, string> = {
    [PropertyType.Array]: 'array',
    [PropertyType.BigText]: 'string',
    [PropertyType.Boolean]: 'boolean',
    [PropertyType.Date]: 'string',
    [PropertyType.Datetime]: 'string',
    [PropertyType.Email]: 'string',
    [PropertyType.Integer]: 'integer',
    [PropertyType.ModelReference]: 'string',
    [PropertyType.Number]: 'number',
    [PropertyType.Object]: 'object',
    [PropertyType.Text]: 'string',
    [PropertyType.UniqueId]: 'string',
  }
  const type = typeMap[property.getPropertyType() as PropertyType]
  if (!type) {
    throw new Error(`Unsupported property type: ${property.getPropertyType()}`)
  }
  const config = property.getConfig() as PropertyConfig<any>
  // @ts-ignore
  const desc = config?.description
  const enumVals = property.getChoices()

  const result: { type: string; description?: string; enum?: string[] } = {
    type,
    ...(desc ? { description: desc } : {}),
    ...(enumVals && enumVals.length > 0
      ? { enum: enumVals.map(x => `${x}`) }
      : {}),
  }
  return result
}

// Generate OpenAPI schema for a set of properties
export const generateOpenApiSchema = (
  properties: Record<string, any>,
  requiredFields: string[]
): OpenAPISchema => {
  const props = Object.entries(properties).reduce(
    (acc, [key, prop]) => {
      const mapped = mapPropertyToOpenApi(prop)
      const isRequired = requiredFields.includes(key)
      let schema: any = {
        type: mapped.type,
        ...(mapped.description ? { description: mapped.description } : {}),
        ...(mapped.enum ? { enum: mapped.enum } : {}),
      }
      if (!isRequired) {
        schema.nullable = true
      }
      return {
        ...acc,
        [key]: schema,
      }
    },
    {} as Record<string, any>
  )
  return {
    type: 'object',
    properties: props,
    required: requiredFields.length ? requiredFields : undefined,
  }
}

export const getOrmSearchSchema = (): OpenAPISchema => {
  return {
    type: 'object',
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
              required: ['type', 'key', 'value', 'valueType', 'equalitySymbol'],
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
    required: ['query'],
  }
}

export const getModelIdSchema = (): OpenAPISchema => {
  return {
    type: 'object',
    properties: { id: { type: 'string' } },
  }
}

export const getModelIdArraySchema = (): OpenAPISchema => {
  return {
    type: 'object',
    properties: { ids: { type: 'array' } },
    required: ['ids'],
  }
}

export const getModelSchema = (model: ModelType<any>): OpenAPISchema => {
  const def = model.getModelDefinition()
  const allProps = def.properties
  const requiredFields = Object.entries(allProps)
    // @ts-ignore
    .filter(([, prop]) => (prop.getConfig?.() as any)?.required)
    .map(([k]) => k)
  return generateOpenApiSchema(allProps, requiredFields)
}

// Main function: generate MCP tools for a model
export const generateMcpToolForModelOperation = (
  model: ModelType<any>,
  operation:
    | 'save'
    | 'retrieve'
    | 'delete'
    | 'search'
    | 'bulkInsert'
    | 'bulkDelete',
  opts?: { nameGenerator?: ToolNameGenerator }
): McpToolMeta => {
  const def = model.getModelDefinition()
  const nameGen = opts?.nameGenerator || defaultToolNameGenerator
  const fullSchema = getModelSchema(model)
  const idSchema: OpenAPISchema = getModelIdSchema()
  const idArraySchema: OpenAPISchema = getModelIdArraySchema()
  const querySchema: OpenAPISchema = getOrmSearchSchema()
  switch (operation) {
    case 'save':
      return {
        name: nameGen(model, 'save'),
        description: `Save (create or update) a ${def.pluralName} record`,
        inputSchema: fullSchema,
        outputSchema: fullSchema,
      }
    case 'retrieve':
      return {
        name: nameGen(model, 'retrieve'),
        description: `Retrieve a ${def.pluralName} record by ID`,
        inputSchema: idSchema,
        outputSchema: {
          oneOf: [fullSchema, { type: 'null' }],
        },
      }
    case 'delete':
      return {
        name: nameGen(model, 'delete'),
        description: `Delete a ${def.pluralName} record by ID`,
        inputSchema: idSchema,
        outputSchema: { type: 'null' },
      }
    case 'search':
      return {
        name: nameGen(model, 'search'),
        description: `Search for ${def.pluralName} records`,
        inputSchema: querySchema,
        outputSchema: {
          type: 'object',
          properties: {
            instances: { type: 'array' },
            page: { type: 'object' },
          },
          required: ['instances'],
        },
      }
    case 'bulkInsert':
      return {
        name: nameGen(model, 'bulkInsert'),
        description: `Bulk insert ${def.pluralName} records`,
        inputSchema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: fullSchema,
            },
          },
          required: ['items'],
        },
        outputSchema: { type: 'null' },
      }
    case 'bulkDelete':
      return {
        name: nameGen(model, 'bulkDelete'),
        description: `Bulk delete ${def.pluralName} records by IDs`,
        inputSchema: idArraySchema,
        outputSchema: { type: 'null' },
      }
    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}

export const generateMcpToolsForModel = (
  model: ModelType<any>,
  opts?: { nameGenerator?: ToolNameGenerator }
): McpToolMeta[] => {
  const operations: (
    | 'save'
    | 'retrieve'
    | 'delete'
    | 'search'
    | 'bulkInsert'
    | 'bulkDelete'
  )[] = ['save', 'retrieve', 'delete', 'search', 'bulkInsert', 'bulkDelete']
  return operations.map(op => generateMcpToolForModelOperation(model, op, opts))
}
