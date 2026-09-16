function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="formatted-strong">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export default function FormattedText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks = [];
  let bulletBuffer = [];

  const flushBullets = (key) => {
    if (bulletBuffer.length) {
      blocks.push(
        <ul key={`ul-${key}`} className="formatted-list">
          {bulletBuffer.map((b, i) => (
            <li key={i}>{renderInline(b, `b-${key}-${i}`)}</li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) {
      flushBullets(idx);
      return;
    }
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (bullet) {
      bulletBuffer.push(bullet[1]);
      return;
    }
    flushBullets(idx);

    const heading = line.match(/^(#{1,3}\s+|(\d+)\)\s+)(.*)/);
    if (heading) {
      blocks.push(
        <div key={idx} className="formatted-heading">
          {renderInline(heading[3], `h-${idx}`)}
        </div>
      );
      return;
    }

    blocks.push(
      <p key={idx} className="formatted-paragraph">
        {renderInline(line, `p-${idx}`)}
      </p>
    );
  });
  flushBullets("end");

  return <div className="formatted-text">{blocks}</div>;
}