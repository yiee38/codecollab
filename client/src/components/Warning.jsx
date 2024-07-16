import React, { useEffect } from 'react';
import './WarningMessage.css';

const WarningMessage = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // 6000 milliseconds = 6 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="warning-message" onClick={onClose}>
      <span>{message}</span>
    </div>
  );
};

export default WarningMessage;
