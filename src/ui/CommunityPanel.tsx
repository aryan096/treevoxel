import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { listApprovedCreations, listReviewQueue, reviewCreation, submitCreation, type CommunityCreation } from '../community/api';
import type { BlockColors } from '../core/types';
import { useTreeStore } from '../store/treeStore';
import styles from './CommunityPanel.module.css';

const APPROVED_PAGE_SIZE = 5;
const SCROLLBAR_WIDTH = 7;
const PALETTE_PREVIEW_TYPES = ['log', 'branch', 'leaf'] as const;
type PalettePreviewType = (typeof PALETTE_PREVIEW_TYPES)[number];

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

const BLOCK_TYPE_LABELS: Record<PalettePreviewType, string> = {
  log: 'Log',
  branch: 'Branch',
  leaf: 'Leaf',
};

function PalettePreview({ colors }: { colors: Pick<BlockColors, PalettePreviewType> }) {
  return (
    <div className={styles.palette}>
      {PALETTE_PREVIEW_TYPES.map((type) => (
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
  const minecraftPalette = useTreeStore((state) => state.minecraftPalette);
  const textureSet = useTreeStore((state) => state.textureSet);
  const renderStyle = useTreeStore((state) => state.renderStyle);
  const loadSnapshot = useTreeStore((state) => state.loadSnapshot);

  const [creationName, setCreationName] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [approved, setApproved] = useState<CommunityCreation[]>([]);
  const [pending, setPending] = useState<CommunityCreation[]>([]);
  const [approvedPage, setApprovedPage] = useState(0);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isLoadingApproved, setIsLoadingApproved] = useState(true);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [approvedError, setApprovedError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [hasLoadedPending, setHasLoadedPending] = useState(false);
  const [previewedSubmissionIds, setPreviewedSubmissionIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoadingApproved(true);
      setApprovedError(null);

      try {
        const creations = await listApprovedCreations();
        if (!isMounted) return;
        setApproved(creations);
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

  useEffect(() => {
    if (!isAdminModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAdminModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminModalOpen]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(approved.length / APPROVED_PAGE_SIZE) - 1);
    setApprovedPage((current) => Math.min(current, lastPage));
  }, [approved.length]);

  const refreshPending = async () => {
    if (!adminKey.trim()) {
      setPending([]);
      setReviewError(null);
      setReviewMessage(null);
      setHasLoadedPending(false);
      return;
    }

    setIsLoadingPending(true);
    setReviewError(null);
    setReviewMessage(null);
    try {
      const submissions = await listReviewQueue(adminKey.trim());
      setPending(submissions);
      setPreviewedSubmissionIds((current) => current.filter((id) => submissions.some((submission) => submission.id === id)));
      setHasLoadedPending(true);
      setReviewMessage(submissions.length === 0 ? null : `Loaded ${submissions.length} pending submission${submissions.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setPending([]);
      setReviewError(error instanceof Error ? error.message : 'Failed to load review queue.');
      setHasLoadedPending(false);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const handlePreviewSubmission = (creation: CommunityCreation) => {
    loadSnapshot(creation.snapshot);
    setPreviewedSubmissionIds((current) => (current.includes(creation.id) ? current : [...current, creation.id]));
    setReviewError(null);
    setReviewMessage(`Previewing "${creation.creationName}" in the editor.`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const submission = await submitCreation({
        creationName,
        authorName,
        snapshot: {
          presetId,
          params,
          blockColors,
          minecraftPalette,
          textureSet,
          renderStyle,
        },
      });

      setCreationName('');
      setAuthorName('');
      setSubmitMessage(`"${submission.creationName}" was submitted for review.`);
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
    setReviewMessage(null);
    try {
      const reviewed = await reviewCreation(id, action, adminKey.trim());
      await refreshPending();
      if (action === 'approve') {
        const creations = await listApprovedCreations();
        setApproved(creations);
      }
      setReviewMessage(`"${reviewed.creationName}" ${action === 'approve' ? 'approved' : 'denied'}.`);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Review action failed.');
    }
  };

  const totalApprovedPages = Math.max(1, Math.ceil(approved.length / APPROVED_PAGE_SIZE));
  const approvedPageStart = approvedPage * APPROVED_PAGE_SIZE;
  const paginatedApproved = approved.slice(approvedPageStart, approvedPageStart + APPROVED_PAGE_SIZE);

  return (
    <div className={styles.panelRoot}>
      <ScrollArea.Root
        className={styles.scrollRoot}
        style={{ '--scrollbar-width': `${SCROLLBAR_WIDTH}px` } as CSSProperties}
      >
        <ScrollArea.Viewport className={styles.scrollViewport}>
          <div className={styles.panel}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Current settings</p>
                  <h2 className={styles.title}>Submit to community</h2>
                </div>
                <p className={styles.copy}>Submit the preset, parameters, and block colors currently loaded in Settings for review.</p>
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

            <section className={styles.section}>
              <div className={styles.browserHeader}>
                <div>
                  <p className={styles.eyebrow}>Approved settings</p>
                  <h2 className={styles.title}>Load from community</h2>
                </div>
                <p className={styles.copy}>Load an approved preset configuration into the editor to inspect or continue working from it.</p>
              </div>

              <div className={styles.browserBody}>
                <div className={styles.list}>
                  {isLoadingApproved ? <p className={styles.empty}>Loading approved creations...</p> : null}
                  {approvedError ? <p className={styles.empty}>{approvedError}</p> : null}
                  {!isLoadingApproved && !approvedError && approved.length === 0 ? (
                    <p className={styles.empty}>No approved creations yet.</p>
                  ) : null}

                  {paginatedApproved.map((creation) => (
                    <article key={creation.id} className={styles.creationCard}>
                      <div className={styles.creationHeader}>
                        <div>
                          <p className={styles.creationName}>{creation.creationName}</p>
                          <p className={styles.creationMeta}>by {creation.authorName}</p>
                          <p className={styles.creationMeta}>Submitted {formatDate(creation.createdAt)}</p>
                        </div>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => loadSnapshot(creation.snapshot)}
                        >
                          Load settings
                        </button>
                      </div>
                      <div className={styles.creationSettings}>
                        <div className={styles.snapshotMeta}>
                          <span>Preset: {creation.snapshot.presetId}</span>
                          <span>Seed: {creation.snapshot.params.randomSeed}</span>
                          <span>Height: {creation.snapshot.params.height}</span>
                          <span>Block colors saved: 3</span>
                        </div>
                        <PalettePreview colors={creation.snapshot.blockColors} />
                      </div>
                    </article>
                  ))}

                  {!isLoadingApproved && !approvedError && approved.length > APPROVED_PAGE_SIZE ? (
                    <div className={styles.pagination}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => setApprovedPage((current) => Math.max(0, current - 1))}
                        disabled={approvedPage === 0}
                      >
                        Previous
                      </button>
                      <span className={styles.paginationLabel}>
                        Page {approvedPage + 1} of {totalApprovedPages}
                      </span>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => setApprovedPage((current) => Math.min(totalApprovedPages - 1, current + 1))}
                        disabled={approvedPage >= totalApprovedPages - 1}
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar className={styles.scrollbar} orientation="vertical">
          <ScrollArea.Thumb className={styles.thumb} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      <button
        type="button"
        className={styles.adminLauncher}
        aria-label="Open admin review"
        onClick={() => setIsAdminModalOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.adminLauncherIcon}>
          <path
            d="M12 2.5 19 5v5.56c0 4.3-2.97 8.26-7 9.44-4.03-1.18-7-5.14-7-9.44V5l7-2.5Z"
            fill="currentColor"
          />
          <path
            d="M10.7 12.94 9.1 11.34l-1.4 1.41 3 2.99 5.58-5.58-1.4-1.42-4.18 4.2Z"
            fill="#15130f"
          />
        </svg>
      </button>

      {isAdminModalOpen ? (
        <div
          className={styles.modalScrim}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsAdminModalOpen(false);
            }
          }}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-admin-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Review queue</p>
                <h2 id="community-admin-title" className={styles.title}>Admin approval</h2>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Close admin review"
                onClick={() => setIsAdminModalOpen(false)}
              >
                x
              </button>
            </div>

            <p className={styles.copy}>Enter an admin key to load pending submissions, then approve or deny each one.</p>

            <div className={styles.adminBar}>
              <input
                className={styles.input}
                type="password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                placeholder="Enter admin key"
              />
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void refreshPending()}
                disabled={isLoadingPending}
              >
                {isLoadingPending ? 'Loading...' : 'Load queue'}
              </button>
            </div>

            {reviewError ? <p className={styles.status}>{reviewError}</p> : null}
            {!reviewError && reviewMessage ? <p className={styles.status}>{reviewMessage}</p> : null}
            {!reviewError && pending.length === 0 && hasLoadedPending && !isLoadingPending ? (
              <p className={styles.empty}>No pending submissions.</p>
            ) : null}

            <div className={styles.reviewList}>
              {pending.map((creation) => (
                <div
                  key={creation.id}
                  className={`${styles.reviewCard} ${previewedSubmissionIds.includes(creation.id) ? styles.reviewCardPreviewed : ''}`}
                >
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
                  <p className={styles.reviewHint}>
                    {previewedSubmissionIds.includes(creation.id)
                      ? 'Preview loaded. You can now approve or deny this submission.'
                      : 'Preview this submission in the editor before approving or denying it.'}
                  </p>
                  <div className={styles.reviewActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => handlePreviewSubmission(creation)}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => void handleReview(creation.id, 'approve')}
                      disabled={!previewedSubmissionIds.includes(creation.id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => void handleReview(creation.id, 'reject')}
                      disabled={!previewedSubmissionIds.includes(creation.id)}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
