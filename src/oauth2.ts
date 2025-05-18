import { HttpClient, HttpMethod, OAuth2Config } from './types'

const TOKEN_EXPIRY_BUFFER_MS = 60000
const MS_PER_SECOND = 1000
const DEFAULT_EXPIRY_SECONDS = 3600
const HTTP_401 = 401

export type OAuth2Manager = {
  getAccessToken: () => Promise<string>
  handle401AndRetry: <T>(fn: () => Promise<T>) => Promise<T>
}

export const createOAuth2Manager = (
  config: OAuth2Config,
  httpClient: HttpClient
): OAuth2Manager => {
  // Use closure state, but only via functional updates
  // eslint-disable-next-line functional/no-let
  let state = {
    accessToken: null as string | null,
    expiresAt: null as number | null,
    isRefreshing: false,
    refreshPromise: null as Promise<string> | null,
  }

  const getToken = async (): Promise<string> => {
    if (
      state.accessToken &&
      state.expiresAt &&
      Date.now() < state.expiresAt - TOKEN_EXPIRY_BUFFER_MS
    ) {
      return state.accessToken
    }
    if (state.isRefreshing && state.refreshPromise) {
      const token = await state.refreshPromise
      if (!token) {
        throw new Error('OAuth2: Token refresh failed')
      }
      return token
    }
    state = { ...state, isRefreshing: true }
    const refreshPromise = (async () => {
      const data = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: config.scopes.join(' '),
      })
      const response = await httpClient<any>({
        method: HttpMethod.post,
        url: config.tokenUrl,
        data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      if (!response.data.access_token) {
        throw new Error('OAuth2: No access_token in response')
      }
      const expiresIn = response.data.expires_in
        ? response.data.expires_in * MS_PER_SECOND
        : DEFAULT_EXPIRY_SECONDS * MS_PER_SECOND
      const newState = {
        ...state,
        accessToken: response.data.access_token,
        expiresAt: Date.now() + expiresIn,
        isRefreshing: false,
        refreshPromise: null,
      }
      state = newState
      return response.data.access_token
    })()
    state = { ...state, refreshPromise }
    const token = await refreshPromise
    if (!token) {
      throw new Error('OAuth2: Token acquisition failed')
    }
    return token
  }

  const getAccessToken = async (): Promise<string> => {
    const token = await getToken()
    if (!token) {
      throw new Error('OAuth2: getAccessToken returned null')
    }
    return token
  }

  // Retry logic for 401
  const handle401AndRetry = async <T>(fn: () => Promise<T>): Promise<T> =>
    fn().catch(async (err: any) => {
      if (err && err.response && err.response.status === HTTP_401) {
        // Force refresh
        state = { ...state, accessToken: null, expiresAt: null }
        await getToken()
        return fn()
      }
      throw err
    })

  return {
    getAccessToken,
    handle401AndRetry,
  }
}
