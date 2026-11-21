/** Erro devolvido pelas APIs internas, com a mensagem em português vinda do servidor. */
export class FetchError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[] | undefined>,
  ) {
    super(message)
  }
}

/**
 * `fetch` para as APIs internas: envia/recebe JSON e lança `FetchError`
 * com a mensagem do servidor quando a resposta não é 2xx.
 * Em 401 redirecciona para o login.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: Omit<RequestInit, 'body'> & { body?: unknown } = {},
): Promise<T> {
  const { body, headers, ...rest } = options

  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new FetchError(
      res.status,
      data?.error ?? 'Ocorreu um erro. Tente novamente.',
      data?.details,
    )
  }

  return data as T
}

/** Extrai uma mensagem legível de qualquer erro. */
export function errorMessage(err: unknown): string {
  if (err instanceof FetchError) {
    const first = err.details && Object.values(err.details).flat().find(Boolean)
    return first ? `${err.message} ${first}` : err.message
  }
  return 'Sem ligação ao servidor. Verifique a internet e tente novamente.'
}
