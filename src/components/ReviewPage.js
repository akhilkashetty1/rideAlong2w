import React, { useRef } from 'react';
import './ReviewPage.css';
import { jsPDF } from 'jspdf'; // Library for generating PDFs (named export works in both the browser and server builds)

const ReviewPage = ({ formData, onNext, onPrevious }) => {
  const reviewRef = useRef(); // Ref to target the review content for printing/PDF

  // Helper functions to handle default values dynamically
  const getAnswer = (sectionData, questionKey, defaultAnswer = "Yes") => {
    return sectionData && sectionData[`${questionKey}-answer`] ? sectionData[`${questionKey}-answer`] : defaultAnswer;
  };

  const getRemark = (sectionData, questionKey) => {
    return sectionData && sectionData[`${questionKey}-remark`] ? sectionData[`${questionKey}-remark`] : "No Remarks";
  };

  const getTextValue = (value, defaultValue = "Not Provided") => {
    return value ? value : defaultValue;
  };

  const submitToGoogleSheets = async (formData) => {
    const url = '/api/submit-to-sheets'; // This app's own API route (app/api/submit-to-sheets/route.js), formerly the Render backend
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      }); 
  
      const result = await response.json();
      if (result.result === 'success') {
        alert('Form submitted successfully ');
      } else {
        alert('Error submitting form.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while submitting the form.');
    }
  };

  // Define sections and questions dynamically
  const sections = [
    {
      title: 'Mandatory Information',
      data: formData,
      questions: [
        { label: 'Date', key: 'date' },
        { label: 'HQ', key: 'hq' },
        { label: 'Name', key: 'name' },
        { label: 'Team', key: 'team' },
        { label: 'Line Man', key: 'lineMan' },
        // { label: 'Are you a new joinee?', key: 'newJoinee', defaultAnswer: 'No' }
      ]
    },
    {
      title: 'Vehicle Assessment',
      data: formData.vehicleAssessment,
      questions: [
        "Is the Vehicle Tyre Pressure correct?",
        "How is the treading condition of the tyres?",
        "Is the speedometer functioning properly?",
        "Is the fuel meter functioning properly?",
        "Are both mirrors present? Is it positioned properly as per rider's eye line?",
        "Do the front and rear brakes function properly?",
        "Is the horn functioning properly?",
        "Is the auto/kick starter functioning properly?",
        "Is the vehicle key in good condition? Check for any bend or rust",
        "How is the seat condition of the vehicle? Is there any damage/cuts?",
        "Is the main stand & side stand functioning properly?",
        "Are the number plates of the vehicle clearly visible?"
      ]
    },
    {
      title: 'Rider Assessment',
      data: formData.riderAssessment,
      questions: [
        "Does the rider use hand signal/indicator while taking a turn?",
        "Does the rider overtake from the correct side?",
        "Does the rider wear shoes with a well-defined heel while riding?",
        "Is the rider sleepy while riding?",
        "Does the rider stop at traffic signals?",
        "Does the rider use a mobile phone while riding?",
        "Does the rider follow legal speed limits?",
        "Is the rider’s sitting posture correct? Check the position of hands, elbows, knees, and thighs.",
        "Does the rider make way for an ambulance?",
        "Is the rider courteous to other road users?",
        "Has the rider attended the Safe Rider Programme? Date:",
        "Does the rider wear an AZ Helmet with the strap buckled?",
        "Is the helmet in good condition?",
        "Does the rider wear an AZ Jacket?",
        "Is the jacket in good condition?"
      ]
    },
    {
      title: 'Vehicle Details',
      data: formData.vehicleDetails,
      questions: [
        { label: 'Primary Vehicle', key: 'primaryVehicle', defaultAnswer: '2 Wheeler' }, 
        { label: 'Primary Vehicle Fuel Type', key: 'fuelType' }, 
        { label: 'Primary Vehicle Number', key: 'primaryVehicleNumber' },
        { label: 'Primary Vehicle Manufacturer', key: 'primaryVehicleManufacturer' },
        { label: 'Primary Vehicle Model', key: 'primaryVehicleModel' },
        { label: 'Do you use a secondary vehicle for field of work?', key: 'useSecondaryVehicle', defaultAnswer: 'No' }
      ],
      secondaryQuestions: formData.vehicleDetails && formData.vehicleDetails.useSecondaryVehicle === 'Yes' ? [
        { label: 'Secondary Vehicle', key: 'secondaryVehicle', defaultAnswer: '2 Wheeler' }, 
        { label: 'Secondary Vehicle Fuel Type', key: 'secondaryVehicleFuelType' }, 
        { label: 'Secondary Vehicle Number', key: 'secondaryVehicleNumber' },
        { label: 'Secondary Vehicle Manufacturer', key: 'secondaryVehicleManufacturer' },
        { label: 'Secondary Vehicle Model', key: 'secondaryVehicleModel' }
      ] : [] // Show secondary vehicle questions only if selected
    }
  ];

  // Print functionality
  const handlePrint = () => {
    window.print(); // Use browser's print functionality
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height; // Get page height
    const lineHeight = 10; // Line height for each question
    let yPosition = 10; // Start Y position for content
  
    doc.text("Review Your Submission", 10, yPosition);
    yPosition += lineHeight * 2; // Adding space after the heading
  
    sections.forEach(section => {
      doc.setFontSize(14);
      doc.text(section.title, 10, yPosition);
      yPosition += lineHeight; // Move to the next line
  
      section.questions.forEach((question, index) => {
        if (yPosition > pageHeight - 20) {
          // If content exceeds the page height, add a new page
          doc.addPage();
          yPosition = 10; // Reset Y position for the new page
        }
  
        const questionText = typeof question === 'string' ? question : question.label;
        const answer = getTextValue(section.data[question.key] || getAnswer(section.data, index));
  
        doc.setFontSize(12); // Set font size for content
        doc.text(`${questionText}: ${answer}`, 10, yPosition);
        yPosition += lineHeight; // Move to the next line after each question
      });
  
      // Handle secondary questions for VehicleDetails section if applicable
      if (section.secondaryQuestions) {
        section.secondaryQuestions.forEach(question => {
          if (yPosition > pageHeight - 20) {
            // Add new page if content exceeds the page height
            doc.addPage();
            yPosition = 10; // Reset Y position for the new page
          }
  
          const questionText = question.label;
          const answer = getTextValue(section.data[question.key]);
  
          doc.text(`${questionText}: ${answer}`, 10, yPosition);
          yPosition += lineHeight;
        });
      }
  
      yPosition += lineHeight; // Add extra space between sections
    });
  
    doc.save('review-submission.pdf'); // Save and download the PDF
  };

  const prepareDataForGoogleSheets = (formData) => {
    const result = {};

    // Define the sections array, using the same structure as in ReviewPage
    const sections = [
      {
        title: 'Mandatory Information',
        data: formData,
        questions: [
          { label: 'Date', key: 'date' },
          { label: 'HQ', key: 'hq' },
          { label: 'Name', key: 'name' },
          { label: 'Team', key: 'team' },
          { label: 'Line Man', key: 'lineMan' }
        ]
      },
      {
        title: 'Vehicle Assessment',
        data: formData.vehicleAssessment,
        questions: [
          "Is the Vehicle Tyre Pressure correct?",
          "How is the treading condition of the tyres?",
          "Is the speedometer functioning properly?",
          "Is the fuel meter functioning properly?",
          "Are both mirrors present? Is it positioned properly as per rider's eye line?",
          "Do the front and rear brakes function properly?",
          "Is the horn functioning properly?",
          "Is the auto/kick starter functioning properly?",
          "Is the vehicle key in good condition? Check for any bend or rust",
          "How is the seat condition of the vehicle? Is there any damage/cuts?",
          "Is the main stand & side stand functioning properly?",
          "Are the number plates of the vehicle clearly visible?"
        ]
      },
      {
        title: 'Rider Assessment',
        data: formData.riderAssessment,
        questions: [
          "Does the rider use hand signal/indicator while taking a turn?",
          "Does the rider overtake from the correct side?",
          "Does the rider wear shoes with a well-defined heel while riding?",
          "Is the rider sleepy while riding?",
          "Does the rider stop at traffic signals?",
          "Does the rider use a mobile phone while riding?",
          "Does the rider follow legal speed limits?",
          "Is the rider’s sitting posture correct? Check the position of hands, elbows, knees, and thighs.",
          "Does the rider make way for an ambulance?",
          "Is the rider courteous to other road users?",
          "Has the rider attended the Safe Rider Programme? Date:",
          "Does the rider wear an AZ Helmet with the strap buckled?",
          "Is the helmet in good condition?",
          "Does the rider wear an AZ Jacket?",
          "Is the jacket in good condition?"
        ]
      },
      {
        title: 'Vehicle Details',
        data: formData.vehicleDetails,
        questions: [
          { label: 'Primary Vehicle', key: 'primaryVehicle', defaultAnswer: '2 Wheeler' },
          { label: 'Primary Vehicle Fuel Type', key: 'fuelType' },
          { label: 'Primary Vehicle Number', key: 'primaryVehicleNumber' },
          { label: 'Primary Vehicle Manufacturer', key: 'primaryVehicleManufacturer' },
          { label: 'Primary Vehicle Model', key: 'primaryVehicleModel' },
          { label: 'Do you use a secondary vehicle for field of work?', key: 'useSecondaryVehicle', defaultAnswer: 'No' }
        ],
        secondaryQuestions: formData.vehicleDetails && formData.vehicleDetails.useSecondaryVehicle === 'Yes' ? [
          { label: 'Secondary Vehicle', key: 'secondaryVehicle', defaultAnswer: '2 Wheeler' },
          { label: 'Secondary Vehicle Fuel Type', key: 'secondaryVehicleFuelType' },
          { label: 'Secondary Vehicle Number', key: 'secondaryVehicleNumber' },
          { label: 'Secondary Vehicle Manufacturer', key: 'secondaryVehicleManufacturer' },
          { label: 'Secondary Vehicle Model', key: 'secondaryVehicleModel' }
        ] : []
      }
    ];

    // Helper functions to extract values
    const getAnswer = (sectionData, questionKey, defaultAnswer = "Yes") => {
      return sectionData && sectionData[`${questionKey}-answer`] ? sectionData[`${questionKey}-answer`] : defaultAnswer;
    };

    const getRemark = (sectionData, questionKey) => {
      return sectionData && sectionData[`${questionKey}-remark`] ? sectionData[`${questionKey}-remark`] : "No Remarks";
    };

    const getTextValue = (value, defaultValue = "Not Provided") => {
      return value ? value : defaultValue;
    };

    // Iterate over each section and extract data
    sections.forEach((section) => {
      section.questions.forEach((question, index) => {
        const questionText = typeof question === 'string' ? question : question.label;
        const answer = typeof question === 'string'
          ? getAnswer(section.data, index)
          : getTextValue(section.data[question.key], question.defaultAnswer);

        // Apply "answer, Remarks: remark" format only to "Vehicle Assessment" and "Rider Assessment"
        if (section.title === 'Vehicle Assessment' || section.title === 'Rider Assessment') {
          const remark = typeof question === 'string' ? getRemark(section.data, index) : "No Remarks";
          result[questionText] = `${answer}, Remarks: ${remark}`;
        } else {
          // For other sections, only use the answer
          result[questionText] = answer;
        }
      });

      // Handle secondary questions if they exist
      if (section.secondaryQuestions) {
        section.secondaryQuestions.forEach((question) => {
          const questionText = question.label;
          const answer = getTextValue(section.data[question.key], question.defaultAnswer);
          result[questionText] = answer;
        });
      }
    });

    return result;
  };

  

  const handleSubmit = () => {

    var changedData = prepareDataForGoogleSheets(formData);

    submitToGoogleSheets(changedData); 
    onNext();
  };
  

  return (
    <div className="vehicle-assessment-container" ref={reviewRef}>
      <h1 className='main-heading'>Review Your Submission</h1>

      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="section">
          <h2>{section.title}</h2>
          <div className="section-content">
            {section.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="question-answer">
                <div className="question">
                  {typeof question === 'string' ? question : question.label}
                </div>
                <div className="answer">
                  {typeof question === 'string'
                    ? getAnswer(section.data, questionIndex) // For radio button questions
                    : getTextValue(section.data[question.key], question.defaultAnswer)} {/* For text fields */}
                </div>
                {/* Display remarks if it's a radio button question */}
                {typeof question === 'string' && (
                  <div className="remarks">
                    Remarks: {getRemark(section.data, questionIndex)}
                  </div>
                )}
              </div>
            ))}

            {/* Handle secondary vehicle questions conditionally */}
            {section.secondaryQuestions && section.secondaryQuestions.map((question, questionIndex) => (
              <div key={questionIndex} className="question-answer">
                <div className="question">{question.label}</div>
                <div className="answer">
                  {getTextValue(section.data[question.key], 'Not Provided')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Buttons */}
      <div className="button-group">
        <button onClick={handlePrint} className="btn btn-previous">Print</button>
        <button onClick={handleDownloadPDF} className="btn btn-next">Download as PDF</button>
        <button onClick={handleSubmit} className="btn btn-next">Submit</button>
      </div>
    </div>
  );
};

export default ReviewPage;
