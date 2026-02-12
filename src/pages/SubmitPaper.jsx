import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function SubmitPaper() {
  const [conferences, setConferences] = useState([]);
  const [confId, setConfId] = useState("");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("AI, Computing");
  const [authorsJson, setAuthorsJson] = useState(
    JSON.stringify([
      { fullName: "Mustafa Alobaedy", email: "admin@icaici.com" },
    ]),
  );
  const [paper, setPaper] = useState(null);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function loadConfs() {
    setErr("");
    try {
      const data = await apiFetch("/conferences");
      const items = data.items || [];
      setConferences(items);
      if (items.length && !confId) setConfId(items[0]._id);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    loadConfs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!confId) return setErr("Please select a conference");
    if (!title.trim()) return setErr("Title is required");
    if (!paper) return setErr("Please choose a PDF file");

    // Build multipart/form-data
    const form = new FormData();
    form.append("conferenceId", confId);
    form.append("title", title);
    form.append("abstract", abstract);
    form.append("keywords", keywords);
    form.append("authors", authorsJson);
    form.append("paper", paper);

    try {
      await apiFetch("/submissions", {
        method: "POST",
        body: form,
      });

      setMsg("Paper submitted successfully.");
      setTitle("");
      setAbstract("");
      setPaper(null);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>Submit Paper</h2>

      {err && <p style={{ color: "red" }}>{err}</p>}
      {msg && <p style={{ color: "green" }}>{msg}</p>}

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Conference</label>
          <select value={confId} onChange={(e) => setConfId(e.target.value)}>
            {conferences.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={loadConfs} style={{ width: 120 }}>
            Refresh
          </button>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Abstract</label>
          <textarea
            rows={5}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Keywords (comma separated)</label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Authors (JSON array)</label>
          <textarea
            rows={4}
            value={authorsJson}
            onChange={(e) => setAuthorsJson(e.target.value)}
          />
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Example: [{"{"}"fullName":"A","email":"a@x.com"{"}"}]
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Paper PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPaper(e.target.files?.[0] || null)}
          />
          {paper && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Selected: {paper.name} ({Math.round(paper.size / 1024)} KB)
            </div>
          )}
        </div>

        <button type="submit" style={{ width: 180 }}>
          Submit Paper
        </button>
      </form>
    </div>
  );
}
