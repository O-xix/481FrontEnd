import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Adjust path if needed
import './DeltaTableView.css';


// Define types for our data for better type-checking
type Creation = {
  id: number;
  timestamp: string;
  record_data: object;
  session_id: string;
};

type Delta = {
  id: number;
  master_id: number;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  column_name: string;
  new_value: any;
  session_id: string;
};

function DeltaTableView() {
  // --- State Management ---
  const [loading, setLoading] = useState<boolean>(true);
  const [creationsData, setCreationsData] = useState<Creation[]>([]);
  const [deltasData, setDeltasData] = useState<Delta[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch both creations and deltas concurrently
        const [creationsResponse, deltasResponse] = await Promise.all([
          supabase.from('user_creations').select('*'),
          supabase.from('user_deltas').select('*')
        ]);

        if (creationsResponse.error) throw creationsResponse.error;
        if (deltasResponse.error) throw deltasResponse.error;

        setCreationsData(creationsResponse.data || []);
        setDeltasData(deltasResponse.data || []);

      } catch (err: any) {
        console.error("Error fetching delta data:", err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Re-run this effect only once when the component mounts

  // --- Render Logic ---
  if (loading) return <div className="delta-view-container">Loading session data...</div>;
  if (error) return <div className="delta-view-container error-message">{error}</div>;

  return (
    <div className="delta-view-container">
      <h2>User Creations</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Record Data (Truncated)</th>
            </tr>
          </thead>
          <tbody>
            {creationsData.length > 0 ? creationsData.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{new Date(item.timestamp).toLocaleString()}</td>
                <td>{`${JSON.stringify(item.record_data).substring(0, 50)}...`}</td>
              </tr>
            )) : (
              <tr><td colSpan={3}>No creation records found for this session.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2>User Deltas</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Master ID</th>
              <th>Operation</th>
              <th>Column</th>
              <th>New Value</th>
            </tr>
          </thead>
          <tbody>
            {deltasData.length > 0 ? deltasData.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.master_id}</td>
                <td>{item.operation}</td>
                <td>{item.column_name}</td>
                <td>{String(item.new_value)}</td>
              </tr>
            )) : (
              <tr><td colSpan={5}>No delta records found for this session.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DeltaTableView;
