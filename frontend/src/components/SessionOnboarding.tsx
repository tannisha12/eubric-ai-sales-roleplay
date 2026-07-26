const SKILLS_EVALUATED = ["Discovery", "Objection Handling", "Confidence", "Closing"];

interface SessionOnboardingProps {
  difficulty?: string;
}

export function SessionOnboarding({ difficulty = "Medium" }: SessionOnboardingProps) {
  return (
    <div className="card card--compact onboarding-card">
      <h3 className="card__title">Before You Start</h3>

      <p className="onboarding-card__goal">
        Practice a full discovery-to-close conversation with a realistic AI buyer persona.
      </p>

      <div className="onboarding-card__meta">
        <span className="badge">⏱ 5–10 min</span>
        <span className="badge">Difficulty: {difficulty}</span>
      </div>

      <div className="onboarding-card__skills">
        <span className="onboarding-card__skills-label">Skills evaluated</span>
        <div className="onboarding-card__chip-row">
          {SKILLS_EVALUATED.map((skill) => (
            <span className="badge badge--accent" key={skill}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      <ul className="onboarding-card__tips">
        <li>Open with discovery questions before pitching</li>
        <li>Handle objections naturally, don't get defensive</li>
        <li>Close with a clear, specific next step</li>
      </ul>
    </div>
  );
}
