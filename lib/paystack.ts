import 'server-only';

const API_URL = 'https://api.paystack.co';

/** A hung Paystack call would hold the Server Action (and the shopper) until the platform kills it */
export const PAYSTACK_TIMEOUT_MS = 10_000;

/** Missing or non-test key: card payments are switched off rather than risking real charges */
export class PaystackConfigError extends Error {}

/** Paystack answered with an error (its message is safe to inspect, not to show verbatim) */
export class PaystackApiError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number
  ) {
    super(message);
  }
}

const secretKey = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new PaystackConfigError('PAYSTACK_SECRET_KEY is not set');
  if (!key.startsWith('sk_test_')) {
    throw new PaystackConfigError('Only Paystack test keys (sk_test_…) are allowed');
  }
  return key;
};

export const isCardPaymentConfigured = () => {
  try {
    secretKey();
    return true;
  } catch {
    return false;
  }
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const key = secretKey();
  // setTimeout + AbortController rather than AbortSignal.timeout, so tests can fake the clock
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAYSTACK_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) throw new PaystackApiError('Paystack request timed out', 504);
    throw error;
  } finally {
    clearTimeout(timer);
  }
  const body = (await response.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: T;
  };
  if (!response.ok || !body.status || !body.data) {
    throw new PaystackApiError(body.message ?? `Paystack request failed`, response.status);
  }
  return body.data;
};

export type InitializeParams = {
  email: string;
  /** In the currency's subunit (kobo for NGN) */
  amount: number;
  currency: 'NGN';
  reference: string;
  metadata: Record<string, unknown>;
};

export type VerifiedTransaction = {
  reference: string;
  /** e.g. success, failed, abandoned, ongoing, pending */
  status: string;
  amount: number;
  currency: string;
  metadata: unknown;
};

export type PaystackClient = {
  initialize: (params: InitializeParams) => Promise<{ accessCode: string; reference: string }>;
  verify: (reference: string) => Promise<VerifiedTransaction>;
};

export const paystack: PaystackClient = {
  initialize: async ({ email, amount, currency, reference, metadata }) => {
    const data = await request<{ access_code: string; reference: string }>(
      '/transaction/initialize',
      {
        method: 'POST',
        body: JSON.stringify({ email, amount, currency, reference, metadata, channels: ['card'] }),
      }
    );
    return { accessCode: data.access_code, reference: data.reference };
  },

  verify: async (reference) => {
    const data = await request<VerifiedTransaction>(
      `/transaction/verify/${encodeURIComponent(reference)}`
    );
    return {
      reference: data.reference,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      metadata: data.metadata,
    };
  },
};
