import React, { useEffect, useState } from 'react';

const MatchHistory = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const response = await fetch('http://localhost:3002/get-matches');
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

    if (loading) return <div className="text-center mt-5">Loading History...</div>;

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Past Match Results</h2>
            <div className="table-responsive shadow rounded">
                <table className="table table-hover table-striped mb-0">
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
                        {matches.map((match) => (
                            <tr key={match._id}>
                                <td>{new Date(match.date).toLocaleDateString()}</td>
                                <td>{match.teamName1} vs {match.teamName2}</td>
                                <td>{match.firstInningsScore}</td>
                                <td>{match.score}/{match.wickets}</td>
                                <td className="fw-bold text-primary">{match.result}</td>
                            </tr>
                        ))}
                        {matches.length === 0 && (
                            <tr><td colSpan="5" className="text-center">No matches found in database.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MatchHistory;