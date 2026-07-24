import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';
import './Dashboard.css';

interface CategoryData {
  name: string;
  amount: number;
  count: number;
}

interface MonthlyData {
  month: string;
  users: number;
}

const COLORS = ['#5B8CFF', '#7B61FF', '#35D07F', '#FFB648', '#FF6B7A', '#EC4899', '#06B6D4', '#F59E0B'];

export function Analytics() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [groupTypes, setGroupTypes] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Category breakdown
      const { data: expenses } = await supabase.from('expenses').select('category, amount');
      if (expenses) {
        const catMap: Record<string, { amount: number; count: number }> = {};
        expenses.forEach((e) => {
          const cat = e.category || 'Other';
          if (!catMap[cat]) catMap[cat] = { amount: 0, count: 0 };
          catMap[cat].amount += Number(e.amount);
          catMap[cat].count += 1;
        });
        const catArr = Object.entries(catMap)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 8);
        setCategories(catArr);
      }

      // Monthly signups
      const { data: profiles } = await supabase.from('profiles').select('created_at');
      if (profiles) {
        const monthMap: Record<string, number> = {};
        profiles.forEach((p) => {
          const month = new Date(p.created_at).toLocaleDateString('en', { year: '2-digit', month: 'short' });
          monthMap[month] = (monthMap[month] || 0) + 1;
        });
        const monthArr = Object.entries(monthMap)
          .map(([month, users]) => ({ month, users }))
          .slice(-6);
        setMonthly(monthArr);
      }

      // Group types
      const { data: groups } = await supabase.from('trips').select('group_type');
      if (groups) {
        const typeMap: Record<string, number> = {};
        groups.forEach((g) => {
          const type = g.group_type || 'Other';
          typeMap[type] = (typeMap[type] || 0) + 1;
        });
        setGroupTypes(Object.entries(typeMap).map(([name, value]) => ({ name, value })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Spending patterns and user growth</p>
      </div>

      {/* Monthly Signups Chart */}
      <div className="section">
        <h2 className="section-title">Monthly Signups</h2>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="users" fill="#5B8CFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="section">
        <h2 className="section-title">Top Expense Categories</h2>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="var(--text-tertiary)" fontSize={12} width={90} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
              />
              <Bar dataKey="amount" fill="#7B61FF" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Group Types Pie */}
      <div className="section">
        <h2 className="section-title">Group Types</h2>
        <div className="chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {groupTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={groupTypes} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {groupTypes.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-tertiary)' }}>No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
