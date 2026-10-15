// src/pages/VehicleAssessment.js

import React, { useState, useEffect } from 'react';
import './VehicleAssessment.css';
import NavigationSteps from './NavigationSteps';
import watermark from '../assets/waterMark.png';

const VehicleAssessment = ({ formData, handleFormChange, onNext, onPrevious }) => {
  const [showAlerts, setShowAlerts] = useState(false);

  const questions = [
    "1. Is the Vehicle Tyre Pressure correct? Instruct the employee to check tyre pressure at a fuel station and ensure the air is filled according to the manufacturer’s instructions.",
    "2. How is the treading condition of the tyres? Are there any cuts?",
    "3. Is the speedometer functioning properly?",
    "4. Is the fuel meter functioning properly?",
    "5. Are both mirrors present? Is it positioned properly as per rider's eye line?",
    "6. Do the front and rear brakes function properly?",
    "7. Is the horn functioning properly?",
    "8. Is the auto/kick starter functioning properly?",
    "9. Is the vehicle key in good condition? Check for any bend or rust.",
    "10. How is the seat condition of the vehicle? Is there any damage/cuts?",
    "11. Is the main stand & side stand functioning properly?",
    "12. Are the number plates of the vehicle clearly visible?",
  ];

  useEffect(() => {
    // Scroll to top of the page when component mounts
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e, questionIndex, type) => {
    const { value } = e.target;
    
    if (type === 'radio') {
      handleFormChange('vehicleAssessment', `${questionIndex}-answer`, value);
    } else if (type === 'remark') {
      handleFormChange('vehicleAssessment', `${questionIndex}-remark`, value);
    }
  };
  

  const handleNext = () => {
    if (!formData.date || !formData.hq || !formData.name || !formData.team || !formData.lineMan) {
      setShowAlerts(true);
    } else {
      setShowAlerts(false);
      onNext();
    }
  };

  return (
    <div className="vehicle-assessment-container">
      <h1 className='main-heading'>TWO WHEELER RIDE ALONG FORM</h1>
      <NavigationSteps currentStep="vehicleAssessment" />
      {/* <div className="mandatory-question-container">
        <div className="mandatory-question-text">
          <strong>Are you a new joinee or existing employee?</strong>
        </div>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="employee-status"
              value="Existing"
              defaultChecked
              onChange={(e) => handleFormChange('vehicleAssessment', 'employee-status', e.target.value)}
            />
            Existing Employee
          </label>
          <label>
            <input
              type="radio"
              name="employee-status"
              value="New"
              onChange={(e) => handleFormChange('vehicleAssessment', 'employee-status', e.target.value)}
            />
            New Joinee
          </label>
        </div>
      </div> */}

      <div className="watermark">
        <img src={watermark.src} alt="Watermark" />
      </div>
      <form>
        <div className="input-container">
          {/* <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date || ''}
              onChange={(e) => handleFormChange('vehicleAssessment', 'date', e.target.value)}
              required
            />
            {showAlerts && !formData.date && <span className="alert">This field is mandatory</span>}
          </div> */}
          <div className="form-group">
            <label>HQ:</label>
            <input
              type="text"
              name="hq"
              value={formData.hq || ''}
              onChange={(e) => handleFormChange('vehicleAssessment', 'hq', e.target.value)}
              required
            />
            {showAlerts && !formData.hq && <span className="alert">This field is mandatory</span>}
          </div>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={(e) => handleFormChange('vehicleAssessment', 'name', e.target.value)}
              required
            />
            {showAlerts && !formData.name && <span className="alert">This field is mandatory</span>}
          </div>
          <div className="form-group">
            <label>Team:</label>
            <input
              type="text"
              name="team"
              value={formData.team || ''}
              onChange={(e) => handleFormChange('vehicleAssessment', 'team', e.target.value)}
              required
            />
            {showAlerts && !formData.team && <span className="alert">This field is mandatory</span>}
          </div>
          <div className="form-group">
            <label>Line Manager:</label>
            <input
              type="text"
              name="lineMan"
              value={formData.lineMan || ''}
              onChange={(e) => handleFormChange('vehicleAssessment', 'lineMan', e.target.value)}
              required
            />
            {showAlerts && !formData.lineMan && <span className="alert">This field is mandatory</span>}
          </div>
        </div>

        {questions.map((question, index) => (
          <div key={index} className="question-container">
            <div className="question-text">
              {question}
            </div>
            <div className="response-container">
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name={`question-${index}-answer`}
                    value="Yes"
                    checked={formData.vehicleAssessment[`${index}-answer`] === 'Yes' || formData.vehicleAssessment[`${index}-answer`] === undefined}
                    onChange={(e) => handleChange(e, index, 'radio')}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name={`question-${index}-answer`}
                    value="No"
                    checked={formData.vehicleAssessment[`${index}-answer`] === 'No'}
                    onChange={(e) => handleChange(e, index, 'radio')}
                  />
                  No
                </label>
              </div>
              <textarea
                name={`remark-${index}`}
                value={formData.vehicleAssessment[`${index}-remark`] || ''}
                onChange={(e) => handleChange(e, index, 'remark')}
                maxLength="175"
                placeholder="Remarks..."
              />
            </div>
          </div>
        ))}

      <div className="button-group">
        <button type="button" onClick={onPrevious} className="btn btn-previous">Previous</button>
        <button type="button" onClick={handleNext} className="btn btn-next">Next</button>
      </div>
      
      </form>
    </div>
  );
};

export default VehicleAssessment;
