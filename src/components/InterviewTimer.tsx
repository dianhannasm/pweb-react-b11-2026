
import { useEffect, useState } from "react";

interface InterviewTimerProps {
  onFinish?: () => void;
}

const timerOptions = [
  { label: "5 Menit", seconds: 5 * 60 },
  { label: "10 Menit", seconds: 10 * 60 },
  { label: "15 Menit", seconds: 15 * 60 },
  { label: "30 Menit", seconds: 30 * 60 },
];

export function InterviewTimer({ onFinish }: InterviewTimerProps) {
  const [duration, setDuration] = useState(10 * 60);
  const [remaining, setRemaining] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setIsRunning(false);
          onFinish?.();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, remaining, onFinish]);

  function handleDurationChange(seconds: number) {
    setDuration(seconds);
    setRemaining(seconds);
    setIsRunning(false);
  }

  function handleReset() {
    setRemaining(duration);
    setIsRunning(false);
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <section className="interview-timer">
      <h3>Interview Prep Timer</h3>
      <p>Latih kemampuan menjawab pertanyaan interview dengan fokus.</p>

      <div className="timer-options">
        {timerOptions.map((option) => (
          <button
            type="button"
            key={option.seconds}
            className={duration === option.seconds ? "active" : ""}
            onClick={() => handleDurationChange(option.seconds)}
            disabled={isRunning}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="timer-display">
        {String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </div>

      <div className="timer-actions">
        <button
          type="button"
          onClick={() => setIsRunning((current) => !current)}
          disabled={remaining === 0}
        >
          {isRunning ? "Jeda" : "Mulai"}
        </button>

        <button type="button" onClick={handleReset}>
          Reset
        </button>
      </div>

      {remaining === 0 && (
        <p className="timer-finished">
          Waktu latihan selesai! Semangat interview-nya.
        </p>
      )}
    </section>
  );
}
