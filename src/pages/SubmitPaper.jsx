import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function SubmitPaper() {
  const [confs, setConfs] = useState([]);
  const [conferenceId, setConferenceId] = useState("");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("AI, Computing");
  const [authors, setAuthors] = useState(
    `[{"fullName":"Mustafa Alobaedy","email":"admin@icaici.com"}]`,
  );
  const [paper, setPaper] = useState(null);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function loadConfs() {
    setErr("");
    try {
      const data = await apiFetch("/conferences");
      const items = data.items || [];
      setConfs(items);
      if (!conferenceId && items.length) setConferenceId(items[0]._id);
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

    if (!conferenceId) return setErr("Please select a conference");
    if (!title.trim()) return setErr("Title is required");
    if (!paper) return setErr("Please choose a PDF file");

    try {
      // validate authors JSON
      JSON.parse(authors);

      const fd = new FormData();
      fd.append("conferenceId", conferenceId);
      fd.append("title", title);
      fd.append("abstract", abstract);
      fd.append("keywords", keywords);
      fd.append("authors", authors);
      fd.append("paper", paper);

      await apiFetch("/submissions", {
        method: "POST",
        body: fd,
        headers: {}, // important: let browser set multipart boundary
      });

      setMsg("Submission created successfully!");
      setTitle("");
      setAbstract("");
      setPaper(null);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h2>Submit Paper</h2>

      {err && <p style={{ color: "red" }}>{err}</p>}
      {msg && <p style={{ color: "green" }}>{msg}</p>}

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <label>
          Conference
          <select
            value={conferenceId}
            onChange={(e) => setConferenceId(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          >
            {confs.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Abstract
          <textarea
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6, minHeight: 110 }}
          />
        </label>

        <label>
          Keywords (comma-separated)
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Authors (JSON array)
          <textarea
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6, minHeight: 90 }}
          />
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Example: [{"{"}"fullName":"A","email":"a@x.com"{"}"}]
          </div>
        </label>

        <label>
          Paper (PDF)
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPaper(e.target.files?.[0] || null)}
            style={{ display: "block", marginTop: 6 }}
          />
        </label>

        <button type="submit" style={{ width: 180 }}>
          Submit Paper
        </button>
      </form>
    </div>
  );
}
