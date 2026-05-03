// frontend/src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:3001";

function formatName(id: string) {
  return id.replace("TFT17_", "").replace("TFT_", "");
}

function formatTrait(name: string) {
  return name.replace("TFT17_", "").replace(/([A-Z])/g, " $1").trim();
}

function placementClass(p: number) {
  if (p === 1) return "p1";
  if (p === 2) return "p2";
  if (p === 3) return "p3";
  if (p <= 4) return "ptop";
  return "pbot";
}

function cardClass(m: any) {
  if (m.win) return "match-card win";
  if (m.top4) return "match-card top4";
  return "match-card bot4";
}

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "< 1h atrás";
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

interface Props { gameName: string; tagLine: string; onBack: () => void; }

export default function ProfilePage({ gameName, tagLine, onBack }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          axios.get(`${API}/summoner/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`),
          axios.get(`${API}/matches/history/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`),
        ]);
        setProfile(profileRes.data);
        setHistory(historyRes.data);
      } catch (e: any) {
        setError(e?.response?.data?.error || "Erro ao carregar dados");
      }
    };
    fetchAll();
  }, [gameName, tagLine]);

  if (error) return (
    <div className="profile-page">
      <button className="back-btn" onClick={onBack}>← Voltar</button>
      <div className="error-box">ERRO: {error}</div>
    </div>
  );

  if (!profile || !history) return (
    <div className="loading">
      <div className="loading-spinner" />
      <span className="loading-text">CARREGANDO INTEL...</span>
    </div>
  );

  const { summoner, account } = profile;
  const { stats, history: matches } = history;
  const iconUrl = `https://ddragon.leagueoflegends.com/cdn/15.8.1/img/profileicon/${summoner.profileIconId}.png`;

  return (
    <div className="profile-page">
      <button className="back-btn" onClick={onBack}>← Voltar</button>

      <div className="profile-header">
        <div className="profile-icon">
          <img src={iconUrl} alt="icon" onError={(e: any) => { e.target.src = "https://ddragon.leagueoflegends.com/cdn/15.8.1/img/profileicon/1.png"; }} />
          <div className="level-badge">Nv {summoner.summonerLevel}</div>
        </div>
        <div className="profile-info">
          <div className="profile-name">
            {account.gameName}<span className="profile-tag"> #{account.tagLine}</span>
          </div>
          <div className="profile-set">SET 17 · BRASIL</div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Partidas</div>
          <div className="stat-value">{stats.totalGames}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Média Placement</div>
          <div className={`stat-value ${stats.avgPlacement <= 4 ? "good" : stats.avgPlacement <= 5.5 ? "warn" : "bad"}`}>
            #{stats.avgPlacement}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Taxa Top 4</div>
          <div className={`stat-value ${stats.top4Rate >= 50 ? "good" : stats.top4Rate >= 37.5 ? "warn" : "bad"}`}>
            {stats.top4Rate}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Taxa de 1º</div>
          <div className={`stat-value ${stats.winRate >= 15 ? "good" : stats.winRate >= 8 ? "warn" : "bad"}`}>
            {stats.winRate}%
          </div>
        </div>
      </div>

      <div className="section-title">Últimas {matches.length} Partidas</div>
      <div className="match-list">
        {matches.map((m: any) => (
          <div key={m.matchId} className={cardClass(m)}>
            <div className={`placement-num ${placementClass(m.placement)}`}>
              {m.placement}°
            </div>
            <div className="match-info">
              <div className="match-traits">
                {m.traits.map((t: any) => (
                  <span key={t.name} className={`trait-chip ${t.tierCurrent >= 2 ? "active" : ""}`}>
                    {formatTrait(t.name)} {t.numUnits}
                  </span>
                ))}
              </div>
              <div className="match-units">
                {m.units.map((u: any, i: number) => (
                  <span key={i} className={`unit-chip ${u.tier === 3 ? "t3" : ""}`}>
                    {formatName(u.characterId)}{u.tier === 3 ? " ★" : ""}
                  </span>
                ))}
              </div>
            </div>
            <div className="match-meta">
              <span className="match-date">{timeAgo(m.gameDatetime)}</span>
              <span className="match-mins">{Math.floor(m.gameLength / 60)}min</span>
              <span className="match-dmg">{m.totalDamageToPlayers}</span>
              <span className="match-dmg-label">DMG</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
