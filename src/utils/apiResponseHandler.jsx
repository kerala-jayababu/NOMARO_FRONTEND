import secureLocalStorage from 'react-secure-storage';
import { showToast } from '../components/ToastNotifications/toastUtils';

const handleApiResponse = (responseData) => {
  // Check if response is a success
  if (responseData?.success || responseData?.data?.success) {     
    const successMessage = responseData?.data || responseData?.data?.data || 'Success';
    showToast(successMessage, 'success');  // Show success toast
  } else {
    const errorMessage = responseData?.response?.data?.message || responseData.message || "An unknown error occurred.";
    showToast(errorMessage, 'error'); 
  }

};

export default handleApiResponse;
