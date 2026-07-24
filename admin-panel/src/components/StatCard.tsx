import type { LucideIcon } from 'lucide-react';
import './StatCard.css';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  color?: string;
}

export function StatCard({ icon: Icon, label, value, change, color = 'var(--primary)' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}20` }}>
        <Icon size={22} color={color} />
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
      {change && (
        <span className={`stat-change ${change.startsWith('+') ? 'positive' : 'negative'}`}>
          {change}
        </span>
      )}
    </div>
  );
}
