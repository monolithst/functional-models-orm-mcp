import { assert } from 'chai'
import { invoke } from 'lodash'
import datastoreProvider from '../../src/datastoreProvider'
import { TextProperty, BaseModel } from 'functional-models'
import { Given, When, Then } from '@cucumber/cucumber'
import sinon from 'sinon'

const mockHttpProvider = () => {
  const stub = sinon.stub()
  stub.resolves({})
  return stub
}

const DATA: { [s: string]: () => any } = {
  TEST_1_MODEL: () => ({
    id: 'my-id',
    name: 'my-name',
  }),
  TEST_1_MODEL_RESULTS: () => ({
    method: 'put',
    url: '/api/test-model/my-id',
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      id: 'my-id',
      name: 'my-name',
    },
  }),
  TEST_2: () => [TestModel, 'my-id'],
  TEST_2_MODEL_RESULTS: () => ({
    method: 'get',
    url: '/api/test-model/my-id',
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  TEST_3_MODEL: () => ({
    id: 'my-delete-id',
    name: 'my-name',
  }),
  TEST_3_MODEL_RESULTS: () => ({
    method: 'delete',
    url: '/api/test-model/my-delete-id',
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  TEST_4: () => [TestModel, { dummy: 'query' }],
  TEST_4_MODEL_RESULTS: () => ({
    method: 'post',
    url: '/api/test-model',
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      dummy: 'query',
    },
  }),
  TEST_5: () => [
    TestModel,
    [
      TestModel.create({
        id: '1',
        name: 'name-1',
      }),
      TestModel.create({
        id: '2',
        name: 'name-2',
      }),
    ],
  ],
  TEST_5_MODEL_RESULTS: () => ({
    method: 'post',
    url: '/api/test-model/insert',
    headers: {
      'Content-Type': 'application/json',
    },
    data: [
      {
        id: '1',
        name: 'name-1',
      },
      {
        id: '2',
        name: 'name-2',
      },
    ],
  }),
}

type TestModelType = {
  name: string
}

const TestModel = BaseModel<TestModelType>('TestModel', {
  properties: {
    name: TextProperty(),
  },
})

Given('we create a mock http provider', function () {
  this.httpProvider = mockHttpProvider()
})

Given(
  'we use a datastoreProvider with the standard functions and httpProvider',
  function () {
    this.datastoreProvider = datastoreProvider({
      httpProvider: this.httpProvider,
    })
  }
)

When('we create an instance of TestModel with {word} data', function (key) {
  this.modelInstance = TestModel.create(DATA[key]())
})

When(
  'we call {string} on the datastoreProvider with the model',
  async function (path) {
    this.results = await invoke(
      this.datastoreProvider,
      path,
      this.modelInstance
    )
  }
)

When(
  'we call {string} on the datastoreProvider with {word}',
  async function (path, key) {
    const data = DATA[key]()
    this.results = await invoke(this.datastoreProvider, path, ...data)
  }
)

Then(
  'the http information passed to the httpProvider matches {word}',
  function (key) {
    const expected = DATA[key]()
    const actual = this.httpProvider.getCall(0).args[0]
    assert.deepEqual(actual, expected)
  }
)
