import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TimelineChart({ data }) {
  const chartData = data && data.length ? data : [{ hour: "—", count: 0 }];

  return (
    <div className="chart-panel">
      <div className="panel-label" style={{ marginBottom: 16 }}>Event volume by hour</div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F4A93C" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F4A93C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1B2536" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#566072", fontSize: 9, fontFamily: "IBM Plex Mono" }}
              axisLine={{ stroke: "#1B2536" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#566072", fontSize: 7.5, fontFamily: "IBM Plex Mono" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "#131B2A",
                border: "1px solid #1B2536",
                borderRadius: 2,
                fontSize: 12,
                fontFamily: "IBM Plex Mono",
              }}
              labelStyle={{ color: "#8592A6" }}
              itemStyle={{ color: "#E6EAF2" }}
            />
            <Area type="monotone" dataKey="count" stroke="#F4A93C" strokeWidth={1.5} fill="url(#signalFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}