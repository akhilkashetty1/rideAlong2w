import React, { useState, useEffect } from 'react';
import './VehicleDetails.css'; // Ensure uniform styling as per requirements
import NavigationSteps from './NavigationSteps';
import watermark from '../assets/waterMark.png';

const VehicleDetails = ({ formData, handleFormChange, onNext, onPrevious }) => {
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [showSecondaryVehicle, setShowSecondaryVehicle] = useState(formData.vehicleDetails.useSecondaryVehicle === 'No');
  const [formSubmitted, setFormSubmitted] = useState(false); // Track if form is submitted
  const [fuelTypeOptions, setFuelTypeOptions] = useState(['Petrol', 'EV']); // State to manage primary vehicle fuel options
  const [secondaryFuelTypeOptions, setSecondaryFuelTypeOptions] = useState(['Petrol', 'EV']); // State to manage secondary vehicle fuel options

  const handleCheckboxChange = (e) => {
    setIsCheckboxChecked(e.target.checked);
  };

  const handleFieldChange = (e, field) => {
    const { value } = e.target;

    // Update fuel options dynamically based on primary vehicle selection
    if (field === 'primaryVehicle') {
      const newFuelOptions = value === '2 Wheeler' ? ['Petrol', 'EV'] : ['Petrol', 'Diesel', 'EV'];
      setFuelTypeOptions(newFuelOptions);
    }

    handleFormChange('vehicleDetails', field, value);
  };

  const handleSecondaryVehicleChange = (e) => {
    const { value } = e.target;
    handleFieldChange(e, 'useSecondaryVehicle');
    setShowSecondaryVehicle(value === 'Yes');
  };

  const handleSecondaryFieldChange = (e, field) => {
    const { value } = e.target;

    // Update fuel options dynamically based on secondary vehicle selection
    if (field === 'secondaryVehicle') {
      const newFuelOptions = value === '2 Wheeler' ? ['Petrol', 'EV'] : ['Petrol', 'Diesel', 'EV'];
      setSecondaryFuelTypeOptions(newFuelOptions);
    }

    handleFormChange('vehicleDetails', field, value);
  };

  useEffect(() => {
    // Scroll to top of the page when component mounts
    window.scrollTo(0, 0);
  },[]);

  useEffect(() => {

    // Set default for primary vehicle if not already set
    if (!formData.vehicleDetails.primaryVehicle) {
      handleFormChange('vehicleDetails', 'primaryVehicle', '2 Wheeler');
    }

     // Set "useSecondaryVehicle" to "Yes" by default
    if (!formData.vehicleDetails.useSecondaryVehicle) {
      handleFormChange('vehicleDetails', 'useSecondaryVehicle', 'Yes');
      setShowSecondaryVehicle(true); // Ensure the dependent form is visible
    } else {
      setShowSecondaryVehicle(formData.vehicleDetails.useSecondaryVehicle === 'Yes');
    }

    // Set default for secondary vehicle if not already set
    if (formData.vehicleDetails.useSecondaryVehicle === 'Yes' && !formData.vehicleDetails.secondaryVehicle) {
      handleFormChange('vehicleDetails', 'secondaryVehicle', '2 Wheeler');
    }

    // Set default for primary vehicle fuel Type if not already set
    if (!formData.vehicleDetails.fuelType) {
      handleFormChange('vehicleDetails', 'fuelType', 'Petrol');
    }

    // Set default for primary vehicle if not already set
    if (formData.vehicleDetails.useSecondaryVehicle === 'Yes' && !formData.vehicleDetails.secondaryVehicleFuelType) {
      handleFormChange('vehicleDetails', 'secondaryVehicleFuelType', 'Petrol');
    }
  }, [formData.vehicleDetails, handleFormChange]);

  const handleSubmit = () => {
    setFormSubmitted(true);
    if (isCheckboxChecked) {
      onNext();
    }
  };

  const questions = [
    {
      label: 'Primary Vehicle',
      type: 'dropdown',
      name: 'primaryVehicle',
      options: ['2 Wheeler', '4 Wheeler'],
    },
    {
      label: 'Primary Vehicle Fuel Type',
      type: 'dropdown',
      name: 'fuelType',
      options: fuelTypeOptions, // Use the dynamically updated fuel type options
    },
    {
      label: 'Vehicle Number ',
      type: 'text',
      name: 'primaryVehicleNumber',
    },
    {
      label: 'Manufacturer',
      type: 'text',
      name: 'primaryVehicleManufacturer',
    },
    {
      label: 'Model',
      type: 'text',
      name: 'primaryVehicleModel',
    },
    {
      label: 'Do you use a Secondary Vehicle for field work?',
      type: 'radio',
      name: 'useSecondaryVehicle',
      options: ['Yes', 'No'],
    }
  ];

  const secondaryVehicleQuestions = [
    {
      label: 'Secondary Vehicle',
      type: 'dropdown',
      name: 'secondaryVehicle',
      options: ['2 Wheeler', '4 Wheeler'],
    },
    {
      label: 'Secondary Vehicle Fuel Type',
      type: 'dropdown',
      name: 'secondaryVehicleFuelType',
      options: secondaryFuelTypeOptions, // Use dynamically updated secondary vehicle fuel type options
    },
    {
      label: 'Secondary Vehicle Number',
      type: 'text',
      name: 'secondaryVehicleNumber',
    },
    {
      label: 'Secondary Manufacturer',
      type: 'text',
      name: 'secondaryVehicleManufacturer',
    },
    {
      label: 'Secondary Model',
      type: 'text',
      name: 'secondaryVehicleModel',
    }
  ];

  return (
    <div className="vehicle-details-container">
      <h1 className='main-heading'>TWO WHEELER RIDE ALONG FORM</h1>
      <NavigationSteps currentStep="vehicleDetails" />
      <div className="watermark">
        <img src={watermark.src} alt="Watermark" />
      </div>

      <form>
        {questions.map((question, index) => (
          <div key={index} className="question-container">
            <label className="question-text">{question.label}</label>
            <div className="response-container">
              {question.type === 'dropdown' && (
                <select
                  name={question.name}
                  value={formData.vehicleDetails[question.name] || question.options[0]}
                  onChange={(e) => handleFieldChange(e, question.name)}
                  className="form-dropdown"
                >
                  {question.options.map((option, idx) => (
                    <option key={idx} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              {question.type === 'radio' && (
                question.options.map((option, idx) => (
                  <label key={idx} className="radio-label">
                    <input
                      type="radio"
                      name={question.name}
                      value={option}
                      checked={formData.vehicleDetails[question.name] === option || (!formData.vehicleDetails[question.name] && option === 'No')}
                      onChange={handleSecondaryVehicleChange}
                    />
                    {option}
                  </label>
                ))
              )}
              {question.type === 'text' && (
                <input
                  type="text"
                  name={question.name}
                  value={formData.vehicleDetails[question.name] || ''}
                  onChange={(e) => handleFieldChange(e, question.name)}
                  className="form-input"
                />
              )}
            </div>
          </div>
        ))}

        {showSecondaryVehicle && (
          <>
            {secondaryVehicleQuestions.map((question, index) => (
              <div key={index} className="question-container">
                <label className="question-text">{question.label}</label>
                <div className="response-container">
                  {question.type === 'dropdown' && (
                    <select
                      name={question.name}
                      value={formData.vehicleDetails[question.name] || question.options[0]}
                      onChange={(e) => handleSecondaryFieldChange(e, question.name)}
                      className="form-dropdown"
                    >
                      {question.options.map((option, idx) => (
                        <option key={idx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                  {question.type === 'text' && (
                    <input
                      type="text"
                      name={question.name}
                      value={formData.vehicleDetails[question.name] || ''}
                      onChange={(e) => handleSecondaryFieldChange(e, question.name)}
                      className="form-input"
                    />
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        <div className="checkbox-container">
          <label>
            <input
              type="checkbox"
              checked={isCheckboxChecked}
              onChange={handleCheckboxChange}
              className="checkbox-input"
            />
            <span className="checkbox-label">I confirm that I have personally checked and verified the assessment details of the vehicle and the rider.</span>
          </label>
          {formSubmitted && !isCheckboxChecked && <p className="checkbox-alert">Please tick the checkbox</p>}
        </div>

        <div className="button-group">
          <button type="button" onClick={onPrevious} className="btn btn-previous">Previous</button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-next"
          >
            Submit and Preview
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleDetails;
