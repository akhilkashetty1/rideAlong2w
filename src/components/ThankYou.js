import React from 'react';
import thankYou from '../assets/thankYou.jpg'; // Import your image
import './ThankYou.css'; // Import the CSS for styling

const ThankYou = () => {
  return (
    <div className="image-page-container">
      <img src={thankYou.src} alt="Thank You" className="center-image" />
    </div>
  );
};

export default ThankYou;
