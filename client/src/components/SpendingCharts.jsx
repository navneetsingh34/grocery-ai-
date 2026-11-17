import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

const axis = { fontSize: 12, fill: '#5f6f66' };
const tooltipStyle = {
  borderRadius: 12,
  border: 'none',
  boxShadow: '0 8px 24px -8px rgb(18 32 26 / 0.25)',
  fontSize: 13,
};

export function CategoryChart({ data }) {
  if (!data?.length) {
    return <EmptyChart label="No category spending yet — upload a receipt." />;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4fb86a" />
              <stop offset="100%" stopColor="#1f8a3c" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4eae3" vertical={false} />
          <XAxis dataKey="category" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#effaf1' }} />
          <Bar dataKey="total" fill="url(#bar)" radius={[8, 8, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyChart({ data }) {
  if (!data?.length) {
    return <EmptyChart label="Monthly trends appear after parsed receipts." />;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f9e4a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2f9e4a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4eae3" vertical={false} />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#1f8a3c"
            strokeWidth={3}
            fill="url(#area)"
            dot={{ r: 4, fill: '#fff', stroke: '#1f8a3c', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-leaf-200 bg-leaf-50/40 px-4 text-center text-sm text-muted">
      {label}
    </div>
  );
}
