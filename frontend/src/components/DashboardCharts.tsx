import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const usageData = [
  { name: 'Mon', requests: 120, tokens: 45000 },
  { name: 'Tue', requests: 180, tokens: 62000 },
  { name: 'Wed', requests: 220, tokens: 78000 },
  { name: 'Thu', requests: 190, tokens: 68000 },
  { name: 'Fri', requests: 250, tokens: 89000 },
  { name: 'Sat', requests: 90, tokens: 32000 },
  { name: 'Sun', requests: 60, tokens: 21000 },
];

const planData = [
  { name: 'Solo CDE ($15)', value: 12 },
  { name: 'Team Starter ($25)', value: 8 },
  { name: 'Team Pro ($40)', value: 5 },
  { name: 'Team Scale ($60)', value: 2 },
];

const COLORS = ['#e94560', '#00d2ff', '#ffbe0b', '#ff006e'];

const DashboardCharts: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
      {/* Usage Bar Chart */}
      <div style={{ border: '3px solid #2a2a4a', background: '#16213e', padding: '24px', boxShadow: '4px 4px 0px 0px #e94560' }}>
        <h3 style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', color: '#00d2ff', fontSize: '1rem' }}>
          Weekly API Usage
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={usageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
            <XAxis dataKey="name" stroke="#a0a0a0" fontFamily="Fira Code" fontSize={12} />
            <YAxis stroke="#a0a0a0" fontFamily="Fira Code" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: '#16213e',
                border: '2px solid #e94560',
                fontFamily: 'Fira Code',
                color: '#f5f5f5',
              }}
            />
            <Legend wrapperStyle={{ fontFamily: 'Fira Code', fontSize: 12 }} />
            <Bar dataKey="requests" fill="#e94560" name="Requests" />
            <Bar dataKey="tokens" fill="#00d2ff" name="Tokens" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Plan Distribution Pie Chart */}
      <div style={{ border: '3px solid #2a2a4a', background: '#16213e', padding: '24px', boxShadow: '4px 4px 0px 0px #e94560' }}>
        <h3 style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', color: '#00d2ff', fontSize: '1rem' }}>
          Plan Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={planData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={{ stroke: '#a0a0a0' }}
            >
              {planData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#16213e',
                border: '2px solid #e94560',
                fontFamily: 'Fira Code',
                color: '#f5f5f5',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
