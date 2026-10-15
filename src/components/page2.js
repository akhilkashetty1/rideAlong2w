import React from 'react';
import './page2.css';
import waterMark from '../assets/waterMark.png';



const Page2 = ({ onNext, onPrevious }) => {
    const tableContent = [
        {
          id: 1,
          assessment: 'Is the Vehicle Tyre Pressure correct? ',
          guidelines: 'Instruct the employee to check tyre pressure at a fuel station and ensure the air is filled according to the manufacturer’s instructions.'
        },
        {
          id: 2,
          assessment: 'How is the treading condition of the tyres? Are there any cuts?',
          guidelines: 'Check the tyre thoroughly by inspecting the tread depth. Spin the wheel slowly and check for cuts, splits, bulges, or worn fabric.'
        },
        {
          id: 3,
          assessment: 'Is the speedometer functioning properly?',
          guidelines: 'Test ride the vehicle from Point A to Point B and check if the speedometer is functioning. The distance covered should reflect in the meter reading & the speedo needle should indicate the speed of the vehicle.'
        },
        {
          id: 4,
          assessment: 'Is the fuel meter functioning properly?',
          guidelines: 'Turn the ignition on and observe the needle on the fuel gauge, check if it moves. The reading of the fuel meter should match the fuel present in the vehicle.'
        },
        {
          id: 5,
          assessment: 'Are both mirrors present? Is it positioned properly as per rider\'s eye line?',
          guidelines: 'Check physically if both the mirrors are present. The mirrors should be accurately aligned to the eye line of the rider while sitting in riding position.'
        },
        {
          id: 6,
          assessment: 'Do the front & rear brakes function properly?',
          guidelines: 'Test ride the vehicle and check if the brakes are effective when applied. Brake levers should not be too soft when applied.'
        },
        {
          id: 7,
          assessment: 'Is the horn functioning properly?',
          guidelines: 'Gently press the horn button and check if the horn is functioning properly. The sound output should be clear and audible. Highlight if the horn is extremely loud or musical.'
        },
        {
          id: 8,
          assessment: 'Is the auto/ kick starter functioning properly?',
          guidelines: 'Gently press the auto start button and check if the engine switches on in a smooth manner. Use the kicker lever if the auto starter is not present.'
        },
        {
          id: 9,
          assessment: 'Is the vehicle key in good condition? Check for any bend or rust',
          guidelines: 'Physically check the teeth condition of the key, highlight if it\'s worn out. Check for any bend or rust in the key.'
        },
        {
          id: 10,
          assessment: 'How is the seat condition of the vehicle? Is there any damage/cuts?',
          guidelines: 'Check the seat condition by gently pressing the seat, highlight if the seat is hard or worn out. Seat assembly should be soft and comfortable to avoid back aches of a rider. Check for any cuts or damages.'
        },
        {
          id: 11,
          assessment: 'Is the main stand & side stand functioning properly?',
          guidelines: 'Use the main & side stands, operation should be smooth and easy. Check for any bend or rust in the stands.'
        },
        {
          id: 12,
          assessment: 'Are the number plates of the vehicle clearly visible?',
          guidelines: 'All the characters in the number plates should be clear and visible. It is illegal to use illegible or stylish fonts. Govt has recommended to use IND(embossed)number plates.'
        }
      ];
      

  return (
    <div className="page2-container">
      <img src={waterMark.src} alt="Watermark" className="watermark" />  
      <h1 className="form-heading">VEHICLE ASSESSMENT GUIDELINES</h1>
      <table className="assessment-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Vehicle Assessment</th>
            <th>Assessment Guidelines for Line Manager</th>
          </tr>
        </thead>
        <tbody>
          {tableContent.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.assessment}</td>
              <td>{row.guidelines}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="start-form-btn" onClick={onNext}>
        Next
      </button>

    </div>
  );
};

export default Page2;
