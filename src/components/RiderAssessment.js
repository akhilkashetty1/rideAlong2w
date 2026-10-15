import React, {useEffect} from 'react';
import './RiderAssessment.css';
import watermark from '../assets/waterMark.png';
import NavigationSteps from './NavigationSteps';

const RiderAssessment = ({ formData, handleFormChange, onNext, onPrevious }) => {
  const questions = [
    "1. Does the rider use hand signal/indicator while taking a turn?",
    "2. Does the rider overtake from the correct side?",
    "3. Does the rider wear shoes with a well-defined heel while riding?",
    "4. Is the rider sleepy while riding?",
    "5. Does the rider stop at traffic signals?",
    "6. Does the rider use a mobile phone while riding?",
    "7. Does the rider follow legal speed limits?",
    "8. Is the rider’s sitting posture correct? Check the position of hands, elbows, knees, and thighs.",
    "9. Does the rider make way for an ambulance?",
    "10. Is the rider courteous to other road users?",
    "11. Has the rider attended the Safe Rider Programme? Date:",
    "12. Does the rider wear an AZ Helmet with the strap buckled?",
    "13. Is the helmet in good condition?",
    "14. Does the rider wear an AZ Jacket?",
    "15. Is the jacket in good condition?"
  ];

  useEffect(() => {
    // Scroll to top of the page when component mounts
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e, questionIndex, type) => {
    const { value } = e.target;

    if (type === 'radio') {
      handleFormChange('riderAssessment', `${questionIndex}-answer`, value);
    } else if (type === 'remark') {
      handleFormChange('riderAssessment', `${questionIndex}-remark`, value);
    }
  };

  return (
    <div className="rider-assessment-container">
      <h1 className='main-heading'>TWO WHEELER RIDE ALONG FORM</h1>
      <NavigationSteps currentStep="riderAssessment" />
      <div className="watermark">
        <img src={watermark.src} alt="Watermark" />
      </div>
      <form>
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
                    checked={formData.riderAssessment[`${index}-answer`] === 'Yes' || formData.riderAssessment[`${index}-answer`] === undefined}
                    onChange={(e) => handleChange(e, index, 'radio')}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name={`question-${index}-answer`}
                    value="No"
                    checked={formData.riderAssessment[`${index}-answer`] === 'No'}
                    onChange={(e) => handleChange(e, index, 'radio')}
                  />
                  No
                </label>
              </div>
              <textarea
                name={`remark-${index}`}
                value={formData.riderAssessment[`${index}-remark`] || ''}
                onChange={(e) => handleChange(e, index, 'remark')}
                maxLength="175"
                placeholder="Remarks..."
              />
            </div>
          </div>
        ))}

        <div className="button-group">
          <button type="button" onClick={onPrevious} className="btn btn-previous">Previous</button>
          <button type="button" onClick={onNext} className="btn btn-next">Next</button>
        </div>
      </form>
    </div>
  );
};

export default RiderAssessment;
