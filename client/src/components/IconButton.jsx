import React from 'react';
import { FaBeer } from 'react-icons/fa';
import './IconButton.css'; // Import the CSS file for styling

const IconButton = ({ onClick }) => {
  return (
    <button className="icon-button" onClick={onClick}>
      <FaBeer className="icon" />
    </button>
  );
};

export default IconButton;
