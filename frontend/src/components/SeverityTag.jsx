import { severityColor, titleCase } from "../lib/format";

export default function SeverityTag({ severity, size = "sm" }) {
  const color = severityColor(severity);
  return (
    <span className={`severity-tag ${size === "lg" ? "lg" : ""}`} style={{ color }}>
      <span className="severity-tag-dot" />
      {titleCase(severity)}
    </span>
  );
}