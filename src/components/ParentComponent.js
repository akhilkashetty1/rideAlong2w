"use client";

// src/components/ParentComponent.js

import React, { useState } from 'react';
import Page1 from './page1';
import Page2 from './page2';
import RiderGuidelines from './riderGuidelines';
import RiderAssessment from './RiderAssessment'; 
import VehicleAssessment from './VehicleAssessment';
import VehicleDetails from './VehicleDetails';
import ReviewPage from './ReviewPage'; 
import ThankYou from './ThankYou';

const ParentComponent = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-GB'),
    hq: '',
    name: '',
    team: '',
    lineMan: '',
    vehicleAssessment: {},
    riderAssessment: {},  // Add riderAssessment here
    vehicleDetails: {},
  });

  const handleFormChange = (page, name, value) => {
    if (['date', 'hq', 'name', 'team', 'lineMan'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [page]: {
          ...prev[page],
          [name]: value,
        },
      }));
    }
  };

  const goToNextPage = () => {
    if (currentPage === 1 && (formData.date && formData.hq && formData.name && formData.team && formData.lineMan)) {
      setCurrentPage(currentPage + 1);
    } else if (currentPage === 2) {
      setCurrentPage(currentPage + 1);
    } else if (currentPage === 3) {
      setCurrentPage(currentPage + 1);
    } else if (currentPage === 4) {
      setCurrentPage(currentPage + 1);  // Go to RiderAssessment
    } else if (currentPage === 5) {
      setCurrentPage(currentPage + 1);  // Go to VehicleDetails
    } else if (currentPage === 6) {
      setCurrentPage(currentPage + 1);  // Go to ReviewPage
    }
  };

  const goToPreviousPage = () => {
    setCurrentPage(currentPage - 1);
  };

  const handlePreview = () => {
    setCurrentPage(7); // Navigate to ReviewPage
  };

  return (
    <div>
      {currentPage === 1 && <Page1 onNext={() => setCurrentPage(2)} />}
      {currentPage === 2 && <Page2 onNext={() => setCurrentPage(3)} onPrevious={() => setCurrentPage(1)} />}
      {currentPage === 3 && <RiderGuidelines onNext={() => setCurrentPage(4)} onPrevious={() => setCurrentPage(2)} />}
      {currentPage === 4 && (
        <VehicleAssessment 
          formData={formData} 
          handleFormChange={handleFormChange} 
          onNext={() => setCurrentPage(5)}  // Link to RiderAssessment
          onPreview={handlePreview} // Link to ReviewPage
          onPrevious={goToPreviousPage} 
        />
      )}
      {currentPage === 5 && (
        <RiderAssessment 
          formData={formData} 
          handleFormChange={handleFormChange} 
          onNext={() => setCurrentPage(6)} 
          onPrevious={() => setCurrentPage(4)}  // Link back to VehicleAssessment
        />
      )}
      {currentPage === 6 && (
        <VehicleDetails
          formData={formData}
          handleFormChange={handleFormChange}
          onNext={goToNextPage}
          onPrevious={() => setCurrentPage(5)} // Link back to RiderAssessment
        />
      )}
      {currentPage === 7 && (
        <ReviewPage
          formData={formData}
          onPrevious={() => setCurrentPage(6)}
          onNext={() => setCurrentPage(8)} // Link back to VehicleDetails
        />
      )}
      {currentPage === 8 && <ThankYou/>} 
    </div>
  );
};

export default ParentComponent;
