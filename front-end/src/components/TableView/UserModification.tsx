import React from 'react';
import { supabase } from './supabaseClient'; // Adjust path if needed
import './Modal.css';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};


// --- Supabase Interaction Functions ---

/**
 * Inserts a new full accident row into the user_creations table.
 * @param newRecordData - A full JavaScript object of the 49 accident columns.
 * @param sessionId - The current user session ID.
 * @returns The newly created record or an error.
 */
export const handleCreateNewRecord = async (newRecordData: object, sessionId: string) => {
  const { data, error } = await supabase
    .from('user_creations')
    .insert([
      { session_id: sessionId, record_data: newRecordData }
    ])
    .select();

  if (error) {
    console.error('Error creating new record:', error);
    throw error;
  }

  return data;
};

/**
 * Inserts an UPDATE delta record into the user_deltas table.
 * @param masterId - The ID from the master data.
 * @param column - The name of the column being changed.
 * @param newValue - The new value for the column.
 * @param sessionId - The current user session ID.
 * @returns The newly created delta record or an error.
 */
export const handleUpdateExistingRecord = async (masterId: string, column: string, newValue: string | number, sessionId: string) => {
  const { data, error } = await supabase
    .from('user_deltas')
    .insert([
      { session_id: sessionId, master_id: masterId, operation: 'UPDATE', column_name: column, new_value: newValue }
    ])
    .select();

  if (error) {
    console.error('Error creating update delta:', error);
    throw error;
  }

  return data;
};

/**
 * Inserts a DELETE delta record into the user_deltas table.
 * @param masterId - The ID from the master data.
 * @param sessionId - The current user session ID.
 * @returns The newly created delta record or an error.
 */
export const handleDeleteExistingRecord = async (masterId: string, sessionId: string) => {
  const { data, error } = await supabase
    .from('user_deltas')
    .insert([
      { session_id: sessionId, master_id: masterId, operation: 'DELETE' }
    ])
    .select();

  if (error) {
    console.error('Error creating delete delta:', error);
    throw error;
  }

  return data;
};
