import type { PersonaConfig } from "../types/persona";

export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Expert";

interface PersonaCardProps {
  persona: PersonaConfig;
  difficulty?: DifficultyLevel;
}

const DIFFICULTY_CLASS: Record<DifficultyLevel, string> = {
  Easy: "pill--good",
  Medium: "pill--warning",
  Hard: "pill--critical",
  Expert: "pill--critical",
};

function initialsOf(name?: string, role?: string): string {
  const source = (name ?? role ?? "").trim();
  if (!source) {
    return "?";
  }
  const parts = source.split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
}

export function PersonaCard({ persona, difficulty = "Medium" }: PersonaCardProps) {
  const { name, role, industry, companyName, companySize } = persona;

  return (
    <div className="card persona-card">
      <h3 className="card__title">Buyer Persona</h3>

      <div className="persona-card__header">
        <div className="persona-card__avatar" aria-hidden="true">
          {initialsOf(name, role)}
        </div>
        <div className="persona-card__identity">
          <p className="persona-card__name">{name ?? role}</p>
          <p className="persona-card__role">
            {role}
            {companyName ? (
              <>
                {" · "}
                <em>{companyName}</em>
              </>
            ) : (
              ""
            )}
          </p>
        </div>
      </div>

      <div className="persona-card__badges">
        {industry && <span className="badge">{industry}</span>}
        {companySize && <span className="badge">{companySize}</span>}
        <span className={`pill ${DIFFICULTY_CLASS[difficulty]}`}>{difficulty}</span>
      </div>
    </div>
  );
}
