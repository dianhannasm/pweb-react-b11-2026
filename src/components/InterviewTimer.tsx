import { useEffect, useState } from "react";

const QUESTION_DURATION_SECONDS = 120; // 02:00 per soal

interface InterviewQuestion {
  id: number;
  question: string;
  tip: string;
}

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 1,
    question: "Apa yang dimaksud dengan closure dalam JavaScript?",
    tip: "Jawab: fungsi yang mengakses variabel dari ruang lingkup tempat dibuatnya.",
  },
  {
    id: 2,
    question: "Apa perbedaan antara var, let, dan const di JavaScript?",
    tip: "Sebutkan: hoisting, scope, dan kemampuan reassignment (const tidak boleh diubah).",
  },
  {
    id: 3,
    question: "Apa itu asynchronous dan bagaimana bedanya dengan synchronous?",
    tip: "Jelaskan konsep I/O tak teratur, Promise, dan async/await.",
  },
  {
    id: 4,
    question:
      "Bagaimana cara mengatasi race condition dalam async code?",
    tip: "Masukkan: penggunaan Promise.all, pengelolaan kesalahan dengan try/catch, dan penghindaran await bertumpuk berlebihan.",
  },
  {
    id: 5,
    question: "Bagaimana cara melakukan efek samping (side effect) di dalam React yang benar?",
    tip: "Sebutkan: penggunaan useEffect, dependency array, dan return function sebagai cleanup.",
  },
  {
    id: 6,
    question: "Jelaskan cara membandingkan nilai dengan aman di JavaScript (==, ===, typeof, null-ish checks).",
    tip: "Standarkan: ===, selalu cek kekosongan dengan trim() di string, dan hindari == karena inkonsistensi tipe.",
  },
  {
    id: 7,
    question: "Bagaimana Anda mendesain komponen React yang dapat diganti ulang (reusable component) dengan baik?",
    tip: "Masukkan: props dengan default, kebijakan single responsibility, dan penggunaan children component.",
  },
];

export function InterviewTimer() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [remaining, setRemaining] = useState(QUESTION_DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const timer = window.setInterval(() => {
      setRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, remaining]);

  useEffect(() => {
    if (isRunning && remaining <= 0) {
      setIsRunning(false);
    }
  }, [isRunning, remaining]);

  function nextQuestion() {
    setIsRunning(false);
    setRemaining(QUESTION_DURATION_SECONDS);
    setQuestionIndex((index) => (index + 1) % INTERVIEW_QUESTIONS.length);
  }

  function resetQuestion() {
    setIsRunning(false);
    setRemaining(QUESTION_DURATION_SECONDS);
  }

  const currentQuestion = INTERVIEW_QUESTIONS[questionIndex];
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <section className="interview-timer" aria-label="Interview Prep Timer">
      <h3>Interview Prep Timer</h3>
      <p>Latih jawaban interview dengan fokus di setiap soal.</p>

      <div className="interview-question">
        <strong>{currentQuestion.question}</strong>
        <small>{currentQuestion.tip}</small>
      </div>

      <p className="interview-question-index">
        Pertanyaan {questionIndex + 1} dari {INTERVIEW_QUESTIONS.length}
      </p>

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
        <button type="button" onClick={resetQuestion}>
          Reset
        </button>
        <button type="button" onClick={nextQuestion}>
          Soal Berikutnya
        </button>
      </div>

      {remaining === 0 && (
        <p className="timer-finished">
          Waktu per soal habis! Tekan &ldquo;Soal Berikutnya&rdquo; untuk soal
          berikutnya.
        </p>
      )}
    </section>
  );
}
