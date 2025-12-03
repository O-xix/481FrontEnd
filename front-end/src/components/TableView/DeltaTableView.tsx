import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from './supabaseClient'; // Adjust path if needed
import './DeltaTableView.css';
import { Modal, handleCreateNewRecord } from './UserModification';
import { UpdateDeleteModal } from './UpdateDeleteModal';


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
  const [isCreateModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [sessionId] = useState<string>('07734'); // Placeholder

  // --- Form State ---
  // For now, a simple example. This would be expanded for all 49 fields.
  const [newRecordForm, setNewRecordForm] = useState<any>({
    "ID": "A-NEW",
    "Source": "Source-UI",
    "Severity": 3,
    "Start_Time": new Date().toISOString().slice(0, 16),
    "End_Time": new Date().toISOString().slice(0, 16),
    "Start_Lat": 40.0,
    "Start_Lng": -83.0,
    "End_Lat": null,
    "End_Lng": null,
    "Distance(mi)": 0.1,
    "Description": "A new accident report.",
    "Street": "",
    "City": "",
    "County": "",
    "State": "",
    "Zipcode": "",
    "Country": "US",
    "Timezone": "US/Eastern",
    "Airport_Code": "",
    "Weather_Timestamp": new Date().toISOString().slice(0, 16),
    "Temperature(F)": 75.0,
    "Wind_Chill(F)": null,
    "Humidity(%)": 50,
    "Pressure(in)": 29.9,
    "Visibility(mi)": 10,
    "Wind_Direction": "Calm",
    "Wind_Speed(mph)": 0,
    "Precipitation(in)": 0,
    "Weather_Condition": "Clear",
    "Amenity": false,
    "Bump": false,
    "Crossing": false,
    "Give_Way": false,
    "Junction": false,
    "No_Exit": false,
    "Railway": false,
    "Roundabout": false,
    "Station": false,
    "Stop": false,
    "Traffic_Calming": false,
    "Traffic_Signal": false,
    "Turning_Loop": false,
    "Sunrise_Sunset": "Day",
    "Civil_Twilight": "Day",
    "Nautical_Twilight": "Day",
    "Astronomical_Twilight": "Day"
  });

  const fetchAllData = async () => {
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

  // --- Data Fetching ---
  useEffect(() => {
    fetchAllData();
  }, []); // Re-run this effect only once when the component mounts

  // --- Event Handlers ---
  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // In a real scenario, newRecordForm would contain all 49 fields
      await handleCreateNewRecord(newRecordForm, sessionId); // Use the existing sessionId from state
      setCreateModalOpen(false); // Close modal on success
      fetchAllData(); // Refresh the data in the table
    } catch (error) {
      // Error is already logged in the handler, but you could set a form-specific error state here
      alert('Failed to create record.');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let finalValue: any = value;
    if (type === 'number') {
        finalValue = value === '' ? null : parseFloat(value);
    }
    if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
    }
    setNewRecordForm({ ...newRecordForm, [name]: finalValue });
  };

  // --- Render Logic ---
  if (loading) return <div className="delta-view-container">Loading session data...</div>;
  if (error) return <div className="delta-view-container error-message">{error}</div>;

  return (
    <div className="delta-view-container">
      <div className="table-header">
        <h2>User Creations</h2>
        <button onClick={() => setCreateModalOpen(true)}>Create New Record</button>
      </div>
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

      <div className="table-header">
        <h2>User Deltas</h2>
        <button onClick={() => setUpdateModalOpen(true)}>Edit/Delete Record</button>
      </div>
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)}>
        <h2>Create New Accident Record</h2>
        <form onSubmit={handleCreateSubmit} className="modal-form">
          <div className="form-grid">
            {/* We map over the keys of the form state to generate the form fields dynamically */}
            {Object.keys(newRecordForm).map(key => {
              const value = newRecordForm[key];
              const type = typeof value;

              let inputElement;

              if (type === 'boolean') {
                inputElement = (
                  <div className="form-group-checkbox" key={key}>
                    <label htmlFor={key}>{key}</label>
                    <input id={key} name={key} type="checkbox" checked={value} onChange={handleFormChange} />
                  </div>
                );
              } else if (key.includes('Time')) {
                 inputElement = (
                  <div className="form-group" key={key}>
                    <label htmlFor={key}>{key}</label>
                    <input id={key} name={key} type="datetime-local" value={value || ''} onChange={handleFormChange} />
                  </div>
                );
              } else {
                inputElement = (
                  <div className="form-group" key={key}>
                    <label htmlFor={key}>{key}</label>
                    <input
                      id={key}
                      name={key}
                      type={type === 'number' ? 'number' : 'text'}
                      value={value ?? ''} // Use empty string for null/undefined to avoid React warnings
                      onChange={handleFormChange}
                      step={type === 'number' ? 'any' : undefined} // Allow decimals for numbers
                    />
                  </div>
                );
              }
              return inputElement;
            })}
          </div>
          <button type="submit">Submit New Record</button>
        </form>
      </Modal>

      <UpdateDeleteModal
        isOpen={isUpdateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        currentSessionId={sessionId}
        onActionComplete={fetchAllData}
      />
    </div>
  );
}

export default DeltaTableView;
