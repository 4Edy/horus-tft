// frontend/src/App.tsx
import { useState } from "react";
import ProfilePage from "./pages/ProfilePage";
import "./App.css";

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [submitted, setSubmitted] = useState<{ gameName: string; tagLine: string } | null>(null);

  const handleSearch = () => {
    const parts = searchInput.split("#");
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      alert("Use o formato: NickName#TAG");
      return;
    }
    setSubmitted({ gameName: parts[0].trim(), tagLine: parts[1].trim() });
  };

  if (submitted) {
    return <ProfilePage gameName={submitted.gameName} tagLine={submitted.tagLine} onBack={() => setSubmitted(null)} />;
  }

  return (
    <div className="landing">
      <div className="landing-bg">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
        <div className="grid-overlay" />
      </div>
      <div className="landing-content">
        <div className="logo-area">
          <span className="logo-tag">TFT</span>
          <h1 className="logo-title">INTEL</h1>
          <p className="logo-sub">Seu painel de desempenho para Teamfight Tactics</p>
        </div>
        <div className="search-box">
          <input
            className="search-input"
            type="text"
            placeholder="NickName#BR1"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="search-btn" onClick={handleSearch}>
            <span>ANALISAR</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        <p className="search-hint">Exemplo: LLL 4Edy#RVS</p>
      </div>
    </div>
  );
}

export default App;
