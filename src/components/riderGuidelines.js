import React, {useEffect} from 'react';
import './riderGuidelines.css';
import waterMark from '../assets/waterMark.png';


const RiderGuidelines = ({ onNext, onPrevious }) => {
    const tableContent = [
        {
          id: 1,
          assessment: 'Does the rider use hand signal / indicator while taking a turn?',
          guidelines: 'Check if rider uses hand signals while taking turns on the roads. For safety purposes, it is recommended to use both hand signal and vehicle indicator.'
        },
        {
          id: 2,
          assessment: 'Does the rider overtake from the correct side?',
          guidelines: 'Indian traffic rules require the rider to ride on the left-side of the road. This means that over-taking is permitted only on the right.'
        },
        {
          id: 3,
          assessment: 'Does the rider wear shoes with well-defined heel while riding?',
          guidelines: 'Check if the rider uses a good protective shoe with a thick sole. Sport shoes are not recommended for safety purposes.'
        },
        {
          id: 4,
          assessment: 'Is the rider sleepy while riding?',
          guidelines: 'Yawning and dropping eyelids while riding are signs of a tired/sleepy rider. Unstable steering pattern movements indicate drowsiness.'
        },
        {
          id: 5,
          assessment: 'Does the rider stop at traffic signals?',
          guidelines: 'Rider should stop at a red light and slow down at a yellow light. Signal jumping violations can be checked on traffic police website.'
        },
        {
          id: 6,
          assessment: 'Does the rider use mobile phone while riding?',
          guidelines: 'Usage of a mobile phone is illegal while riding. Microphones/handsfree is not suggested for safety purposes as it may cause distractions while riding.'
        },
        {
          id: 7,
          assessment: 'Does the rider follow legal speed limits?',
          guidelines: 'Speed limit of a two-wheeler ranges from 40 -60 kmph within city limits. Speed limit varies with every state in India.'
        },
        {
          id: 8,
          assessment: 'Is the rider\'s sitting posture correct? Check the position of hands, elbows, knees & thighs.',
          guidelines: 'The standard position for riding is sitting with their back upright, shoulders should be stacked above the hips and slightly pushed back. Refer to the pic attached.'
        },
        {
          id: 9,
          assessment: 'Does the rider make way for Ambulance?',
          guidelines: 'A rider must slow down and check the traffic around the vehicle and move to their left giving way to the ambulance on the right side of the road.'
        },
        {
          id: 10,
          assessment: 'Is the rider courteous to other road users?',
          guidelines: 'A rider must be always alert and make way for other vehicles on roads. Rider must slow down in pedestrian crossing, school zones etc., and should not ride on pavements. Rash riding may lead to fatal accidents to the rider and other motorists on the roads.'
        },
        {
          id: 11,
          assessment: 'Has the Rider attended Safe Rider Programme? Date:',
          guidelines: 'Yes or No. Mention the date of training attended.'
        },
        {
          id: 12,
          assessment: 'Does the rider wear AZ Helmet with strap buckled?',
          guidelines: 'Rider should use AZ Helmet with strap always buckled while riding for maximum safety.'
        },
        {
          id: 13,
          assessment: 'Is the helmet in good condition?',
          guidelines: 'Check for dents/damages on the outer surface, foam condition, and scratches on the visor. Reflective logo on the rear should be visible.'
        },
        {
          id: 14,
          assessment: 'Does the rider wear AZ Jacket?',
          guidelines: 'Yes or No. Mention the reason.'
        },
        {
          id: 15,
          assessment: 'Is the jacket in good condition?',
          guidelines: 'Check for damages/cuts and verify overall condition. Observe and highlight if the reflective strips are damaged (front and rear).'
        }
    ];

    useEffect(() => {
        // Scroll to top of the page when component mounts
        window.scrollTo(0, 0);
      }, []);
      
  return (
    <div className="page2-container">
      <img src={waterMark.src} alt="Watermark" className="watermark" />  
      <h1 className="form-heading">RIDER ASSESSMENT GUIDELINES</h1>
      <table className="assessment-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Rider Assessment</th>
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
        Start Form
      </button>
    </div>
  );
};

export default RiderGuidelines;
