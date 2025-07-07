"use client";
import React, { useState, useEffect, useRef } from "react";
// @ts-ignore
import twemoji from "twemoji";

interface Message {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  reactions?: { reaction: string; actor: string }[];
}

const PAGE_SIZE = 30;
const SELF = "Lukas Lipka"; // Change if needed for alignment

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function parse(text: string) {
  // Use twemoji to parse emoji to <img> tags
  return fixLatin1ToUtf8(text)
}
function fixLatin1ToUtf8(str:string) {
  // Convert each character to its Latin-1 byte
  const latin1Bytes = new Uint8Array([...str].map(c => c.charCodeAt(0)));
  
  // Decode as UTF-8
  const utf8String = latin1Bytes
  
  return utf8String;
}
function MessageBubble({ msg }: { msg: Message }) {
  if (!msg) return null;
  const isSelf = msg.sender_name === SELF;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isSelf ? "flex-end" : "flex-start",
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>
        {msg.sender_name} · {formatTime(msg.timestamp_ms)}
      </div>
      <div
        style={{
          background: isSelf ? "#3897f0" : "#efefef",
          color: isSelf ? "#fff" : "#222",
          borderRadius: 18,
          padding: "10px 16px",
          maxWidth: 400,
          fontSize: 16,
          wordBreak: "break-word",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
        dangerouslySetInnerHTML={{ __html: msg.content ? parse(msg.content) : "" }}
      />
      {msg.reactions && msg.reactions.length > 0 && (
        <div style={{ marginTop: 4, display: "flex", gap: 8 }}>
          {msg.reactions.map((r, i) => (
            <span
              key={i}
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 12,
                padding: "2px 8px",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
              title={r.actor}
              dangerouslySetInnerHTML={{ __html: parse(r.reaction) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      const data = await res.json();
      setError(data.error || "Authentication failed");
    }
  };

  // Fetch messages
  useEffect(() => {
    if (!authenticated) return;
    setMessages([]);
    setOffset(0);
    setHasMore(true);
    loadMore(0, true);
    // eslint-disable-next-line
  }, [authenticated]);

  const loadMore = async (startOffset = offset, replace = false) => {
    console.log("loadMore", startOffset, replace);
    if (loading || !hasMore) return;
    setLoading(true);
    const res = await fetch(`/api/messages?offset=${startOffset}&limit=${PAGE_SIZE}`);
    if (res.ok) {
      const data = await res.json();
      if (data.messages.length < PAGE_SIZE) setHasMore(false);
      // Filter out messages that start with 'Používateľ reagoval' or 'Pouzivatel reagoval' (with or without diacritics)
      const filtered = data.messages.filter((msg: Message) => {
        if (!msg.content) return true;
        // Decode the content for filtering
        const decoded = fixLatin1ToUtf8(msg.content);
        return !/^Pou[žz]ívate[ľl] reagoval/.test(decoded);
      });
      setMessages(prev => replace ? filtered : [...prev, ...filtered]);
      setOffset(startOffset + data.messages.length);
      console.log(filtered);
    }
    setLoading(false);
  };

  // Infinite scroll
  useEffect(() => {
    if (!authenticated) return;
    const handleScroll = () => {
      if (!viewerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = viewerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loading) {
        loadMore();
      }
    };
    const ref = viewerRef.current;
    if (ref) ref.addEventListener("scroll", handleScroll);
    return () => { if (ref) ref.removeEventListener("scroll", handleScroll); };
    // eslint-disable-next-line
  }, [authenticated, hasMore, loading, offset]);

  if (!authenticated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 300 }}>
          <h2>Enter Password to View Messages</h2>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{ padding: 8, fontSize: 16, borderRadius: 8, border: "1px solid #ccc" }}
          />
          <button type="submit" style={{ padding: 10, fontSize: 16, borderRadius: 8, background: "#3897f0", color: "white", border: "none" }}>View</button>
          {error && <div style={{ color: "red" }}>{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: "#fafafa", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 style={{ margin: 24, fontWeight: 600, fontSize: 24 }}>Instagram Message Viewer</h2>
      <div
        ref={viewerRef}
        style={{
          width: "100%",
          maxWidth: 500,
          height: "80vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          padding: 24,
          marginBottom: 32,
        }}
      >
        {messages.length === 0 && <div style={{ color: "#888", textAlign: "center" }}>No messages yet.</div>}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && <div style={{ color: "#888", textAlign: "center", margin: 16 }}>Loading...</div>}
        {!hasMore && messages.length > 0 && <div style={{ color: "#bbb", textAlign: "center", margin: 16 }}>End of conversation</div>}
      </div>
    </div>
  );
}
