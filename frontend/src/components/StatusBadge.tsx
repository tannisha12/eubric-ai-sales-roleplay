export type ConnectionStatus = "online" | "offline";

interface StatusBadgeProps {
  status?: ConnectionStatus;
}

export function StatusBadge({ status = "offline" }: StatusBadgeProps) {
  const isOnline = status === "online";

  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" />
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}
