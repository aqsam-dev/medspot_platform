// NavigationHandler.js
import registrationService from './services/registrationService';

export const handleStepNavigation = async (
  targetStep, 
  currentStep, 
  currentFormData,
  saveCallback,
  validateCallback,
  navigateCallback
) => {
  // Save current data first
  await saveCallback(currentFormData);
  
  // Check if navigation is allowed
  const canNavigate = registrationService.canNavigateToStep(
    targetStep, 
    currentStep, 
    validateCallback
  );
  
  if (!canNavigate.allowed) {
    if (canNavigate.reason === 'validation') {
      alert('Please complete all required fields before navigating');
    }
    return false;
  }
  
  // Set navigation flag and navigate
  registrationService.setInternalNav(true);
  registrationService.setCurrentStep(targetStep);
  
  // Call the navigation callback
  navigateCallback(targetStep);
  return true;
};