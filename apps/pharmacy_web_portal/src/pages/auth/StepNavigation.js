import './StepNavigation.css';

const StepNavigation = ({ currentStep = 1, steps = 3, onStepClick, stepLabels = [] }) => {
  const defaultLabels = ['Pharmacy Details', 'Pharmacist Info', 'Account Setup'];
  const labels = stepLabels.length > 0 ? stepLabels : defaultLabels;

  return (
    <div className="step-navigation">
      {Array.from({ length: steps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="step-item">
          <div 
            className={`step-circle ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            onClick={() => {
              if (currentStep > step) {
                onStepClick?.(step);
              }
            }}
            style={{ cursor: currentStep > step ? 'pointer' : 'default' }}
          >
            {step}
          </div>
          <div className="step-label">{labels[step - 1] || `Step ${step}`}</div>
          {step < steps && <div className={`step-line ${currentStep > step ? 'completed' : ''}`} />}
        </div>
      ))}
    </div>
  );
};

export default StepNavigation;