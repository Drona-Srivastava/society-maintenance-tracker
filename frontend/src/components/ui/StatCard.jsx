export default function StatCard({
  label,
  value,
  icon: Icon,
  description,
  variant = "default",
}) {
  return (
    <div className={`stat-card stat-${variant}`}>
      <div className="stat-card-top">
        <span>{label}</span>

        <div className="stat-icon">
          <Icon size={19} />
        </div>
      </div>

      <strong>{value}</strong>

      {description && (
        <p>{description}</p>
      )}
    </div>
  );
}