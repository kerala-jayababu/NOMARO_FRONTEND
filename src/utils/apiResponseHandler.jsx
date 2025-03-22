import { showToast } from '../components/ToastNotifications/toastUtils';

const handleApiResponse = (responseData) => {
    console.log('response-------',responseData);
  // Check if response is a success
  if (responseData?.success || responseData?.data?.success) {     
    const successMessage = responseData?.data || responseData?.data?.data || 'Success';
    showToast(successMessage, 'success');  // Show success toast
  } else {
    const errorMessage = responseData.message || responseData?.response?.data?.message || "An unknown error occurred.";
    showToast(errorMessage, 'error'); 
  }
};

export default handleApiResponse;
