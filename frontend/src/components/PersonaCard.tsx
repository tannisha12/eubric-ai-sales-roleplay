export type DifficultyLevel = "Easy" | "Medium" | "Hard";

interface PersonaCardProps {
  buyerPersona?: string;
  difficulty?: DifficultyLevel;
  industry?: string;
}

const DIFFICULTY_CLASS: Record<DifficultyLevel, string> = {
  Easy: "pill--good",
  Medium: "pill--warning",
  Hard: "pill--critical",
};

export function PersonaCard({
  buyerPersona = "Healthcare CTO",
  difficulty = "Medium",
  industry = "Healthcare",
}: PersonaCardProps) {
  return (
    <div className="card persona-card">
      <h3 className="card__title">Buyer Persona</h3>
      <dl className="persona-card__details">
        <div className="persona-card__row">
          <dt>Persona</dt>
          <dd>{buyerPersona}</dd>
        </div>
        <div className="persona-card__row">
          <dt>Difficulty</dt>
          <dd>
            <span className={`pill ${DIFFICULTY_CLASS[difficulty]}`}>{difficulty}</span>
          </dd>
        </div>
        <div className="persona-card__row">
          <dt>Industry</dt>
          <dd>{industry}</dd>
        </div>
      </dl>
    </div>
  );
}
