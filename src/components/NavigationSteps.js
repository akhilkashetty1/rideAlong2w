// src/components/NavigationSteps.js
import React from 'react';
import './NavigationSteps.css';

const NavigationSteps = ({ currentStep }) => {
  return (
    <div className="steps-container">
      <div className={`step ${currentStep === 'vehicleAssessment' ? 'active' : 'inactive'}`}>
        Vehicle Assessment
      </div>
      <div className={`step ${currentStep === 'riderAssessment' ? 'active' : 'inactive'}`}>
        Rider Safety
      </div>
      <div className={`step ${currentStep === 'vehicleDetails' ? 'active' : 'inactive'}`}>
        Vehicle Details
      </div>
    </div>
  );
};

export default NavigationSteps;
