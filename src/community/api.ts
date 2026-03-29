import type { TreeSnapshot } from '../core/types';

export type CommunityCreation = {
  id: string;
  creationName: string;
  authorName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt: string | null;
  snapshot: TreeSnapshot;
};

type JsonError = {
  error?: string;
};

const REQUEST_TIMEOUT_MS = 10000;

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const raw = await response.text();
  let data: T | JsonError = {} as T;

  if (raw) {
    if (!contentType.includes('application/json')) {
      throw new Error('Community server returned an invalid response.');
    }

    try {
      data = JSON.parse(raw) as T | JsonError;
    } catch {
      throw new Error('Community server returned malformed JSON.');
    }
  }

  if (!response.ok) {
    const message = (data as JsonError).error;
    throw new Error(message || 'Request failed.');
  }
  return data as T;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return await parseJson<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Community server timed out. Check that `npm run dev:server` is running.');
    }

    if (error instanceof TypeError) {
      throw new Error('Community server is unavailable. Start `npm run dev:server` and try again.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function listApprovedCreations(): Promise<CommunityCreation[]> {
  const data = await requestJson<{ creations: CommunityCreation[] }>('/api/community/creations');
  return data.creations;
}

export async function submitCreation(payload: {
  creationName: string;
  authorName: string;
  snapshot: TreeSnapshot;
}): Promise<CommunityCreation> {
  const data = await requestJson<{ submission: CommunityCreation }>('/api/community/submissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return data.submission;
}

export async function listReviewQueue(adminKey: string): Promise<CommunityCreation[]> {
  const data = await requestJson<{ submissions: CommunityCreation[] }>('/api/community/review?status=pending', {
    headers: {
      'X-Admin-Key': adminKey,
    },
  });
  return data.submissions;
}

export async function reviewCreation(
  id: string,
  action: 'approve' | 'reject',
  adminKey: string,
): Promise<CommunityCreation> {
  const data = await requestJson<{ submission: CommunityCreation }>(`/api/community/review/${id}/${action}`, {
    method: 'POST',
    headers: {
      'X-Admin-Key': adminKey,
    },
  });
  return data.submission;
}
