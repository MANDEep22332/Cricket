import React, { useEffect, useState } from "react";

const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set this to 3002 to match your backend port
  const API_URL = "http://localhost:3002";

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch(`${API_URL}/get-matches`);
        const data = await response.json();
        setMatches(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching history:", error);
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  if (loading)
    return <div className="text-center mt-5">Loading History...</div>;

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Past Match Results</h2>
      <div className="table-responsive shadow rounded">
        <table className="table table-hover mb-0">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>Teams</th>
              <th>T1 Score</th>
              <th>T2 Score</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No matches found.
                </td>
              </tr>
            ) : (
              matches.map((match) => (
                <React.Fragment key={match._id}>
                  {/* MAIN MATCH ROW */}
                  <tr className="table-light">
                    <td>{new Date(match.date).toLocaleDateString()}</td>
                    <td>
                      <strong>{match.teamName1}</strong> vs{" "}
                      <strong>{match.teamName2}</strong>
                    </td>
                    <td>{match.firstInningsScore} Runs</td>
                    <td>
                      {match.score}/{match.wickets} ({match.overs} ov)
                    </td>
                    <td className="fw-bold text-primary">{match.result}</td>
                  </tr>
                  {match.fullScorecard && (
                    <div className="mt-3">
                      <h6>Batting Performance:</h6>
                      <ul className="list-group">
                        {match.fullScorecard.map((player, idx) => (
                          <li
                            key={idx}
                            className="list-group-item d-flex justify-content-between"
                          >
                            <span>
                              {player.name} ({player.status})
                            </span>
                            <span>
                              <strong>{player.runs}</strong> runs in{" "}
                              <strong>{player.balls}</strong> balls
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* FALL OF WICKETS ROW */}
                  {match.fallOfWickets && match.fallOfWickets.length > 0 && (
                    <tr>
                      <td colSpan="5" className="bg-white px-4 py-2">
                        <div className="small">
                          <span className="fw-bold text-muted">
                            Fall of Wickets:{" "}
                          </span>
                          {match.fallOfWickets.map((fow, i) => (
                            <span key={i} className="me-2 text-secondary">
                              {fow.wicketNumber}-{fow.score} ({fow.playerOut},{" "}
                              {fow.overs} ov)
                              {i < match.fallOfWickets.length - 1 ? " | " : ""}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchHistory;
