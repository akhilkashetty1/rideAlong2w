import React from 'react';
import mainPage from '../assets/mainPage.jpg';
import './page1.css'; 

const Page1 = ({ onNext }) => {
  return (
    <div className="page1-container">
      <img src={mainPage.src} alt="Placeholder" className="center-image" />
      <button 
        className="start-assignment-btn" 
        onClick={onNext}
      >
        START ASSESSMENT
      </button>
    </div>
  );
};

export default Page1;
