import { expect } from 'chai'
import {
  TextProperty,
  IntegerProperty,
  BooleanProperty,
  DateProperty,
  DatetimeProperty,
  EmailProperty,
  ModelReferenceProperty,
  NumberProperty,
  ObjectProperty,
} from 'functional-models'
import sinon from 'sinon'
import {
  defaultToolNameGenerator,
  mapPropertyToOpenApi,
  generateOpenApiSchema,
  generateMcpToolForModelOperation,
  generateMcpToolsForModel,
} from '../../src/libs'

describe('/src/libs.ts', () => {
  const mockModel = {
    getModelDefinition: () => ({
      namespace: 'Test',
      pluralName: 'Tests',
      properties: {
        name: TextProperty({ required: true, description: 'Name' }),
        age: IntegerProperty({}),
      },
    }),
  }

  it('should generate the correct tool name with defaultToolNameGenerator', () => {
    expect(defaultToolNameGenerator(mockModel as any, 'save')).to.equal(
      'test_tests_save'
    )
  })

  it('should map TextProperty to OpenAPI schema', () => {
    const prop = TextProperty({ description: 'desc' })
    expect(mapPropertyToOpenApi(prop)).to.deep.equal({
      type: 'string',
      description: 'desc',
    })
  })

  it('should map IntegerProperty to OpenAPI schema', () => {
    const prop = IntegerProperty({})
    expect(mapPropertyToOpenApi(prop)).to.deep.equal({ type: 'integer' })
  })

  it('should map BooleanProperty to OpenAPI schema', () => {
    const prop = BooleanProperty({})
    expect(mapPropertyToOpenApi(prop)).to.deep.equal({ type: 'boolean' })
  })

  it('should map DateProperty to OpenAPI schema', () => {
    const prop = DateProperty({})
    expect(mapPropertyToOpenApi(prop)).to.deep.equal({ type: 'string' })
  })

  it('should map DatetimeProperty to OpenAPI schema', () => {
    const prop = DatetimeProperty({})
    expect(mapPropertyToOpenApi(prop)).to.deep.equal({ type: 'string' })
  })

  it('should map EmailProperty to OpenAPI schema', () => {
    const prop = EmailProperty({})
    expect(mapPropertyToOpenApi(prop)).to.deep.equal({ type: 'string' })
  })

  it('should map ModelReferenceProperty to OpenAPI schema', () => {
    // @ts-ignore
    const prop = ModelReferenceProperty(() => {}, {})
    expect(mapPropertyToOpenApi(prop)).to.deep.equal({ type: 'string' })
  })

  it('should map NumberProperty to OpenAPI schema', () => {
    const prop = NumberProperty({})
    expect(mapPropertyToOpenApi(prop)).to.deep.equal({ type: 'number' })
  })

  it('should map ObjectProperty to OpenAPI schema', () => {
    const prop = ObjectProperty({})
    expect(mapPropertyToOpenApi(prop)).to.deep.equal({ type: 'object' })
  })

  it('should generate an OpenAPI schema with generateOpenApiSchema', () => {
    const props = {
      name: TextProperty({ required: true }),
      age: IntegerProperty({}),
    }
    const schema = generateOpenApiSchema(props, ['name'])
    expect(schema).to.have.nested.property('properties.name.type', 'string')
    expect(schema).to.have.nested.property('properties.age.type', 'integer')
    expect(schema.required).to.include('name')
  })

  it('should return correct tool meta with generateMcpToolForModelOperation', () => {
    const meta = generateMcpToolForModelOperation(mockModel as any, 'save')
    expect(meta).to.have.property('name', 'test_tests_save')
    expect(meta).to.have.property('inputSchema')
    expect(meta).to.have.property('outputSchema')
  })

  it('should return all tool metas with generateMcpToolsForModel', () => {
    const metas = generateMcpToolsForModel(mockModel as any)
    expect(metas).to.be.an('array')
    expect(metas.length).to.be.greaterThan(0)
    expect(metas[0]).to.have.property('name')
  })
})
