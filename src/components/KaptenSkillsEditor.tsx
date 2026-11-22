import { useState } from "react";

interface KaptenSkillsEditorProps {
  skills: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
}

const MIN_SKILLS = 3;

export function KaptenSkillsEditor({
  skills,
  onChange,
}: KaptenSkillsEditorProps) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");

  const normalizedSkills = skills.map((skill) =>
    skill.trim().toLowerCase(),
  );

  function isDuplicate(value: string): boolean {
    return normalizedSkills.includes(value.trim().toLowerCase());
  }

  function addSkill() {
    const trimmed = input.trim();

    if (!trimmed) {
      setFeedback("Skill tidak boleh kosong.");
      return;
    }

    if (isDuplicate(trimmed)) {
      setFeedback("Skill ini sudah ada — duplikat tidak disimpan.");
      return;
    }

    onChange((current) => [...current, trimmed]);
    setInput("");
    setFeedback("");
  }

  function removeSkill(index: number) {
    if (skills.length <= MIN_SKILLS) {
      setFeedback(
        "Minimal 3 skill wajib dimiliki agar Skill Match tetap berjalan.",
      );
      return;
    }

    onChange((current) => current.filter((_, i) => i !== index));
    setFeedback("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  }

  return (
    <section className="kapten-skills-editor">
      <h2>Skill Kapten</h2>
      <p>
        Skill ini dipakai untuk menghitung Skill Match di lowongan.
      </p>

      <ul className="kapten-skills-list">
        {skills.map((skill, index) => (
          <li className="kapten-skill-item" key={`${skill}-${index}`}>
            <span className="kapten-skill-name">{skill}</span>
            <button
              type="button"
              className="kapten-skill-remove"
              aria-label={`Hapus skill ${skill}`}
              onClick={() => removeSkill(index)}
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>

      <div className="kapten-skills-add">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tambah skill baru..."
          aria-label="Tambah skill Kapten"
        />
        <button type="button" onClick={addSkill}>
          Tambah Skill
        </button>
      </div>

      {feedback && (
        <p className="kapten-skills-feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  );
}
