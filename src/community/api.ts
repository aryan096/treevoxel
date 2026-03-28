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

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | JsonError;
  if (!response.ok) {
    const message = (data as JsonError).error;
    throw new Error(message || 'Request failed.');
  }
  return data as T;
}

export async function listApprovedCreations(): Promise<CommunityCreation[]> {
  const response = await fetch('/api/community/creations');
  const data = await parseJson<{ creations: CommunityCreation[] }>(response);
  return data.creations;
}

export async function submitCreation(payload: {
  creationName: string;
  authorName: string;
  snapshot: TreeSnapshot;
}): Promise<CommunityCreation> {
  const response = await fetch('/api/community/submissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson<{ submission: CommunityCreation }>(response);
  return data.submission;
}

export async function listReviewQueue(adminKey: string): Promise<CommunityCreation[]> {
  const response = await fetch('/api/community/review?status=pending', {
    headers: {
      'X-Admin-Key': adminKey,
    },
  });

  const data = await parseJson<{ submissions: CommunityCreation[] }>(response);
  return data.submissions;
}

export async function reviewCreation(
  id: string,
  action: 'approve' | 'reject',
  adminKey: string,
): Promise<CommunityCreation> {
  const response = await fetch(`/api/community/review/${id}/${action}`, {
    method: 'POST',
    headers: {
      'X-Admin-Key': adminKey,
    },
  });

  const data = await parseJson<{ submission: CommunityCreation }>(response);
  return data.submission;
}
