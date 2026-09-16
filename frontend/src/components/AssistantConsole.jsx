import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Bot, Send, X } from "lucide-react";
import FormattedText from "./FormattedText";
import { sendChat } from "../lib/api";

export default function AssistantConsole({ attachedAlert, onDetach, openToken }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Console ready. Ask about any alert, or general hardening advice for what's showing up in your logs." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (openToken) setOpen(true);
  }, [openToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChat(text, attachedAlert?.id);
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: `Couldn't reach the model: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-console">
      <button onClick={() => setOpen((o) => !o)} className="console-toggle">
        <span className="console-toggle-left">
          <Bot size={15} style={{ color: "var(--signal)" }} />
          Ask the analyst
          {attachedAlert && <span className="console-toggle-badge">re: {attachedAlert.type}</span>}
        </span>
        <span className="console-toggle-right">
          Qwen3 via Ollama
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {open && (
        <div className="console-panel animate-drawer-up">
          {attachedAlert && (
            <div className="console-context">
              <span>Context attached: {attachedAlert.type}</span>
              <button onClick={onDetach}>
                <X size={13} />
              </button>
            </div>
          )}

          <div ref={scrollRef} className="console-messages">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="console-user-line">
                  <span className="prompt">❯ </span>
                  {m.text}
                </div>
              ) : (
                <div key={i}>
                  <div className="console-assistant-label">analyst</div>
                  <FormattedText text={m.text} />
                </div>
              )
            )}
            {loading && (
              <div className="loading-line">
                <span className="status-dot signal animate-pulse" />
                Thinking…
              </div>
            )}
          </div>

          <div className="console-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about a vulnerability, or how to prevent it…"
            />
            <button onClick={handleSend} disabled={loading} className="console-send">
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}