import { useEffect, useState } from 'react';
import { Users, Layers, Receipt, CreditCard, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StatCard } from '../components/StatCard';
import './Dashboard.css';

interface DashboardStats {
  totalUsers: number;
  totalGroups: number;
  totalExpenses: number;
  totalSettlements: number;
  totalAmount: number;
  newUsersThisWeek: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalGroups: 0,
    totalExpenses: 0,
    totalSettlements: 0,
    totalAmount: 0,
    newUsersThisWeek: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, groupsRes, expensesRes, settlementsRes, recentRes, newUsersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('trips').select('id', { count: 'exact', head: true }),
        supabase.from('expenses').select('id, amount'),
        supabase.from('settlements').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, display_name, email, created_at, avatar_url').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const totalAmount = expensesRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalGroups: groupsRes.count || 0,
        totalExpenses: expensesRes.data?.length || 0,
        totalSettlements: settlementsRes.count || 0,
        totalAmount,
        newUsersThisWeek: newUsersRes.count || 0,
      });

      setRecentUsers(recentRes.data || []);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your ExpenseX platform</p>
      </div>

      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2>Welcome back, Admin 👋</h2>
          <p>{stats.totalUsers} users • {stats.totalGroups} groups • ₹{stats.totalAmount.toLocaleString()} volume</p>
        </div>
        <div className="welcome-glow" />
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} change={`+${stats.newUsersThisWeek} this week`} color="var(--primary)" />
        <StatCard icon={Layers} label="Total Groups" value={stats.totalGroups} color="var(--secondary)" />
        <StatCard icon={Receipt} label="Total Expenses" value={stats.totalExpenses} color="var(--warning)" />
        <StatCard icon={CreditCard} label="Settlements" value={stats.totalSettlements} color="var(--success)" />
        <StatCard icon={TrendingUp} label="Total Volume" value={`₹${stats.totalAmount.toLocaleString()}`} color="#EC4899" />
        <StatCard icon={Activity} label="New This Week" value={stats.newUsersThisWeek} color="var(--primary)" />
      </div>

      {/* Recent Users */}
      <div className="section">
        <h2 className="section-title">Recent Signups</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{(user.display_name || user.email || '?')[0].toUpperCase()}</div>
                      <span>{user.display_name || 'No Name'}</span>
                    </div>
                  </td>
                  <td className="text-secondary">{user.email || '—'}</td>
                  <td className="text-tertiary">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr><td colSpan={3} className="empty-row">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
