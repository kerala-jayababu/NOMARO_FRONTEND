import React, { useEffect,useRef,useState } from 'react'
import { toast } from 'react-toastify';   
import moment from 'moment';    
import DatePicker from 'react-datepicker';
import { NumericFormat } from 'react-number-format';
import NotificationService from '../../core/services/NotificationService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function NotificationConfig() {
    const [notificationTypes, setNotificationTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [formData, setFormData] = useState({
        idNotificationConfig: 0,
        notificationType: '',
        emailSubject: '',
        emailContent: '',
        appNotificationText: '',
        webLink: ''
    });

    useEffect(() => {
        getNotificationTypes();
    }, []); 

    const getNotificationTypes = () => {
        setLoading(true);
        NotificationService.getNotificationTypes()
            .then(res => {
                setNotificationTypes(res.data.data); 
                setLoading(false);
            })
            .catch(err => {
                setError(err.data.message);
                setLoading(false);
            }); 
    }   

    const handleNotificationSelect = (notification) => {
        setSelectedNotification(notification);
        setFormData({
            idNotificationConfig: notification.idNotificationConfig,
            notificationType: notification.notificationType,
            emailSubject: notification.emailSubject || '',
            emailContent: notification.emailContent || '',
            appNotificationText: notification.appNotificationText || '',
            webLink: notification.webLink || ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleQuillChange = (value) => {
        setFormData(prev => ({
            ...prev,
            emailContent: value
        }));
    };

    const handleSubmit = () => {
        NotificationService.updateNotificationType(formData)
            .then(res => {
                // toast.success('Notification updated successfully');
                handleReset();
                getNotificationTypes();
            })
            .catch(err => {
                // toast.error('Failed to update notification');
            });
    };

    const handleReset = () => {
        setSelectedNotification(null);
        setFormData({
            idNotificationConfig: 0,
            notificationType: '',
            emailSubject: '',
            emailContent: '',
            appNotificationText: '',
            webLink: ''
        });
    };

    return (
        <div class="container-xxl flex-grow-1 container-p-y">
        <div class="row">

          <div class="col-lg-5">
            <div class="card SystemParametersCard">
              <div class="card-header d-flex align-items-center justify-content-between pb-3">
                <h5 class="m-0">List of Notification Types</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th class="text-nowrap">Notification Type</th>
                      </tr>
                    </thead>
                    <tbody class="table-border-bottom-0">
                      {notificationTypes && notificationTypes.map((notificationType) => (
                        <tr 
                          key={notificationType.idNotificationConfig}
                          onClick={() => handleNotificationSelect(notificationType)}
                          style={{ cursor: 'pointer' }}
                          className={selectedNotification?.idNotificationConfig === notificationType.idNotificationConfig ? 'table-active' : ''}
                        >
                          <td className='cursor'>{notificationType.notificationType}</td>
                        </tr>
                      ))}

                      {notificationTypes.length === 0 && (
                        <tr>
                          <td colSpan="2" className="text-center">No notification types found</td>
                        </tr>
                      )}                      
                    </tbody>
                  </table>

                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-7">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Update Notification Type</h5>
              </div>
              <div class="card-body">
                <div class="mb-2">
                  <label class="form-label mb-1">Notification Type</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    name="notificationType"
                    value={formData.notificationType}
                    disabled
                  />
                </div>
                <div class="mb-2">
                  <label class="form-label mb-1">Email Subject</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    name="emailSubject"
                    value={formData.emailSubject}
                    onChange={handleInputChange}
                    maxLength="100"
                    autocomplete="off"
                  />
                </div>
                <div class="mb-2">
                  <label class="form-label mb-1">Email Content Template (HTML Entry)</label>
                  <ReactQuill 
                    theme="snow"
                    value={formData.emailContent}
                    onChange={handleQuillChange}
                    style={{ height: '200px', marginBottom: '50px' }}
                  />
                </div>
                <div class="mb-2">
                  <label class="form-label mb-1">App Notification Text</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    name="appNotificationText"
                    value={formData.appNotificationText}
                    onChange={handleInputChange}
                    maxLength="100"
                    autocomplete="off"
                  />
                </div>

                <div class="text-center p-2 mt-2 pb-0">
                  <button 
                    class="btn btn-primary btn-sm py-2 px-4 me-2"
                    onClick={handleSubmit}
                    disabled={!selectedNotification}
                  >Submit</button>
                  <button 
                    class="btn btn-outline-secondary btn-sm py-2 px-4"
                    onClick={handleReset}
                  >Reset</button>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    )
}
export default NotificationConfig;