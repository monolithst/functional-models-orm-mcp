import { assert } from 'chai'
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
  ArrayProperty,
  PrimaryKeyUuidProperty,
} from 'functional-models'
import { datastoreAdapter as memoryDatastore } from 'functional-models-orm-memory'
import { Model, createOrm } from 'functional-models'
import { createSchema } from 'zod-openapi'
import { z } from 'zod'

const _setup = () => {
  const datastoreAdapter = memoryDatastore.create()
  const orm = createOrm({ datastoreAdapter })
  const Test1Models = orm.Model({
    pluralName: 'Test1Models',
    namespace: 'functional-models-orm-memory',
    properties: {
      id: PrimaryKeyUuidProperty(),
      name: TextProperty({ required: true }),
    },
  })
  return {
    orm,
    Test1Models,
  }
}

describe('/src/libs.ts', () => {})
