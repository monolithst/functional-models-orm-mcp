'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const chai_1 = require('chai')
const lodash_1 = require('lodash')
const datastoreProvider_1 = __importDefault(
  require('../../src/datastoreProvider')
)
const functional_models_1 = require('functional-models')
const cucumber_1 = require('@cucumber/cucumber')
const sinon_1 = __importDefault(require('sinon'))
const mockHttpProvider = () => {
  const stub = sinon_1.default.stub()
  stub.resolves({})
  return stub
}
const DATA = {
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
const TestModel = (0, functional_models_1.BaseModel)('TestModel', {
  properties: {
    name: (0, functional_models_1.TextProperty)(),
  },
})
;(0, cucumber_1.Given)('we create a mock http provider', function () {
  this.httpProvider = mockHttpProvider()
})
;(0, cucumber_1.Given)(
  'we use a datastoreProvider with the standard functions and httpProvider',
  function () {
    this.datastoreProvider = (0, datastoreProvider_1.default)({
      httpProvider: this.httpProvider,
    })
  }
)
;(0, cucumber_1.When)(
  'we create an instance of TestModel with {word} data',
  function (key) {
    this.modelInstance = TestModel.create(DATA[key]())
  }
)
;(0, cucumber_1.When)(
  'we call {string} on the datastoreProvider with the model',
  function (path) {
    return __awaiter(this, void 0, void 0, function* () {
      this.results = yield (0, lodash_1.invoke)(
        this.datastoreProvider,
        path,
        this.modelInstance
      )
    })
  }
)
;(0, cucumber_1.When)(
  'we call {string} on the datastoreProvider with {word}',
  function (path, key) {
    return __awaiter(this, void 0, void 0, function* () {
      const data = DATA[key]()
      this.results = yield (0, lodash_1.invoke)(
        this.datastoreProvider,
        path,
        ...data
      )
    })
  }
)
;(0, cucumber_1.Then)(
  'the http information passed to the httpProvider matches {word}',
  function (key) {
    const expected = DATA[key]()
    const actual = this.httpProvider.getCall(0).args[0]
    chai_1.assert.deepEqual(actual, expected)
  }
)
//# sourceMappingURL=steps.js.map
