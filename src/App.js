import { useState, useEffect } from "react";
import "./App.css";
import MatchHistory from "./MatchHistory";

function App() {
  // --- STATE DECLARATIONS ---
  const [tossWinner, setTossWinner] = useState("");
  const [tossChoice, setTossChoice] = useState("");
  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [openingBowlerId, setOpeningBowlerId] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState("Team A");
  const [innings, setInnings] = useState(1);
  const [target, setTarget] = useState(null);
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const [runs, setRuns] = useState(0);
  const [teamName1, setTeamName1] = useState("Manjit Kings");
  const [teamName2, setTeamName2] = useState("Samchana Kings");
  const [balls, setBalls] = useState(0);
  const [history, setHistory] = useState([]);
  const [players, setPlayers] = useState([]);
  const [wickets, setWickets] = useState(0);
  const [outPlayers, setOutPlayers] = useState([]);
  const [bowlers, setBowlers] = useState([]);
  const [fallOfWickets, setFallOfWickets] = useState([]);
  const [activeBowlerId, setActiveBowlerId] = useState(null);
  const [maxOvers, setMaxOvers] = useState(5);
  const [isGameOver, setIsGameOver] = useState(false);
  const [matchResult, setMatchResult] = useState("");
  const [firstInningsScore, setFirstInningsScore] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerRole, setNewPlayerRole] = useState("Batsman");
  const [team1Squad, setTeam1Squad] = useState([]);
  const [team2Squad, setTeam2Squad] = useState([]);
  const [matchStack, setMatchStack] = useState([]);
  const [battingStats, setBattingStats] = useState([]);
  const [bowlingStats, setBowlingStats] = useState([]);
  const [matchData, setMatchData] = useState({
    firstInningsScore: 0,
    currentScore: 0,
    totalBallsBowled: 0,
    teamName2: "Team B",
  });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";
  const overCount = Math.floor(balls / 6);
  const ballCount = balls % 6;
  // Fetch players when the component loads
  useEffect(() => {
    fetch(`${API_URL}/get-players`)
      .then((res) => res.json())
      .then((data) => setAvailablePlayers(data))
      .catch((err) => console.error("Could not fetch players:", err));
  }, []);

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
          fallOfWickets,
          firstInningsScore,
          fullScorecard: battingStats, // Add the complete player stats here
        };

        try {
          await fetch(`${API_URL}/save-match`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(matchData),
          });
          console.log("Match and Scorecard saved successfully!");
        } catch (error) {
          console.error("Database Error:", error);
        }
      };
      saveMatch();
    }
  }, [isGameOver]);

  const saveState = () => {
    const currentState = {
      runs,
      wickets,
      balls,
      history: [...history],
      players: JSON.parse(JSON.stringify(players)), // Deep copy
      bowlers: JSON.parse(JSON.stringify(bowlers)),
      fallOfWickets: [...fallOfWickets],
      activeBowlerId,
      matchResult,
      isGameOver,
    };
    setMatchStack((prev) => [...prev, currentState]);
  };

  const saveToLocalStorage = () => {
    const matchState = {
      runs,
      wickets,
      balls,
      innings,
      target,
      teamName1,
      teamName2,
      players,
      bowlers,
      isMatchStarted,
      battingStats,
      bowlingStats,
      history,
    };
    localStorage.setItem("cricketMatch", JSON.stringify(matchState));
  };

  useEffect(() => {
    if (isMatchStarted) {
      saveToLocalStorage();
    }
  }, [runs, wickets, balls, players]); // Runs every time these values change

  useEffect(() => {
    const savedMatch = localStorage.getItem("cricketMatch");
    if (savedMatch) {
      const data = JSON.parse(savedMatch);

      // Restore all states
      setRuns(data.runs);
      setWickets(data.wickets);
      setBalls(data.balls);
      setInnings(data.innings);
      setTarget(data.target);
      setTeamName1(data.teamName1);
      setTeamName2(data.teamName2);
      setPlayers(data.players);
      setBowlers(data.bowlers);
      setBattingStats(data.battingStats);
      setBowlingStats(data.bowlingStats);
      setHistory(data.history);
      setIsMatchStarted(data.isMatchStarted);
    }
  }, []);

  const handleNewMatch = () => {
    localStorage.removeItem("cricketMatch");
    window.location.reload(); // Restarts the app fresh
  };
  const handleSelectAll = () => {
    const allNames = availablePlayers.map((p) => ({
      id: p._id,
      name: p.name,
      runs: 0,
      balls: 0,
      isOnStrike: false,
    }));
    setPlayers(allNames); // Sets the full squad into your 'players' state
  };

  // core functions
  const handleAddPlayer = async () => {
    if (!newPlayerName) return alert("Please enter a name");
    try {
      const response = await fetch(`${API_URL}/add-player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlayerName,
          team: newPlayerTeam,
          role: newPlayerRole,
        }),
      });
      const data = await response.json();
      setAvailablePlayers([...availablePlayers, data.player]);
      setNewPlayerName("");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSquadChange = (e, player, teamNum) => {
    const playerObj = {
      id: player._id,
      name: player.name,
      runs: 0,
      balls: 0,
      isOnStrike: false,
    };
    if (e.target.checked) {
      if (teamNum === 1) setTeam1Squad((prev) => [...prev, playerObj]);
      else setTeam2Squad((prev) => [...prev, playerObj]);
    } else {
      if (teamNum === 1)
        setTeam1Squad((prev) => prev.filter((p) => p.id !== player._id));
      else setTeam2Squad((prev) => prev.filter((p) => p.id !== player._id));
    }
  };

  const checkMatchEnd = (currentRuns, currentWickets, currentBalls) => {
    const totalBalls = maxOvers * 6;

    if (innings === 1) {
      if (currentWickets >= 10 || currentBalls >= totalBalls) {
        setFirstInningsScore(currentRuns);
        switchInnings(currentRuns);
      }
    } else if (innings === 2) {
      if (currentRuns >= target) {
        // teamName1 is now the team that was Team 2 at start
        setMatchResult(`${teamName1} won by ${10 - currentWickets} wickets!`);
        setIsGameOver(true);
      } else if (currentWickets >= 10 || currentBalls >= totalBalls) {
        if (currentRuns < target - 1) {
          setMatchResult(
            `${teamName2} won by ${target - 1 - currentRuns} runs!`
          );
        } else {
          setMatchResult("Match Tied!");
        }
        setIsGameOver(true);
      }
    }
  };
  const handleStartMatch = () => {
    if (!strikerId || !nonStrikerId || !openingBowlerId) {
      return alert("Please select Striker, Non-Striker, and Opening Bowler!");
    }

    // 1. Correctly determine who bats first based on toss
    // If Team 1 wins and bats, OR Team 2 wins and bowls -> Team 1 Bats
    const team1BatsFirst =
      (tossWinner === "Team 1" && tossChoice === "Bat") ||
      (tossWinner === "Team 2" && tossChoice === "Bowl");

    if (team1BatsFirst) {
      setTeamName1(teamName1); // Team 1 is batting
      setTeamName2(teamName2); // Team 2 is bowling
    } else {
      // We swap them so the "Batting Team" is always on the left of your UI
      const t1 = teamName1;
      const t2 = teamName2;
      setTeamName1(t2);
      setTeamName2(t1);
    }
    // 2. Assign the squads based on the logic above
    const battingSquad = team1BatsFirst ? team1Squad : team2Squad;
    const bowlingSquad = team1BatsFirst ? team2Squad : team1Squad;

    // 3. Look for the selected players in the CORRECT squads
    const striker = battingSquad.find((p) => p.id === strikerId);
    const nonStriker = battingSquad.find((p) => p.id === nonStrikerId);
    const bowler = bowlingSquad.find((p) => p.id === openingBowlerId);

    if (!striker || !nonStriker || !bowler) {
      return alert(
        "Error: Selected players not found in the batting/bowling squads!"
      );
    }

    // 4. Set the players for the match
    const openers = [
      { ...striker, isOnStrike: true, runs: 0, balls: 0, status: "Batting" },
      {
        ...nonStriker,
        isOnStrike: false,
        runs: 0,
        balls: 0,
        status: "Batting",
      },
    ];

    setPlayers(openers);
    setBattingStats(openers);

    setBowlers([
      {
        ...bowler,
        runs: 0,
        balls: 0,
        wickets: 0,
      },
    ]);
    setActiveBowlerId(bowler.id);
    setIsMatchStarted(true);
  };

  // Helper to handle bowler change at over end
  const checkOverEnd = (currentBalls) => {
    if (currentBalls > 0 && currentBalls % 6 === 0) {
      setTimeout(() => {
        const nextName = prompt("Over Finished! Enter next bowler's name:");
        if (nextName) {
          const newB = {
            id: Date.now(),
            name: nextName,
            runs: 0,
            balls: 0,
            wickets: 0,
          };
          setBowlers((prev) => [...prev, newB]);
          setActiveBowlerId(newB.id);
        }
      }, 100);
    }
  };

  function switchInnings(score) {
    const finalFirstInningsScore = score || runs;
    setTarget(finalFirstInningsScore + 1);
    if (team2Squad.length < 2) {
      alert("Please ensure Team 2 has at least 2 players before switching!");
      return;
    }
    if (
      window.confirm(
        `Innings Over! ${teamName1} scored ${finalFirstInningsScore}. Target for ${teamName2}: ${
          finalFirstInningsScore + 1
        }`
      )
    ) {
      // 1. Swap Team Names for the UI
      const t1 = teamName1;
      const t2 = teamName2;
      setTeamName1(t2); // Team 2 becomes the "Batting Team" (Left side)
      setTeamName2(t1); // Team 1 becomes the "Bowling Team" (Right side)

      // 2. Reset Match Counters
      setRuns(0);
      setWickets(0);
      setBalls(0);
      setHistory([]);
      setInnings(2);
      setFallOfWickets([]);
      setMatchStack([]); // Clear undo history for the new innings

      // 3. Load Team 2's Openers (Now the Batting Team)
      // We use the squad states we saved during setup
      if (team2Squad.length >= 2) {
        const openers = [
          {
            ...team2Squad[0],
            isOnStrike: true,
            runs: 0,
            balls: 0,
            status: "Batting",
          },
          {
            ...team2Squad[1],
            isOnStrike: false,
            runs: 0,
            balls: 0,
            status: "Batting",
          },
        ];
        setPlayers(openers);
        setBattingStats(openers);
      } else {
        alert("Team 2 squad is not set correctly!");
      }

      // 4. Set the Opening Bowler from Team 1
      const firstBowler =
        team1Squad.find((p) => p.role === "Bowler") || team1Squad[0];
      const initialBowler = {
        id: firstBowler.id,
        name: firstBowler.name,
        runs: 0,
        balls: 0,
        wickets: 0,
      };
      setBowlers([initialBowler]);
      setBowlingStats([initialBowler]);
      setActiveBowlerId(firstBowler.id);
    }
  }
  function handleWicket() {
    saveState();
    if (wickets >= 10) return alert("All Out!");

    const outType = prompt(
      "Dismissal Type: (Caught, Bowled, LBW, Run Out, Stumped)",
      "Caught"
    );
    if (!outType) return;

    const playerWhoIsOut = players.find((p) => p.isOnStrike);
    let playerOutIndex = players.findIndex((p) => p.isOnStrike);
    let newOnStrikeStatus = true;

    // Run Out Logic
    if (outType.toLowerCase().includes("run out")) {
      const whoOut = prompt(
        "Who is out? Enter 1 for Striker, 2 for Non-Striker",
        "1"
      );
      if (whoOut === "2") {
        playerOutIndex = players.findIndex((p) => !p.isOnStrike);
        newOnStrikeStatus = false;
      }
      if (window.confirm("Did the batsmen cross?"))
        newOnStrikeStatus = !newOnStrikeStatus;
    }

    // Get new player name first
    const nextPlayerName = prompt(`Enter name of new batsman:`);
    if (!nextPlayerName) return;

    // Update Batting Stats (Scorecard)
    setBattingStats((prev) => {
      const updatedStatus = prev.map((p) =>
        p.name === playerWhoIsOut.name
          ? { ...p, status: `Out (${outType})` }
          : p
      );
      return [
        ...updatedStatus,
        {
          id: Date.now(),
          name: nextPlayerName,
          runs: 0,
          balls: 0,
          status: "Batting",
        },
      ];
    });

    // Update Bowling Stats (Scorecard)
    const currentBowler = bowlers.find((b) => b.id === activeBowlerId);
    const currentBowlerName = currentBowler ? currentBowler.name : "Unknown";

    setBowlingStats((prev) => {
      const existing = prev.find((b) => b.name === currentBowlerName);
      if (existing) {
        return prev.map((b) =>
          b.name === currentBowlerName
            ? { ...b, balls: b.balls + 1, wickets: b.wickets + 1 }
            : b
        );
      }
      return [
        ...prev,
        { name: currentBowlerName, runs: 0, balls: 1, wickets: 1 },
      ];
    });

    // Global State Updates
    const newWickets = wickets + 1;
    const newBalls = balls + 1;
    setWickets(newWickets);
    setBalls(newBalls);
    setHistory((prev) => [...prev, "W"].slice(-6));
    setFallOfWickets((prev) => [
      ...prev,
      {
        wicketNumber: newWickets,
        score: runs,
        overs: `${overCount}.${ballCount}`,
        playerOut: playerWhoIsOut.name,
        dismissal: outType,
      },
    ]);

    // Update Active Players
    setPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[playerOutIndex] = {
        id: Date.now(),
        name: nextPlayerName,
        runs: 0,
        balls: 0,
        isOnStrike: newOnStrikeStatus,
      };
      const otherIndex = playerOutIndex === 0 ? 1 : 0;
      newPlayers[otherIndex].isOnStrike = !newOnStrikeStatus;
      return newPlayers;
    });

    checkOverEnd(newBalls);
    checkMatchEnd(runs, newWickets, newBalls);
  }

  function handleRuns(v) {
    saveState();
    const newRuns = runs + v;
    const newBalls = balls + 1;

    // Find the current bowler for stats
    const currentBowler = bowlers.find((b) => b.id === activeBowlerId);
    const currentBowlerName = currentBowler ? currentBowler.name : "Unknown";

    setRuns(newRuns);
    setBalls(newBalls);
    setHistory((prev) => [...prev, v].slice(-6));

    const isOverEnd = newBalls % 6 === 0;
    const rotate = (v % 2 !== 0 && !isOverEnd) || (v % 2 === 0 && isOverEnd);

    setPlayers((prev) =>
      prev.map((p) =>
        p.isOnStrike
          ? { ...p, runs: p.runs + v, balls: p.balls + 1, isOnStrike: !rotate }
          : { ...p, isOnStrike: rotate }
      )
    );

    setBowlers((prev) =>
      prev.map((b) =>
        b.id === activeBowlerId
          ? { ...b, runs: b.runs + v, balls: b.balls + 1 }
          : b
      )
    );

    // Update Scorecard Batting Stats
    const striker = players.find((curr) => curr.isOnStrike);
    setBattingStats((prev) =>
      prev.map((p) =>
        p.name === striker?.name
          ? { ...p, runs: p.runs + v, balls: p.balls + 1 }
          : p
      )
    );

    // Update Scorecard Bowling Stats
    setBowlingStats((prev) => {
      const existing = prev.find((b) => b.name === currentBowlerName);
      if (existing) {
        return prev.map((b) =>
          b.name === currentBowlerName
            ? { ...b, runs: b.runs + v, balls: b.balls + 1 }
            : b
        );
      }
      return [
        ...prev,
        { name: currentBowlerName, runs: v, balls: 1, wickets: 0 },
      ];
    });

    checkOverEnd(newBalls);
    checkMatchEnd(newRuns, wickets, newBalls);
  }

  function handleExtra() {
    saveState();
    const newRuns = runs + 1;
    setRuns(newRuns);
    checkMatchEnd(newRuns, wickets, balls);
  }
  function handleChangeStrike() {
    setPlayers(players.map((p) => ({ ...p, isOnStrike: !p.isOnStrike })));
  }

  const handleUndo = () => {
    if (matchStack.length === 0) return alert("Nothing to undo!");

    const lastState = matchStack[matchStack.length - 1];

    // Restore everything
    setRuns(lastState.runs);
    setWickets(lastState.wickets);
    setBalls(lastState.balls);
    setHistory(lastState.history);
    setPlayers(lastState.players);
    setBowlers(lastState.bowlers);
    setFallOfWickets(lastState.fallOfWickets);
    setActiveBowlerId(lastState.activeBowlerId);
    setMatchResult(lastState.matchResult);
    setIsGameOver(lastState.isGameOver);

    // Remove the last state from the stack
    setMatchStack((prev) => prev.slice(0, -1));
  };

  const handleDeletePlayer = async (id) => {
    if (window.confirm("Remove this player?")) {
      try {
        const response = await fetch(`${API_URL}/delete-player/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // This line removes the player from the UI list instantly
          setAvailablePlayers((prev) => prev.filter((p) => p._id !== id));
          alert("Player deleted successfully");
        }
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };
  return (
    <div className="App">
      <button
        className="btn btn-info m-3"
        onClick={() => setShowHistory(!showHistory)}
      >
        {showHistory ? "Back to Match" : "View Match History"}
      </button>
      {showHistory ? (
        <MatchHistory />
      ) : !isMatchStarted ? (
        <div className="setup-container p-5 border rounded bg-white shadow m-5">
          <h2>Match Setup</h2>
          <div className="row g-3">
            <div className="col-md-6">
              <label>Team 1</label>
              <input
                className="form-control"
                value={teamName1}
                onChange={(e) => setTeamName1(e.target.value)} // Ensure this is just a string
              />
            </div>
            <div className="col-md-6">
              <label>Team 2</label>
              <input
                className="form-control"
                value={teamName2}
                onChange={(e) => setTeamName2(e.target.value)}
              />
            </div>
            <div className="add-player-box p-3 mb-4 border rounded bg-light">
              <h5>Add New Player to Database</h5>
              <div className="input-group">
                {/* Name Input */}
                <input
                  type="text"
                  className="form-control"
                  placeholder="Player Name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />

                {/* Team Selection Dropdown */}
                <select
                  className="form-select"
                  value={newPlayerTeam}
                  onChange={(e) => setNewPlayerTeam(e.target.value)}
                >
                  <option value="Team A">Assign to Team A</option>
                  <option value="Team B">Assign to Team B</option>
                </select>

                {/* Role Selection Dropdown */}
                <select
                  className="form-select"
                  value={newPlayerRole}
                  onChange={(e) => setNewPlayerRole(e.target.value)}
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                </select>

                <button className="btn btn-success" onClick={handleAddPlayer}>
                  Add Player
                </button>
              </div>
            </div>

            <div className="col-12 mt-4">
              <h4>Select Squad</h4>
              <button
                className="btn btn-outline-primary mb-3"
                onClick={handleSelectAll}
              >
                Select All Available Players
              </button>

              <div className="row mt-4">
                {/* TEAM 1 SELECTION */}
                <div className="col-md-6 border-end">
                  <h4 className="text-primary">
                    {teamName1 || "Team 1"} Squad
                  </h4>
                  <div
                    className="player-list border p-2 bg-light"
                    style={{ height: "250px", overflowY: "auto" }}
                  >
                    {availablePlayers
                      .filter((p) => p.team === "Team A")
                      .map((p) => (
                        <div
                          key={p._id}
                          className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1"
                        >
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              onChange={(e) => handleSquadChange(e, p, 1)}
                            />
                            <label className="form-check-label">
                              {p.name}{" "}
                              <small className="text-muted">({p.role})</small>
                            </label>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger border-0"
                            onClick={() => handleDeletePlayer(p._id)}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* TEAM 2 SELECTION */}
                <div className="col-md-6">
                  <h4 className="text-danger">{teamName2 || "Team 2"} Squad</h4>
                  <div
                    className="player-list border p-2 bg-light"
                    style={{ height: "250px", overflowY: "auto" }}
                  >
                    {availablePlayers
                      .filter((p) => p.team === "Team B")
                      .map((p) => (
                        <div
                          key={p._id}
                          className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1"
                        >
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              onChange={(e) => handleSquadChange(e, p, 2)}
                            />
                            <label className="form-check-label">
                              {p.name}{" "}
                              <small className="text-muted">({p.role})</small>
                            </label>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger border-0"
                            onClick={() => handleDeletePlayer(p._id)}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <label>Overs</label>
              <input
                type="number"
                className="form-control"
                value={maxOvers}
                onChange={(e) => setMaxOvers(Number(e.target.value))}
              />
            </div>

            <div className="toss-section bg-dark text-white p-4 rounded mt-4">
              <h3>Match Setup: Toss & Roles</h3>
              <div className="row g-3">
                {/* Toss Winner */}
                <div className="col-md-6">
                  <label>Who won the toss?</label>
                  <select
                    className="form-select"
                    onChange={(e) => setTossWinner(e.target.value)}
                  >
                    <option value="">Select Winner</option>
                    <option value="Team 1">{teamName1}</option>
                    <option value="Team 2">{teamName2}</option>
                  </select>
                </div>

                {/* Toss Choice */}
                <div className="col-md-6">
                  <label>Decision</label>
                  <select
                    className="form-select"
                    onChange={(e) => setTossChoice(e.target.value)}
                  >
                    <option value="">Select Choice</option>
                    <option value="Bat">Batting</option>
                    <option value="Bowl">Bowling</option>
                  </select>
                </div>

                <hr />

                {/* Dynamic Striker Selection */}
                <div className="col-md-4">
                  <label>Striker</label>
                  <select
                    className="form-select"
                    onChange={(e) => setStrikerId(e.target.value)}
                  >
                    <option value="">Select Striker</option>
                    {(tossWinner === "Team 1" && tossChoice === "Bat") ||
                    (tossWinner === "Team 2" && tossChoice === "Bowl")
                      ? team1Squad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))
                      : team2Squad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Dynamic Non-Striker Selection */}
                <div className="col-md-4">
                  <label>Non-Striker</label>
                  <select
                    className="form-select"
                    onChange={(e) => setNonStrikerId(e.target.value)}
                  >
                    <option value="">Select Non-Striker</option>
                    {(tossWinner === "Team 1" && tossChoice === "Bat") ||
                    (tossWinner === "Team 2" && tossChoice === "Bowl")
                      ? team1Squad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))
                      : team2Squad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Dynamic Bowler Selection */}
                <div className="col-md-4">
                  <label>Opening Bowler</label>
                  <select
                    className="form-select"
                    onChange={(e) => setOpeningBowlerId(e.target.value)}
                  >
                    <option value="">Select Bowler</option>
                    {/* Bowler must be from the OPPOSITE team of the batsmen */}
                    {(tossWinner === "Team 1" && tossChoice === "Bat") ||
                    (tossWinner === "Team 2" && tossChoice === "Bowl")
                      ? team2Squad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))
                      : team1Squad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <button
                className="btn btn-warning btn-lg w-100 mt-4 fw-bold"
                onClick={handleStartMatch}
              >
                START MATCH
              </button>
              <button
                className="btn btn-outline-secondary btn-lg w-100 mt-2"
                onClick={handleNewMatch}
              >
                RESET SETUP
              </button>
            </div>
          </div>
        </div>
      ) : isGameOver ? (
        /* --- MATCH SUMMARY VIEW --- */
        <div className="summary-view p-5 m-5 border rounded bg-white shadow-lg text-center">
          <h1 className="display-4 text-success">Match Completed</h1>
          <div className="alert alert-primary h2 my-4">{matchResult}</div>

          <div className="row mt-4">
            <div className="col-md-6 border-end">
              <h4>{teamName1}</h4>
              <p className="h2">
                {innings === 1 ? runs : firstInningsScore}/
                {innings === 1 ? wickets : "?"}
              </p>
            </div>
            <div className="col-md-6">
              <h4>{teamName2}</h4>
              <p className="h2">
                {innings === 2 ? runs : "0"}/{innings === 2 ? wickets : "0"}
              </p>
            </div>
          </div>
          <div className="card shadow mt-4">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">Full Batting Scorecard</h5>
            </div>
            <div className="card-body p-0">
              <table className="table table-striped mb-0">
                <thead>
                  <tr>
                    <th>Batsman</th>
                    <th>Status</th>
                    <th>Runs</th>
                    <th>Balls</th>
                    <th>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {battingStats.map((p, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>
                        <small className="text-muted">{p.status}</small>
                      </td>
                      <td>{p.runs}</td>
                      <td>{p.balls}</td>
                      <td>
                        {p.balls > 0
                          ? ((p.runs / p.balls) * 100).toFixed(1)
                          : "0.0"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card shadow mt-4">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Bowling Analysis</h5>
            </div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Bowler</th>
                    <th>Overs</th>
                    <th>Runs</th>
                    <th>Wickets</th>
                    <th>Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {bowlingStats.map((b, i) => (
                    <tr key={i}>
                      <td>{b.name}</td>
                      <td>
                        {Math.floor(b.balls / 6)}.{b.balls % 6}
                      </td>
                      <td>{b.runs}</td>
                      <td>
                        <strong>{b.wickets}</strong>
                      </td>
                      <td>
                        {b.balls > 0
                          ? (b.runs / (b.balls / 6)).toFixed(2)
                          : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5">
            <button className="btn btn-dark m-2" onClick={() => window.print()}>
              Download PDF
            </button>
            <button
              className="btn btn-danger m-2"
              onClick={handleNewMatch} // Changed from window.location.reload()
            >
              New Match
            </button>
          </div>
        </div>
      ) : (
        <div className="Main">
          <div className="topbar bg-dark text-white p-3 d-flex justify-content-around">
            <div>{teamName1}</div>
            <div className="h3">
              {runs}/{wickets}{" "}
              <small>
                ({overCount}.{ballCount})
              </small>
            </div>
            <div>{teamName2}</div>
            <button
              className="btn btn-danger m-4"
              onClick={handleNewMatch} // Changed from window.location.reload()
            >
              New Match
            </button>
          </div>

          {innings === 2 && target && (
            <div className="bg-warning p-2 text-center shadow-sm">
              <span className="fw-bold">Target: {target}</span>
              <span className="mx-3">|</span>
              <span>
                Need <strong>{Math.max(0, target - runs)}</strong> runs in{" "}
                <strong>{Math.max(0, maxOvers * 6 - balls)}</strong> balls
              </span>
              <span className="mx-3">|</span>
              <span>
                RRR:{" "}
                <strong>
                  {maxOvers * 6 - balls > 0
                    ? (((target - runs) / (maxOvers * 6 - balls)) * 6).toFixed(
                        2
                      )
                    : "0.00"}
                </strong>
              </span>
            </div>
          )}
          <div className="container mt-4">
            <div className="row">
              <div className="col-md-4">
                <h3>Control Panel</h3>
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <button
                    key={r}
                    className="btn btn-success m-1"
                    onClick={() => handleRuns(r)}
                  >
                    {r}
                  </button>
                ))}
                <div className="mt-2">
                  <button className="btn btn-danger m-1" onClick={handleExtra}>
                    Wd/NB
                  </button>
                  <button className="btn btn-dark m-1" onClick={handleWicket}>
                    Wic
                  </button>
                  <button
                    className="btn btn-secondary m-1"
                    onClick={handleChangeStrike}
                  >
                    🔄 Strike
                  </button>
                  <button
                    className="btn btn-outline-danger m-1"
                    onClick={handleUndo}
                  >
                    ↩️ Undo
                  </button>
                </div>
                {innings === 1 && (
                  <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={switchInnings}
                  >
                    Finish Innings
                  </button>
                )}
              </div>

              <div className="col-md-4">
                <h3 className="Timeline">Timeline</h3>
                <div className="d-flex gap-2">
                  {history.map((ball, i) => (
                    <div
                      key={i}
                      className="ball-circle p-2 border rounded-circle bg-light"
                    >
                      {ball}
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-md-4">
                <h5>Current Bowler</h5>
                <select
                  className="form-select"
                  value={activeBowlerId}
                  onChange={(e) => setActiveBowlerId(Number(e.target.value))}
                >
                  {bowlers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row mt-5">
              <div className="col-md-6">
                <h5>Batting</h5>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>R</th>
                      <th>B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p) => (
                      <tr
                        key={p.id}
                        className={
                          p.isOnStrike ? "table-primary fw-bold" : "text-muted"
                        }
                      >
                        <td>
                          {p.isOnStrike ? "🏏 " : ""}
                          {p.name}
                        </td>
                        <td>
                          {p.runs} ({p.balls})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row mt-4">
                <div className="col-12">
                  <h5 className="text-danger fw-bold">Fall of Wickets</h5>
                  <table className="table table-sm table-hover border">
                    <thead className="table-dark">
                      <tr>
                        <th>Wkt</th>
                        <th>Player</th>
                        <th>Dismissal</th> {/* New Column */}
                        <th>Score</th>
                        <th>Over</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fallOfWickets.map((f, index) => (
                        <tr key={index}>
                          <td>{f.wicketNumber}</td>
                          <td>{f.playerOut}</td>
                          <td className="text-muted italic">{f.dismissal}</td>
                          <td>
                            <strong>{f.score}</strong>
                          </td>
                          <td>{f.overs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-md-6">
                <h5>Bowling Card</h5>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Bowler</th>
                      <th>O</th>
                      <th>R</th>
                      <th>W</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlers.map((b) => (
                      <tr
                        key={b.id}
                        className={b.id === activeBowlerId ? "table-info" : ""}
                      >
                        <td>{b.name}</td>
                        <td>
                          {Math.floor(b.balls / 6)}.{b.balls % 6}
                        </td>
                        <td>{b.runs}</td>
                        <td>{b.wickets}</td>
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
