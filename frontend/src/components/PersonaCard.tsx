export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Expert";

interface PersonaCardProps {
  buyerPersona?: string;
  difficulty?: DifficultyLevel;
  industry?: string;
  personality?: string;
  mood?: string;
}

const DIFFICULTY_CLASS: Record<DifficultyLevel, string> = {
  Easy: "pill--good",
  Medium: "pill--warning",
  Hard: "pill--critical",
  Expert: "pill--critical",
};

export function PersonaCard({
  buyerPersona = "Healthcare CTO",
  difficulty = "Medium",
  industry = "Healthcare",
  personality,
  mood,
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
        {personality && (
          <div className="persona-card__row">
            <dt>Personality</dt>
            <dd>{personality}</dd>
          </div>
        )}
        {mood && (
          <div className="persona-card__row">
            <dt>Mood</dt>
            <dd>{mood}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
