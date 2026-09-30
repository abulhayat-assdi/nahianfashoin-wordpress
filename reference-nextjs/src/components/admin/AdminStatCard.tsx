interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export default function AdminStatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`stat-card ${accent ? 'accent' : ''}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}
