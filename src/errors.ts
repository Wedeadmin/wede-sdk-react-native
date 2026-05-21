export class WedeError extends Error {
  constructor(message: string, public readonly code: string, public readonly status?: number) {
    super(message)
    this.name = 'WedeError'
  }
}

export class WedeAuthError extends WedeError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 'auth_error', 401)
    this.name = 'WedeAuthError'
  }
}

export class WedeNetworkError extends WedeError {
  constructor(message = 'Network request failed') {
    super(message, 'network_error')
    this.name = 'WedeNetworkError'
  }
}
