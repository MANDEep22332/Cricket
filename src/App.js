import { useState, useEffect } from 'react';
import './App.css';
import MatchHistory from './MatchHistory';

function App() {
  const [innings, setInnings] = useState(1);
  const [target, setTarget] = useState(null);
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const [runs, setRuns] = useState(0);
  const [teamName1, setTeamName1] = useState("Manjit Kings");
  const [teamName2, setTeamName2] = useState("Samchana Kings");
  const [balls, setBalls] = useState(0);
  const [history, setHistory] = useState([]);
  const [players, setPlayers] = useState([
    { id: 1, name: "Batsman 1", runs: 0, balls: 0, isOnStrike: true },
    { id: 2, name: "Batsman 2", runs: 0, balls: 0, isOnStrike: false }
  ]);
  const [wickets, setWickets] = useState(0);
  const [outPlayers, setOutPlayers] = useState([]);
  const [bowlers, setBowlers] = useState([
    { id: 1, name: "Bowler 1", runs: 0, balls: 0, wickets: 0 }
  ]);
  const [activeBowlerId, setActiveBowlerId] = useState(1);
  const [maxOvers, setMaxOvers] = useState(5);
const [isGameOver, setIsGameOver] = useState(false);
const [winner, setWinner] = useState("");
const [matchResult, setMatchResult] = useState("");
  const [firstInningsScore, setFirstInningsScore] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";

  useEffect(() => {
    if (isGameOver) {
      const saveMatch = async () => {
        const matchData = {
          teamName1,
          teamName2,
          score: runs,
          wickets,
          overs: `${overCount}.${ballCount}`,
          result: matchResult,
          firstInningsScore
        };
        try {
          const response = await fetch(`${API_URL}/save-match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchData),
          });
          const data = await response.json();
          console.log("Database Sync:", data.message);
        } catch (error) {
          console.error("Database Error:", error);
        }
      };saveMatch();
    }
  }, [isGameOver]);



  const checkMatchEnd = (currentRuns, currentWickets, currentBalls) => {
    const totalBalls = maxOvers * 6;

    // --- First Innings Logic ---
    if (innings === 1) {
      if (currentWickets >= 10 || currentBalls >= totalBalls) {
        setFirstInningsScore(currentRuns);
        switchInnings(currentRuns); // Trigger the transition
      }
    }

    // --- Second Innings Logic ---
    if (innings === 2) {
      // Case 1: Chasing team wins
      if (currentRuns >= target) {
        setMatchResult(`${teamName2} won by ${10 - currentWickets} wickets!`);
        setIsGameOver(true);
      } 
      // Case 2: Defending team wins or Tie (Innings over)
      else if (currentWickets >= 10 || currentBalls >= totalBalls) {
        if (currentRuns < target - 1) {
          setMatchResult(`${teamName1} won by ${target - 1 - currentRuns} runs!`);
        } else if (currentRuns === target - 1) {
          setMatchResult("Match Tied!");
        }
        setIsGameOver(true);
      }
    }
  };

  // Helper to handle bowler change at over end
  const checkOverEnd = (currentBalls) => {
    if (currentBalls > 0 && currentBalls % 6 === 0) {
      setTimeout(() => {
        alert("Over Finished!");
        const nextName = prompt("Enter next bowler's name:");
        if (nextName) {
          const newB = { id: Date.now(), name: nextName, runs: 0, balls: 0, wickets: 0 };
          setBowlers(prev => [...prev, newB]);
          setActiveBowlerId(newB.id);
        }
      }, 100);
    }
  };

  function switchInnings(finalFirstInningsScore) {
setTarget(finalFirstInningsScore + 1);
    const confirmSwitch = window.confirm(`Innings Over! ${teamName1} scored ${runs}. Start ${teamName2}'s innings?`);
    if (confirmSwitch) {
      setTarget(runs + 1);
      setRuns(0);
      setWickets(0);
      setBalls(0);
      setHistory([]);
      setInnings(2);
      setOutPlayers([]);
      const s1 = prompt(`Enter Striker for ${teamName2}:`);
      const s2 = prompt(`Enter Non-Striker for ${teamName2}:`);
      setPlayers([
        { id: 1, name: s1 || "Batsman 1", runs: 0, balls: 0, isOnStrike: true },
        { id: 2, name: s2 || "Batsman 2", runs: 0, balls: 0, isOnStrike: false }
      ]);
      setBowlers([{ id: Date.now(), name: "New Bowler", runs: 0, balls: 0, wickets: 0 }]);
      setActiveBowlerId(Date.now());
    }

  }

  function handleWicket() {
    if (wickets >= 10) return alert("All Out!");
    const nextPlayerName = prompt("Wicket! Enter new batsman name:");
    if (!nextPlayerName) return;

    const playerWhoIsOut = players.find(p => p.isOnStrike);
    setOutPlayers([...outPlayers, { ...playerWhoIsOut, outType: "Out" }]);

    const newBalls = balls + 1;
    const newWickets = wickets + 1;
    setWickets(wickets + 1);
    setBalls(newBalls);
    setHistory([...history, "W"].slice(-6));

    setPlayers(players.map(p => p.isOnStrike ? { ...p, name: nextPlayerName, runs: 0, balls: 0 } : p));
    if (newWickets < 10 && newBalls < maxOvers * 6) {
        const nextPlayerName = prompt("Wicket! Enter new batsman name:");
        setPlayers(players.map(p => p.isOnStrike ? { ...p, name: nextPlayerName || "Batsman", runs: 0, balls: 0 } : p));
    }
    setBowlers(bowlers.map(b => b.id === activeBowlerId ? { ...b, wickets: b.wickets + 1, balls: b.balls + 1 } : b));
    
    checkOverEnd(newBalls);
    checkMatchEnd(runs, newWickets, newBalls);
  }

  function handleRuns(v) {
    const newRuns = runs + v;
    const newBalls = balls + 1;
    
    setRuns(newRuns);
    setBalls(newBalls);
    setHistory([...history, v].slice(-6));

    // Update Batsmen and rotate strike
    const isOverEnd = newBalls % 6 === 0;
    const isOdd = v % 2 !== 0;
    const shouldRotate = (isOdd && !isOverEnd) || (!isOdd && isOverEnd);

    setPlayers(prev => prev.map(p => {
      let updated = p.isOnStrike ? { ...p, runs: p.runs + v, balls: p.balls + 1 } : p;
      return shouldRotate ? { ...updated, isOnStrike: !updated.isOnStrike } : updated;
    }));

    // Update Bowler
    setBowlers(prev => prev.map(b => b.id === activeBowlerId ? { ...b, runs: b.runs + v, balls: b.balls + 1 } : b));

    // Win check for 2nd innings
    if (innings === 2 && newRuns >= target) {
      alert(`${teamName2} Won!`);
      setIsMatchStarted(false);
    }

    checkOverEnd(newBalls);
    checkMatchEnd(newRuns, wickets, newBalls);
    if (innings === 2) {
  if (newRuns >= target) {
    setMatchResult(`${teamName2} won by ${10 - wickets} wickets!`);
    setIsGameOver(true);
  } else if (newBalls === maxOvers * 6 || wickets >= 10) {
    if (newRuns < target - 1) {
      setMatchResult(`${teamName1} won by ${target - 1 - newRuns} runs!`);
    } else {
      setMatchResult("Match Tied!");
    }
    setIsGameOver(true);
  }
}


  }

  function handleExtra() { const newRuns = runs + 1;
    setRuns(newRuns); 
    checkMatchEnd(newRuns, wickets, balls); }
  function handleChangeStrike() { setPlayers(players.map(p => ({ ...p, isOnStrike: !p.isOnStrike }))); }

  const overCount = Math.floor(balls / 6);
  const ballCount = balls % 6;

  
  return (
    <div className='App'>
      <button 
      className="btn btn-info m-3" 
      onClick={() => setShowHistory(!showHistory)}
    >
      {showHistory ? "Back to Match" : "View Match History"}
    </button>
    {showHistory ? (
      <MatchHistory />
    ) :
      !isMatchStarted ? (
        <div className="setup-container p-5 border rounded bg-white shadow m-5">
          <h2>Match Setup</h2>
          <div className="row g-3">
            <div className="col-md-6"><label>Team 1</label><input className="form-control" value={teamName1} onChange={(e) => setTeamName1(e.target.value)} /></div>
            <div className="col-md-6"><label>Team 2</label><input className="form-control" value={teamName2} onChange={(e) => setTeamName2(e.target.value)} /></div>
            <div className="col-md-6"><label>Striker</label><input className="form-control" placeholder="P1" onChange={(e) => { let p = [...players]; p[0].name = e.target.value; setPlayers(p); }} /></div>
            <div className="col-md-6"><label>Non-Striker</label><input className="form-control" placeholder="P2" onChange={(e) => { let p = [...players]; p[1].name = e.target.value; setPlayers(p); }} /></div>
            <div className="col-md-6"><label>Overs</label><input type="number" className="form-control" value={maxOvers} onChange={(e) => setMaxOvers(Number(e.target.value))} /></div>
            <button className="btn btn-primary mt-4" onClick={() => setIsMatchStarted(true)}>Start Match</button>
          </div>
        </div>
      ) :   isGameOver ? (
      /* --- MATCH SUMMARY VIEW --- */
      <div className="summary-view p-5 m-5 border rounded bg-white shadow-lg text-center">
        <h1 className="display-4 text-success">Match Completed</h1>
        <div className="alert alert-primary h2 my-4">{matchResult}</div>
        
        <div className="row mt-4">
          <div className="col-md-6 border-end">
            <h4>{teamName1}</h4>
            <p className="h2">{innings === 1 ? runs : firstInningsScore}/{innings === 1 ? wickets : '?'}</p>
          </div>
          <div className="col-md-6">
            <h4>{teamName2}</h4>
            <p className="h2">{innings === 2 ? runs : '0'}/{innings === 2 ? wickets : '0'}</p>
          </div>
        </div>

        <div className="mt-5">
          <button className="btn btn-dark m-2" onClick={() => window.print()}>Download PDF</button>
          <button className="btn btn-danger m-2" onClick={() => window.location.reload()}>New Match</button>
        </div>
      </div>
    ) : (  
        <div className='Main'>
          <div className='topbar bg-dark text-white p-3 d-flex justify-content-around'>
            <div>{teamName1}</div>
            <div className='h3'>{runs}/{wickets} <small>({overCount}.{ballCount})</small></div>
            <div>{teamName2}</div>
          </div>

          {innings === 2 && target && (
            <div className="bg-warning p-2 text-center fw-bold">Target: {target} | Need {target - runs} in {(maxOvers * 6) - balls} balls</div>
          )}

          <div className='container mt-4'>
            <div className='row'>
              <div className='col-md-4'>
                <h3>Control Panel</h3>
                {[0, 1, 2, 3, 4, 6].map(r => (
                  <button key={r} className='btn btn-success m-1' onClick={() => handleRuns(r)}>{r}</button>
                ))}
                <div className='mt-2'>
                  <button className='btn btn-danger m-1' onClick={handleExtra}>Wd/NB</button>
                  <button className='btn btn-dark m-1' onClick={handleWicket}>Wic</button>
                  <button className='btn btn-secondary m-1' onClick={handleChangeStrike}>🔄 Strike</button>
                </div>
                {innings === 1 && <button className="btn btn-primary w-100 mt-3" onClick={switchInnings}>Finish Innings</button>}
              </div>

              <div className='col-md-4'>
                <h3 className='Timeline'>Timeline</h3>
                <div className='d-flex gap-2'>
                  {history.map((ball, i) => <div key={i} className='ball-circle p-2 border rounded-circle bg-light'>{ball}</div>)}
                </div>
              </div>

              <div className='col-md-4'>
                <h5>Current Bowler</h5>
                <select className="form-select" value={activeBowlerId} onChange={(e) => setActiveBowlerId(Number(e.target.value))}>
                  {bowlers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div className='row mt-5'>
                <div className='col-md-6'>
                    <h5>Batting</h5>
                    <table className='table table-sm'>
                        <thead><tr><th>Name</th><th>R</th><th>B</th></tr></thead>
                        <tbody>
                            {players.map(p => (
                                <tr key={p.id} className={p.isOnStrike ? 'table-primary' : ''}>
                                    <td>{p.name} {p.isOnStrike ? '🏏' : ''}</td>
                                    <td>{p.runs}</td><td>{p.balls}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className='col-md-6'>
                    <h5>Bowling Card</h5>
                    <table className='table table-sm'>
                        <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th></tr></thead>
                        <tbody>
                            {bowlers.map(b => (
                                <tr key={b.id} className={b.id === activeBowlerId ? 'table-info' : ''}>
                                    <td>{b.name}</td>
                                    <td>{Math.floor(b.balls/6)}.{b.balls%6}</td>
                                    <td>{b.runs}</td><td>{b.wickets}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;