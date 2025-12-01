import React, { useState, useEffect } from 'react';
import React, { useState } from 'react';
import { Modal, handleUpdateExistingRecord, handleDeleteExistingRecord } from './UserModification';
import './UpdateDeleteModal.css';

// Define a type for the incoming row data to ensure type safety
type RowData = {
  ID: string;
  Severity: number;
  Description: string;
  Weather_Condition: string;
  [key: string]: any; // Allow other properties
};

type UpdateDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  rowData: RowData | null;
  currentSessionId: string;
  onActionComplete: () => void; // Callback to refresh data in the parent
};

export const UpdateDeleteModal: React.FC<UpdateDeleteModalProps> = ({ isOpen, onClose, rowData, currentSessionId, onActionComplete }) => {
export const UpdateDeleteModal: React.FC<UpdateDeleteModalProps> = ({ isOpen, onClose, currentSessionId, onActionComplete }) => {
  // State for the user-inputted Master ID
  const [masterId, setMasterId] = useState<string>('');

  // State to hold the new values from the form inputs
  const [formState, setFormState] = useState({
    Severity: rowData?.Severity || 0,
    Description: rowData?.Description || '',
    Weather_Condition: rowData?.Weather_Condition || '',
    Severity: '',
    Description: '',
    Weather_Condition: '',
  });

  // Effect to reset form state when a new row is passed in
  useEffect(() => {
    if (rowData) {
      setFormState({
        Severity: rowData.Severity,
        Description: rowData.Description,
        Weather_Condition: rowData.Weather_Condition,
      });
    }
  }, [rowData]);
  if (!isOpen) return null;

  if (!isOpen || !rowData) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: name === 'Severity' ? parseInt(value, 10) : value,
      [name]: value,
    }));
  };

  /**
   * Checks which fields have changed and sends a separate delta record for each modification.
   */
  const handleUpdateSubmit = async () => {
    if (!masterId) {
      alert("Please enter a Master Record ID.");
      return;
    }

    const changes: Promise<any>[] = [];
    const masterId = rowData.ID;

    // Compare each field in the form state with the original rowData
    if (formState.Severity !== rowData.Severity) {
      changes.push(handleUpdateExistingRecord(masterId, 'Severity', formState.Severity, currentSessionId));
    // For each field, if it has a value, create an update record.
    if (formState.Severity) {
      changes.push(handleUpdateExistingRecord(masterId, 'Severity', parseInt(formState.Severity, 10), currentSessionId));
    }
    if (formState.Description !== rowData.Description) {
    if (formState.Description) {
      changes.push(handleUpdateExistingRecord(masterId, 'Description', formState.Description, currentSessionId));
    }
    if (formState.Weather_Condition !== rowData.Weather_Condition) {
    if (formState.Weather_Condition) {
      changes.push(handleUpdateExistingRecord(masterId, 'Weather_Condition', formState.Weather_Condition, currentSessionId));
    }

    if (changes.length === 0) {
      alert("No changes were made.");
      alert("No new values were entered to update.");
      return;
    }

    try {
      await Promise.all(changes);
      alert(`Successfully submitted ${changes.length} update(s).`);
      onActionComplete(); // Trigger data refresh in parent
      onClose(); // Close the modal
      handleClose();
    } catch (error) {
      alert("Failed to submit updates. Check console for details.");
    }
  };

  /**
   * Sends a single delta record to mark the master record for deletion.
   */
  const handleDeleteSubmit = async () => {
    if (window.confirm(`Are you sure you want to delete record ${rowData.ID}? This action cannot be undone.`)) {
    if (!masterId) {
      alert("Please enter a Master Record ID to delete.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete record ${masterId}? This action cannot be undone.`)) {
      try {
        await handleDeleteExistingRecord(rowData.ID, currentSessionId);
        alert(`Record ${rowData.ID} has been marked for deletion.`);
        await handleDeleteExistingRecord(masterId, currentSessionId);
        alert(`Record ${masterId} has been marked for deletion.`);
        onActionComplete(); // Trigger data refresh in parent
        onClose(); // Close the modal
        handleClose();
      } catch (error) {
        alert("Failed to delete record. Check console for details.");
      }
    }
  };

  // Resets state and closes the modal
  const handleClose = () => {
    setMasterId('');
    setFormState({ Severity: '', Description: '', Weather_Condition: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Edit Record: {rowData.ID}</h2>
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h2>Edit or Delete an Existing Record</h2>
      <div className="update-form">
        {/* Master ID Field */}
        <div className="form-field">
          <label>Master Record ID (e.g., "A-1", "A-2")</label>
          <input type="text" placeholder="Enter ID of the record to modify" value={masterId} onChange={(e) => setMasterId(e.target.value)} className="master-id-input" />
        </div>

        <p className="form-instructions">Enter the new value for any field you wish to update. Leave fields blank to keep their original values.</p>

        {/* Severity Field */}
        <div className="form-field">
          <label>Severity</label>
          <div className="value-comparison">
            <p className="original-value">Original: {rowData.Severity}</p>
            <input type="number" name="Severity" value={formState.Severity} onChange={handleInputChange} />
          </div>
          <input type="number" name="Severity" placeholder="Enter new severity (e.g., 1-4)" value={formState.Severity} onChange={handleInputChange} />
        </div>

        {/* Description Field */}
        <div className="form-field">
          <label>Description</label>
          <div className="value-comparison">
            <p className="original-value">Original: {rowData.Description}</p>
            <textarea name="Description" value={formState.Description} onChange={handleInputChange} rows={4}></textarea>
          </div>
          <textarea name="Description" placeholder="Enter new description" value={formState.Description} onChange={handleInputChange} rows={3}></textarea>
        </div>

        {/* Weather Condition Field */}
        <div className="form-field">
          <label>Weather Condition</label>
          <div className="value-comparison">
            <p className="original-value">Original: {rowData.Weather_Condition}</p>
            <input type="text" name="Weather_Condition" value={formState.Weather_Condition} onChange={handleInputChange} />
          </div>
          <input type="text" name="Weather_Condition" placeholder="Enter new weather condition" value={formState.Weather_Condition} onChange={handleInputChange} />
        </div>
      </div>
      <div className="modal-actions">
        <button className="update-btn" onClick={handleUpdateSubmit}>Submit Updates</button>
        <button className="delete-btn" onClick={handleDeleteSubmit}>Delete Record</button>
      </div>
    </Modal>
  );
};