import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { severityColor, titleCase, formatNumber } from "../lib/format";

export default function SeverityDonut({ severityCounts }) {
  const data = Object.entries(severityCounts || {}).map(([name, value]) => ({ name, value }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="chart-panel">
      <div className="panel-label" style={{ marginBottom: 16 }}>Severity breakdown</div>
      {total === 0 ? (
        <div className="chart-empty">No events to summarize.</div>
      ) : (
        <div className="donut-row">
          <div style={{ width: 120, height: 120, flexShrink: 0 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={38} outerRadius={56} stroke="#0F1622" strokeWidth={2}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={severityColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#131B2A", border: "1px solid #1B2536", borderRadius: 2, fontSize: 12 }}
                  formatter={(value, name) => [formatNumber(value), titleCase(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="donut-legend">
            {data
              .sort((a, b) => b.value - a.value)
              .map((d) => (
                <li key={d.name} className="donut-legend-item">
                  <span className="donut-legend-label">
                    <span className="donut-legend-dot" style={{ color: severityColor(d.name) }} />
                    {titleCase(d.name)}
                  </span>
                  <span className="donut-legend-value">{formatNumber(d.value)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}