import type { CloudPersistenceNotice } from "../lib/supabase/cloudPersistence";

type PersistenceNoticeProps = {
  notice: CloudPersistenceNotice;
  onPrimary?: () => void;
  onSecondary?: () => void;
};

export default function PersistenceNotice({
  notice,
  onPrimary,
  onSecondary,
}: PersistenceNoticeProps) {
  return (
    <div
      className={`persistence-notice persistence-notice--${notice.tone}`}
      role={notice.tone === "pending" ? "status" : "alert"}
    >
      <p>{notice.message}</p>
      {(notice.primaryLabel || notice.secondaryLabel) && (
        <div className="persistence-notice__actions">
          {notice.primaryLabel && (
            <button
              type="button"
              className="persistence-notice__button"
              onClick={onPrimary}
            >
              {notice.primaryLabel}
            </button>
          )}
          {notice.secondaryLabel && (
            <button
              type="button"
              className="persistence-notice__button persistence-notice__button--secondary"
              onClick={onSecondary}
            >
              {notice.secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
