import { DataDescription, JsonAble, ModelType } from 'functional-models'

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never }

export type XOR<T, U> = T | U extends object
  ? (T & Without<U, T>) | (U & Without<T, U>)
  : T | U

export enum HttpMethod {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
  patch = 'patch',
}

export type HttpClientInputs = {
  method: HttpMethod
  url: string
  data?: object
  headers?: object
}

export type HttpClient = <T>(inputs: HttpClientInputs) => Promise<{
  data: T
  status: number
  headers: Record<string, string>
}>

export enum DatastoreMethod {
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
  oauth2?: OAuth2Config
  mockMode?: boolean
  mockHandler?: (request: any) => Promise<any>
  beforeRequest?: (request: any) => Promise<any> | any
  afterResponse?: (response: any) => Promise<any> | any
  httpClient?: HttpClient // Optional custom http client (e.g., axios instance)
}>

export type McpToolMeta = {
  name: string
  description?: string
  inputSchema: object
  outputSchema?: object
}

export type HttpConnection = Readonly<{
  type: 'http'
  url: string
  headers?: Readonly<Record<string, string>>
  timeout?: number
  retry?: Readonly<{
    attempts: number
    backoff: number
  }>
}>

export type CliConnection = Readonly<{
  type: 'cli'
  path: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
}>

export type DatastoreProviderConfig = {
  connection: XOR<HttpConnection, CliConnection>
  oauth2?: OAuth2Config
  credentials?: { apiKey?: string; oauthToken?: string }
  httpClient?: HttpClient
  name?: string
  version?: string
  modelTypeGetter?: <T extends DataDescription>(model: ModelType<T>) => string
}

export enum ModelOperation {
  save = 'save',
  retrieve = 'retrieve',
  delete = 'delete',
  search = 'search',
  bulkInsert = 'bulkInsert',
  bulkDelete = 'bulkDelete',
}

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
  extraParams?: Record<string, JsonAble>
}
