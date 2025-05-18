import { ModelType } from 'functional-models'

enum HttpMethod {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
  patch = 'patch',
}

type HttpClientInputs = {
  method: HttpMethod
  url: string
  data?: object
  headers?: object
}

type HttpClient = <T>(inputs: HttpClientInputs) => Promise<T>

enum DatastoreMethod {
  save,
  retrieve,
  delete,
  bulkInsert,
  search,
}

export type RestClientProviderConfig = Readonly<{
  baseUrl?: {
    default: string
    [namespace: string]: string
    // e.g. 'namespace/model': 'https://api.example.com/model'
  }
  credentials?:
    | { apiKey?: string; oauthToken?: string }
    | ((opts: {
        namespace: string
        modelName: string
      }) => Promise<Record<string, string>>)
  oauth2?: {
    tokenUrl: string
    clientId: string
    clientSecret: string
    // For future extensibility: audience?: string; extraParams?: Record<string, string>
  }
  mockMode?: boolean
  mockHandler?: (request: any) => Promise<any>
  beforeRequest?: (request: any) => Promise<any> | any
  afterResponse?: (response: any) => Promise<any> | any
  httpClient?: HttpClient // Optional custom http client (e.g., axios instance)
}>

export { HttpMethod, HttpClientInputs, HttpClient, DatastoreMethod }

export type McpToolMeta = {
  name: string
  description?: string
  inputSchema: object
  outputSchema?: object
}

export type DatastoreProviderConfig = {
  connection: { type: 'http' | 'sse'; url: string }
  oauth2?: OAuth2Config
  credentials?: { apiKey?: string; oauthToken?: string }
  httpClient?: HttpClient
  name?: string
  version?: string
}

export type ToolNameGenerator = (
  model: ModelType<any>,
  operation: string
) => string

export type OpenAPISchema = Readonly<{
  type: 'object'
  properties: Readonly<
    Record<
      string,
      {
        type: string
        description?: string
        enum?: Readonly<string[]>
      }
    >
  >
  required?: Readonly<string[]>
}>

export type OAuth2Config = {
  tokenUrl: string
  clientId: string
  clientSecret: string
  scopes: string[]
}
