import React, { useEffect,useRef,useState } from 'react'
import { toast } from 'react-toastify';   
import moment from 'moment';    
import DatePicker from 'react-datepicker';
import { NumericFormat } from 'react-number-format';
import NotificationService from '../../core/services/NotificationService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'list', 'bullet', 'indent',
    'link', 'image', 'color', 'background', 'align',
    'code-block'
];

/** Maps API templateSelection (e.g. HTMLTEXT / HTMLFILE) to internal mode. */
const parseTemplateSelection = (raw) => {
    const v = String(raw ?? '').trim().toUpperCase().replace(/[\s_]/g, '');
    if (v === 'HTMLFILE') return 'htmlfile';
    return 'htmltext';
};

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean']
    ],
    clipboard: {
        matchVisual: false
    }
};

function NotificationConfig() {
    const [notificationTypes, setNotificationTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const rightCardRef = useRef(null);
    const quillRef = useRef(null);
    const htmlFileInputRef = useRef(null);
    const [templateMode, setTemplateMode] = useState('htmltext');
    const [htmlFile, setHtmlFile] = useState(null);
    const [existingTemplateFileName, setExistingTemplateFileName] = useState('');
    const [htmlTemplateFileContent, setHtmlTemplateFileContent] = useState(null);
    const [rawHtmlPaste, setRawHtmlPaste] = useState('');
    const [rightCardHeight, setRightCardHeight] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
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

    useEffect(() => {
        const updateHeight = () => {
            if (rightCardRef.current) {
                setRightCardHeight(rightCardRef.current.offsetHeight);
            }
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, [selectedNotification]);

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
        setTemplateMode(parseTemplateSelection(notification.templateSelection));
        setHtmlFile(null);        
        setExistingTemplateFileName(
            notification.htmlTemplateFileName
            ?? ''
        );
        setHtmlTemplateFileContent(notification.htmlTemplateFileContent || null);
        if (htmlFileInputRef.current) {
            htmlFileInputRef.current.value = '';
        }
        setRawHtmlPaste(notification.emailContent || '');
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

    const handleQuillChange = (content) => {
        setFormData(prev => ({
            ...prev,
            emailContent: content
        }));
    };

    const applyRawHtmlToEditor = () => {
        const html = rawHtmlPaste?.trim();
        if (!html || !quillRef.current) return;
        const quill = quillRef.current.getEditor();
        quill.setContents([], 'silent');
        quill.clipboard.dangerouslyPasteHTML(0, html);
        const next = quill.root.innerHTML;
        setFormData(prev => ({ ...prev, emailContent: next }));
    };

    const handleTemplateModeChange = (mode) => {
        setTemplateMode(mode);
        if (mode === 'htmltext') {
            setHtmlFile(null);
            if (htmlFileInputRef.current) {
                htmlFileInputRef.current.value = '';
            }
        }
    };

    const handleHtmlFileChange = (e) => {
        const f = e.target.files?.[0];
        setHtmlFile(f || null);
    };

    const handleDownloadTemplate = () => {
        if (!htmlTemplateFileContent || !existingTemplateFileName) return;
        const blob = new Blob([htmlTemplateFileContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = existingTemplateFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleSubmit = () => {
        let emailContent = formData.emailContent;
        if (templateMode === 'htmlfile') {
            emailContent = null;
        }
        const TemplateSelection = templateMode.toUpperCase();
        const HtmlTemplateFileName = templateMode === 'htmlfile'
            ? (htmlFile?.name || existingTemplateFileName || '')
            : '';

        const payloadBase = {
            ...formData,
            emailContent,
            TemplateSelection,
            HtmlTemplateFileName
        };

        const fd = new FormData();
        Object.entries(payloadBase).forEach(([k, v]) => {
            fd.append(k, v == null ? '' : String(v));
        });
        if (templateMode === 'htmlfile' && htmlFile) {
            fd.append('HtmlTemplateFile', htmlFile);
        }

        NotificationService.updateNotificationType(fd)
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
        setTemplateMode('htmltext');
        setHtmlFile(null);
        setExistingTemplateFileName('');
        setHtmlTemplateFileContent(null);
        if (htmlFileInputRef.current) {
            htmlFileInputRef.current.value = '';
        }
        setRawHtmlPaste('');
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
            <div class="card SystemParametersCard" style={rightCardHeight ? { height: rightCardHeight + 'px', overflow: 'hidden' } : {}}>
              <div class="card-header d-flex align-items-center justify-content-between pb-3">
                <h5 class="m-0">List of Notification Types</h5>
                <div class="list_searchbox" style={{ width: '200px' }}>
                  <input
                    type="search"
                    class="form-control form-control-sm"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i class="bx bx-search"></i>
                </div>
              </div>
              <div class="card-body" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div class="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
                  <table class="table table-sm">
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
                      <tr>
                        <th class="text-nowrap">Notification Type</th>
                      </tr>
                    </thead>
                    <tbody class="table-border-bottom-0">
                      {notificationTypes && notificationTypes.filter((n) => !searchQuery || n.notificationType?.toLowerCase().includes(searchQuery.toLowerCase())).map((notificationType) => (
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
            <div class="card" ref={rightCardRef}>
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
                <div class="mb-3">
                  <label class="form-label mb-1">HTML File Template</label>
                  <div class="d-flex flex-wrap gap-3">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="templateMode"
                        id="template-mode-htmltext"
                        checked={templateMode === 'htmltext'}
                        onChange={() => handleTemplateModeChange('htmltext')}
                        disabled={!selectedNotification}
                      />
                      <label class="form-check-label" htmlFor="template-mode-htmltext">HTML Text</label>
                    </div>
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="templateMode"
                        id="template-mode-htmlfile"
                        checked={templateMode === 'htmlfile'}
                        onChange={() => handleTemplateModeChange('htmlfile')}
                        disabled={!selectedNotification}
                      />
                      <label class="form-check-label" htmlFor="template-mode-htmlfile">HTML File</label>
                    </div>
                  </div>
                </div>

                {templateMode === 'htmltext' && (
                <div class="mb-2">
                  <label class="form-label mb-1">Email Content Template (HTML Entry)</label>
                  <p class="form-text text-muted small mb-2">
                    Rich text and pasted HTML from web pages use the editor below. To load a full HTML string (tags as code), paste it in the box and click Apply HTML.
                  </p>
                  <ReactQuill
                    ref={quillRef}
                    key={selectedNotification?.idNotificationConfig ?? 'no-selection'}
                    theme="snow"
                    value={formData.emailContent}
                    onChange={handleQuillChange}
                    modules={quillModules}
                    formats={quillFormats}
                    style={{ height: '200px', marginBottom: '50px' }}
                  />
                  <label class="form-label mb-1 mt-3">Paste raw HTML (optional)</label>
                  <textarea
                    class="form-control font-monospace small"
                    rows={5}
                    value={rawHtmlPaste}
                    onChange={(e) => setRawHtmlPaste(e.target.value)}
                    placeholder={'e.g. <p>Hello</p><ul><li>Item</li></ul>'}
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm mt-2"
                    onClick={applyRawHtmlToEditor}
                    disabled={!selectedNotification || !rawHtmlPaste?.trim()}
                  >
                    Apply HTML to editor
                  </button>
                </div>
                )}

                {templateMode === 'htmlfile' && (
                <div class="mb-2">
                  <label class="form-label mb-1">Choose HTML file</label>
                  <input
                    key={selectedNotification?.idNotificationConfig ?? 'none'}
                    ref={htmlFileInputRef}
                    type="file"
                    class="form-control form-control-sm"
                    accept=".html,.htm,text/html"
                    onChange={handleHtmlFileChange}
                    disabled={!selectedNotification}
                  />
                  {existingTemplateFileName && !htmlFile && (
                    <div class="d-flex align-items-center justify-content-between mt-1">
                      <p class="form-text small text-muted mb-0">Current file: {existingTemplateFileName}</p>
                      {htmlTemplateFileContent && (
                        <button
                          type="button"
                          class="btn btn-outline-primary btn-sm"
                          onClick={handleDownloadTemplate}
                        >
                          Download
                        </button>
                      )}
                    </div>
                  )}
                  {htmlFile && (
                    <p class="form-text small text-muted mb-0 mt-1">Selected: {htmlFile.name}</p>
                  )}
                </div>
                )}
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