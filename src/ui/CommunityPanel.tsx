import { useEffect, useState, type FormEvent } from 'react';
import { listApprovedCreations, listReviewQueue, reviewCreation, submitCreation, type CommunityCreation } from '../community/api';
import type { BlockType } from '../core/types';
import { useTreeStore } from '../store/treeStore';
import styles from './CommunityPanel.module.css';

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  log: 'Log',
  branch: 'Branch',
  leaf: 'Leaf',
};

function PalettePreview({ colors }: { colors: Record<BlockType, string> }) {
  return (
    <div className={styles.palette}>
      {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map((type) => (
        <div key={type} className={styles.paletteItem}>
          <span
            className={styles.paletteSwatch}
            style={{ backgroundColor: colors[type] }}
            aria-hidden="true"
          />
          <span>{BLOCK_TYPE_LABELS[type]} {colors[type].toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

export default function CommunityPanel() {
  const presetId = useTreeStore((state) => state.presetId);
  const params = useTreeStore((state) => state.params);
  const blockColors = useTreeStore((state) => state.blockColors);
  const loadSnapshot = useTreeStore((state) => state.loadSnapshot);

  const [creationName, setCreationName] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [approved, setApproved] = useState<CommunityCreation[]>([]);
  const [pending, setPending] = useState<CommunityCreation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoadingApproved, setIsLoadingApproved] = useState(true);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [approvedError, setApprovedError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const selectedCreation = approved.find((creation) => creation.id === selectedId) ?? approved[0] ?? null;

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoadingApproved(true);
      setApprovedError(null);

      try {
        const creations = await listApprovedCreations();
        if (!isMounted) return;
        setApproved(creations);
        setSelectedId((current) => current ?? creations[0]?.id ?? null);
      } catch (error) {
        if (!isMounted) return;
        setApprovedError(error instanceof Error ? error.message : 'Failed to load community creations.');
      } finally {
        if (isMounted) {
          setIsLoadingApproved(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshPending = async () => {
    if (!adminKey.trim()) {
      setPending([]);
      setReviewError(null);
      return;
    }

    setIsLoadingPending(true);
    setReviewError(null);
    try {
      const submissions = await listReviewQueue(adminKey.trim());
      setPending(submissions);
    } catch (error) {
      setPending([]);
      setReviewError(error instanceof Error ? error.message : 'Failed to load review queue.');
    } finally {
      setIsLoadingPending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await submitCreation({
        creationName,
        authorName,
        snapshot: {
          presetId,
          params,
          blockColors,
        },
      });

      setCreationName('');
      setAuthorName('');
      setSubmitMessage('Submission sent for review.');
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    if (!adminKey.trim()) {
      setReviewError('Enter an admin key first.');
      return;
    }

    setReviewError(null);
    try {
      await reviewCreation(id, action, adminKey.trim());
      await refreshPending();
      if (action === 'approve') {
        const creations = await listApprovedCreations();
        setApproved(creations);
        setSelectedId((current) => current ?? creations[0]?.id ?? null);
      }
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Review action failed.');
    }
  };

  return (
    <div className={styles.panel}>
      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Submit current settings</p>
            <h2 className={styles.title}>Share a creation</h2>
          </div>
          <p className={styles.copy}>Your current preset, parameters, and block colors are submitted for approval.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Creation name</span>
            <input
              className={styles.input}
              value={creationName}
              onChange={(event) => setCreationName(event.target.value)}
              maxLength={64}
              placeholder="Ancient cliff oak"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Your name</span>
            <input
              className={styles.input}
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              maxLength={48}
              placeholder="Builder name"
              required
            />
          </label>
          <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for review'}
          </button>
          {submitMessage ? <p className={styles.status}>{submitMessage}</p> : null}
        </form>
      </section>

      <section className={styles.browser}>
        <div className={styles.browserHeader}>
          <div>
            <p className={styles.eyebrow}>Approved builds</p>
            <h2 className={styles.title}>Community creations</h2>
          </div>
          <p className={styles.copy}>Load an approved setup instantly to inspect it in the viewer.</p>
        </div>

        <div className={styles.browserBody}>
          <div className={styles.list}>
            {isLoadingApproved ? <p className={styles.empty}>Loading approved creations...</p> : null}
            {approvedError ? <p className={styles.empty}>{approvedError}</p> : null}
            {!isLoadingApproved && !approvedError && approved.length === 0 ? (
              <p className={styles.empty}>No approved creations yet.</p>
            ) : null}

            {approved.map((creation) => (
              <button
                key={creation.id}
                type="button"
                className={`${styles.creationCard} ${selectedCreation?.id === creation.id ? styles.creationCardActive : ''}`}
                onClick={() => setSelectedId(creation.id)}
              >
                <span className={styles.creationName}>{creation.creationName}</span>
                <span className={styles.creationMeta}>by {creation.authorName}</span>
                <span className={styles.creationMeta}>{formatDate(creation.createdAt)}</span>
              </button>
            ))}
          </div>

          <div className={styles.preview}>
            {selectedCreation ? (
              <>
                <div className={styles.previewHeader}>
                  <div>
                    <p className={styles.previewName}>{selectedCreation.creationName}</p>
                    <p className={styles.previewMeta}>by {selectedCreation.authorName}</p>
                  </div>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => loadSnapshot(selectedCreation.snapshot)}
                  >
                    Load into editor
                  </button>
                </div>

                <div className={styles.snapshotMeta}>
                  <span>Preset: {selectedCreation.snapshot.presetId}</span>
                  <span>Seed: {selectedCreation.snapshot.params.randomSeed}</span>
                  <span>Height: {selectedCreation.snapshot.params.height}</span>
                  <span>Block colors saved: 3</span>
                </div>
                <PalettePreview colors={selectedCreation.snapshot.blockColors} />
              </>
            ) : (
              <p className={styles.empty}>Pick a creation to preview it here.</p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Review queue</p>
            <h2 className={styles.title}>Admin approval</h2>
          </div>
          <p className={styles.copy}>Use your admin key to review pending submissions and approve what should go public.</p>
        </div>

        <div className={styles.adminBar}>
          <input
            className={styles.input}
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Enter any admin key"
          />
          <button type="button" className={styles.secondaryButton} onClick={() => void refreshPending()}>
            {isLoadingPending ? 'Loading...' : 'Load queue'}
          </button>
        </div>

        {reviewError ? <p className={styles.status}>{reviewError}</p> : null}
        {!reviewError && pending.length === 0 && adminKey.trim() && !isLoadingPending ? (
          <p className={styles.empty}>No pending submissions.</p>
        ) : null}

        <div className={styles.reviewList}>
          {pending.map((creation) => (
            <div key={creation.id} className={styles.reviewCard}>
              <div className={styles.reviewSummary}>
                <div>
                  <p className={styles.creationName}>{creation.creationName}</p>
                  <p className={styles.creationMeta}>by {creation.authorName}</p>
                </div>
                <span className={styles.creationMeta}>{formatDate(creation.createdAt)}</span>
              </div>
              <div className={styles.snapshotMeta}>
                <span>Preset: {creation.snapshot.presetId}</span>
                <span>Seed: {creation.snapshot.params.randomSeed}</span>
                <span>Height: {creation.snapshot.params.height}</span>
              </div>
              <PalettePreview colors={creation.snapshot.blockColors} />
              <div className={styles.reviewActions}>
                <button type="button" className={styles.primaryButton} onClick={() => void handleReview(creation.id, 'approve')}>
                  Approve
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => void handleReview(creation.id, 'reject')}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
