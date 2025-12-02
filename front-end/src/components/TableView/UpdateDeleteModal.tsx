import React, { useState } from 'react';
import { Modal, handleUpdateExistingRecord, handleDeleteExistingRecord } from './UserModification';
import './UpdateDeleteModal.css';

// List of columns the user is allowed to edit.
const editableColumns = [
  "Severity", "Description", "Weather_Condition", "Street", "City", "State", "Zipcode", "Temperature(F)", "Wind_Speed(mph)", "Visibility(mi)"
];

type UpdateDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId: string;
  onActionComplete: () => void; // Callback to refresh data in the parent
};

export const UpdateDeleteModal: React.FC<UpdateDeleteModalProps> = ({ isOpen, onClose, currentSessionId, onActionComplete }) => {
  // State for the user-inputted Master ID
  const [masterId, setMasterId] = useState<string>('');
  const [selectedColumn, setSelectedColumn] = useState<string>(editableColumns[0]);
  const [newValue, setNewValue] = useState<string>('');

  if (!isOpen) return null;

  /**
   * Submits a single update delta record for the selected column.
   */
  const handleUpdateSubmit = async () => {
    if (!masterId) {
      alert("Please enter a Master Record ID.");
      return;
    }
    if (!newValue) {
      alert("Please enter a new value for the selected column.");
      return;
    }

    try {
      // The value is sent as a string, Supabase/Postgres will handle casting if the column type is numeric.
      await handleUpdateExistingRecord(masterId, selectedColumn, newValue, currentSessionId);
      alert(`Successfully submitted update for ${selectedColumn}.`);
      handleClose();
    } catch (error) {
      alert("Failed to submit updates. Check console for details.");
    }
  };

  const handleDeleteSubmit = async () => {
    if (!masterId) {
      alert("Please enter a Master Record ID to delete.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete record ${masterId}? This action cannot be undone.`)) {
      try {
        await handleDeleteExistingRecord(masterId, currentSessionId);
        alert(`Record ${masterId} has been marked for deletion.`);
        handleClose();
      } catch (error) {
        alert("Failed to delete record. Check console for details.");
      }
    }
  };

  const handleClose = () => {
    setMasterId('');
    setSelectedColumn(editableColumns[0]);
    setNewValue('');
    onActionComplete(); // Refresh parent data
    onClose(); // This is the original onClose from props to hide the modal
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h2>Edit or Delete an Existing Record</h2>
      <div className="update-form">
        <div className="form-field">
          <label>Master Record ID (e.g., "A-1", "A-2")</label>
          <input type="text" placeholder="Enter ID of the record to modify" value={masterId} onChange={(e) => setMasterId(e.target.value)} className="master-id-input" />
        </div>

        <p className="form-instructions">Select a column and enter the new value you wish to submit.</p>

        <div className="form-field">
          <label>Column to Update</label>
          <select value={selectedColumn} onChange={(e) => setSelectedColumn(e.target.value)}>
            {editableColumns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label>New Value for "{selectedColumn}"</label>
          <input type="text" placeholder="Enter the new value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
        </div>
      </div>
      <div className="modal-actions">
        <button className="update-btn" onClick={handleUpdateSubmit}>Submit Updates</button>
        <button className="delete-btn" onClick={handleDeleteSubmit}>Delete Record</button>
      </div>
    </Modal>
  );
};