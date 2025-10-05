import {
  ModelInstance,
  ModelType,
  PrimaryKeyType,
  DataDescription,
  DatastoreAdapter,
} from 'functional-models'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { createOAuth2Manager } from './oauth2'
import { McpToolMeta, DatastoreProviderConfig, ModelOperation } from './types'
import {
  defaultModelTypeGetter,
  generateMcpToolForModelOperation,
} from './libs'

const createTransport = (
  connection: { type: 'http' | 'sse'; url: string },
  auth?: { accessToken?: string; apiKey?: string }
): StreamableHTTPClientTransport | SSEClientTransport => {
  if (connection.type === 'http') {
    return new StreamableHTTPClientTransport(new URL(connection.url), {
      ...(auth?.accessToken
        ? {
            requestInit: {
              headers: { Authorization: `Bearer ${auth.accessToken}` },
            },
          }
        : {}),
      ...(auth?.apiKey
        ? { requestInit: { headers: { 'x-api-key': auth.apiKey } } }
        : {}),
    })
  }
  if (connection.type === 'sse') {
    return new SSEClientTransport(new URL(connection.url), {
      ...(auth?.accessToken
        ? {
            requestInit: {
              headers: { Authorization: `Bearer ${auth.accessToken}` },
            },
          }
        : {}),
      ...(auth?.apiKey
        ? { requestInit: { headers: { 'x-api-key': auth.apiKey } } }
        : {}),
    })
  }
  throw new Error(`Unsupported connection type: ${connection.type}`)
}

const datastoreProvider = (
  config: DatastoreProviderConfig
): DatastoreAdapter => {
  const modelTypeGetter = config.modelTypeGetter || defaultModelTypeGetter
  // eslint-disable-next-line functional/no-let
  let mcpClient: Client | undefined = undefined
  // eslint-disable-next-line functional/no-let
  let transport:
    | StreamableHTTPClientTransport
    | SSEClientTransport
    | undefined = undefined
  // eslint-disable-next-line functional/no-let
  let lastAccessToken: string | undefined = undefined

  // OAuth2 manager (if needed)
  const httpClient = config.httpClient || axios
  const oauth2Manager = config.oauth2
    ? createOAuth2Manager(config.oauth2, httpClient)
    : undefined

  // Connect and manage MCP client
  const ensureConnected = async (): Promise<void> => {
    const directOauthToken = config.credentials?.oauthToken
    const clientName = config.name || 'functional-models-orm-mcp'
    const clientVersion = config.version || '1.0.0'
    if (directOauthToken) {
      if (!mcpClient) {
        transport = createTransport(config.connection, {
          accessToken: directOauthToken,
        })
        mcpClient = new Client({ name: clientName, version: clientVersion })
        await mcpClient.connect(transport)
      }
      return
    }
    if (oauth2Manager) {
      const accessToken = await oauth2Manager.getAccessToken()
      if (!mcpClient || lastAccessToken !== accessToken) {
        if (mcpClient) {
          await mcpClient.close()
          // eslint-disable-next-line require-atomic-updates
          mcpClient = undefined
          transport = undefined
        }
        transport = createTransport(config.connection, { accessToken })
        // eslint-disable-next-line require-atomic-updates
        mcpClient = new Client({ name: clientName, version: clientVersion })
        await mcpClient.connect(transport)
        // eslint-disable-next-line require-atomic-updates
        lastAccessToken = accessToken
      }
      return
    }
    if (!mcpClient) {
      transport = createTransport(config.connection, {
        ...(config.credentials?.apiKey
          ? { apiKey: config.credentials.apiKey }
          : {}),
      })
      mcpClient = new Client({ name: clientName, version: clientVersion })
      await mcpClient.connect(transport)
    }
  }

  async function executeTool<TOutput = any, TInput = any>(
    tool: McpToolMeta,
    input: TInput,
    id?: string
  ) {
    id = id || uuidv4()
    await ensureConnected()
    if (!mcpClient) {
      throw new Error('MCP client is not connected')
    }
    const callToolProps = {
      id,
      name: tool.name,
      input,
      arguments: typeof input === 'object' && input !== null ? input : {},
    }
    const response = await mcpClient.callTool(callToolProps)
    if (response.isError) {
      const innerError =
        'error' in response ? { cause: response.error } : undefined
      throw new Error(`MCP call failed: ${response.error}`, innerError)
    }
    // @ts-ignore
    const actualData = JSON.parse(response.content[0].text)
    return actualData as TOutput
  }

  // CREATE (single)
  const save = async <T extends DataDescription>(
    instance: ModelInstance<T>
  ) => {
    const model = instance.getModel()
    const tool = generateMcpToolForModelOperation(
      model as any,
      ModelOperation.save
    )
    const input = await instance.toObj()
    return executeTool(tool, {
      modelType: modelTypeGetter(model as any),
      instance: input,
    })
  }

  // BULK INSERT
  const bulkInsert = async <T extends DataDescription>(
    model: any,
    instances: readonly ModelInstance<T>[]
  ) => {
    const tool = generateMcpToolForModelOperation(
      model as any,
      ModelOperation.bulkInsert
    )
    const input = {
      modelType: modelTypeGetter(model as any),
      items: await Promise.all(instances.map(i => i.toObj())),
    }
    await executeTool(tool, input)
    return
  }

  // RETRIEVE
  const retrieve = async (model: any, id: PrimaryKeyType) => {
    const tool = generateMcpToolForModelOperation(
      model as any,
      ModelOperation.retrieve
    )
    return executeTool(tool, { id, modelType: modelTypeGetter(model as any) })
  }

  // DELETE (single)
  const deleteObj = async <T extends DataDescription>(
    model: ModelType<T>,
    id: PrimaryKeyType
  ) => {
    const tool = generateMcpToolForModelOperation(
      model as any,
      ModelOperation.delete
    )
    await executeTool(tool, { id, modelType: modelTypeGetter(model as any) })
    return
  }

  // SEARCH
  const search = async <T extends DataDescription>(
    model: ModelType<T>,
    ormQuery: any
  ) => {
    const tool = generateMcpToolForModelOperation(
      model as any,
      ModelOperation.search
    )
    return executeTool(tool, {
      modelType: modelTypeGetter(model as any),
      query: ormQuery,
    })
  }

  // BULK DELETE
  const bulkDelete = async <T extends DataDescription>(
    model: ModelType<T>,
    ids: readonly PrimaryKeyType[]
  ) => {
    const tool = generateMcpToolForModelOperation(
      model as any,
      ModelOperation.bulkDelete
    )
    await executeTool(tool, { ids, modelType: modelTypeGetter(model as any) })
    return
  }

  return {
    save,
    retrieve,
    delete: deleteObj,
    search,
    bulkInsert,
    // @ts-ignore
    bulkDelete,
  }
}

export default datastoreProvider
