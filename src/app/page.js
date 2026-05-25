"use client";

import { useState } from "react";

export default function Home() {
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(
      {
        data: ["M", "1", "334", "4", "B"],
        file_b64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      },
      null,
      2
    )
  );
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  
  // Custom multi-select: pills state
  const [selectedFilters, setSelectedFilters] = useState(["numbers", "alphabets", "highest_lowercase_alphabet"]);

  const filters = [
    { key: "alphabets", label: "Alphabets" },
    { key: "numbers", label: "Numbers" },
    { key: "highest_lowercase_alphabet", label: "Highest lowercase alphabet" },
  ];

  const handleFilterToggle = (key) => {
    if (selectedFilters.includes(key)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== key));
    } else {
      setSelectedFilters([...selectedFilters, key]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResponse(null);

    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonInput);
    } catch (err) {
      setError("Invalid JSON format. Please check your syntax.");
      return;
    }

    if (!parsedJson || typeof parsedJson !== "object") {
      setError("Input must be a valid JSON object.");
      return;
    }

    // "data" field validation (must be an array)
    if (!parsedJson.hasOwnProperty("data") || !Array.isArray(parsedJson.data)) {
      setError('JSON must contain a "data" array.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/bfhl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedJson),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "An error occurred while fetching the data.");
      } else {
        setResponse(data);
      }
    } catch (err) {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Developer Challenge</h1>
        <p>Unified Full-Stack Submission</p>
        <span className="badge">ROLL: 0827AL231132</span>
      </header>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-group">
          <label htmlFor="json-input">API Input JSON</label>
          <textarea
            id="json-input"
            className="json-textarea"
            placeholder='{ "data": ["A", "1"] }'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Processing..." : "Submit Data"}
          </button>
        </form>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {response && (
          <>
            <div className="filter-container">
              <span className="filter-label">Filter Response Fields</span>
              <div className="pills-selector">
                {filters.map((f) => {
                  const isSelected = selectedFilters.includes(f.key);
                  return (
                    <div
                      key={f.key}
                      className={`pill ${isSelected ? "selected" : ""}`}
                      onClick={() => handleFilterToggle(f.key)}
                    >
                      {f.label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="results-container">
              <span className="filter-label">Filtered Data Results</span>
              
              {selectedFilters.includes("alphabets") && (
                <div className="result-card">
                  <div className="result-title">Alphabets</div>
                  <div className="result-value">
                    {response.alphabets && response.alphabets.length > 0
                      ? response.alphabets.join(", ")
                      : "None"}
                  </div>
                </div>
              )}

              {selectedFilters.includes("numbers") && (
                <div className="result-card">
                  <div className="result-title">Numbers</div>
                  <div className="result-value">
                    {response.numbers && response.numbers.length > 0
                      ? response.numbers.join(", ")
                      : "None"}
                  </div>
                </div>
              )}

              {selectedFilters.includes("highest_lowercase_alphabet") && (
                <div className="result-card">
                  <div className="result-title">Highest Lowercase Alphabet</div>
                  <div className="result-value">
                    {response.highest_lowercase_alphabet &&
                    response.highest_lowercase_alphabet.length > 0
                      ? response.highest_lowercase_alphabet.join(", ")
                      : "None"}
                  </div>
                </div>
              )}

              <div className="result-card">
                <div className="result-title">Additional API Metadata</div>
                <div className="meta-grid">
                  <div className="meta-item">
                    <div className="meta-label">User ID</div>
                    <div>{response.user_id}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Email</div>
                    <div>{response.email}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Roll Number</div>
                    <div>{response.roll_number}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Prime Found?</div>
                    <div>{response.is_prime_found ? "Yes" : "No"}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">File Valid?</div>
                    <div>{response.file_valid ? "Yes" : "No"}</div>
                  </div>
                  {response.file_valid && (
                    <>
                      <div className="meta-item">
                        <div className="meta-label">File Type</div>
                        <div>{response.file_mime_type}</div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">File Size</div>
                        <div>{response.file_size_kb} KB</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
