import { useEffect, useRef, useState } from "react";
import type { Application } from "../types/application";

interface UndoToastProps {
  deletedApp: Application | null;
  onUndo: () => void;
  onExpire: () => void;
}

const UNDO_DURATION_MS = 5000;

export function UndoToast({ deletedApp, onUndo, onExpire }: UndoToastProps) {
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [trackedId, setTrackedId] = useState<string | null>(null);

  const currentId = deletedApp?.id ?? null;
  if (currentId !== trackedId) {
    setTrackedId(currentId);
    setSecondsLeft(5);
  }

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!deletedApp) {
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      onExpire();
    }, UNDO_DURATION_MS);

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [deletedApp, onExpire]);

  if (!deletedApp) {
    return null;
  }

  function handleUndoClick() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onUndo();
  }

  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span>
        Lamaran <strong>{deletedApp.company}</strong> telah dihapus.
      </span>
      <button
        type="button"
        className="undo-button"
        onClick={handleUndoClick}
      >
        Undo ({secondsLeft}d)
      </button>
    </div>
  );
}
