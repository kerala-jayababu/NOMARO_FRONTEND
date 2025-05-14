import React, { useState, useRef, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CommonService from '../../core/services/CommonService';
import { showToast } from '../../components/ToastNotifications/toastUtils';
import CustomToolbar from '../../core/services/CustomCalenderToolBar';
import { FaTrashAlt } from 'react-icons/fa';
import './Holiday.css';
import { useTranslation } from "react-i18next";
import 'moment/locale/en-gb';

moment.updateLocale('en-gb', { week: { dow: 1 } });
moment.locale('en-gb');
const localizer = momentLocalizer(moment);

const Holiday = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [availableHolidayTypes, setAvailableHolidayTypes] = useState([]);
  const [holidayType, setHolidayType] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');
  const [popupInfo, setPopupInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [popupMode, setPopupMode] = useState('add');
  const [editEvent, setEditEvent] = useState(null);
  const [calendarYear, setCalendarYear] = useState(moment().year());
  const [id, setId] = useState(0);
  const { t } = useTranslation();
  const holidayTypeRef = useRef(null);
  const holidayDescRef = useRef(null);

  // Confirmation modal state
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(() => () => {});

  const handleDateSelect = (slotInfo) => {
    const formattedDate = moment(slotInfo.start).format('dddd, DD MMMM YYYY');
    setSelectedDate(formattedDate);

    const existingEvent = events.find(e =>
      moment(e.start).isSame(slotInfo.start, 'day')
    );

    setId(existingEvent?.id || 0);
    setHolidayType(existingEvent?.holidayType || '');
    setHolidayDesc(existingEvent?.desc || '');
    setEditEvent(existingEvent || null);
    setPopupMode(existingEvent ? 'edit' : 'add');
    setShowPopup(true);

    getAllHolidayTypes();

    setPopupInfo({
      date: formattedDate,
      x: window.innerWidth / 2 - 150,
      y: window.innerHeight / 2 - 100
    });
  };

  const getAllHolidayTypes = async () => {
    try {
      const res = await CommonService.getHolidayTypes();
      setAvailableHolidayTypes(res.data || []);
    } catch (err) {
      console.error('Failed to load holiday types', err);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setPopupInfo(null);
    setHolidayType('');
    setHolidayDesc('');
  };

  const handleHolidayTypeChange = (e) => {
    setHolidayType(e.target.value);
  };

  const handleHolidayDesc = (e) => {
    setHolidayDesc(e.target.value);
  };

  const handleSubmit = async () => {
    const holidayData = {
      date: selectedDate,
      type: holidayType,
      reason: holidayDesc
    };
    if (holidayData.type === "") {
      showToast("Please add Holiday Type", 'error');
      holidayTypeRef.current?.focus();
    } else if (holidayData.reason === "") {
      showToast("Please add Holiday Reason", 'error');
      holidayDescRef.current?.focus();
    } else {
      const newEvent = {
        title: `${holidayType}: ${holidayDesc}`,
        start: `${selectedDate}`,
        end: `${selectedDate}`,
        holidayType,
        desc: holidayDesc,
        isHoliday: true,
        id: id,
      };

      let updatedEvents;
      if (popupMode === 'edit' && editEvent) {
        updatedEvents = events.map(e =>
          moment(e.start).isSame(editEvent.start, 'day') ? newEvent : e
        );
        newEvent.id = editEvent.id;
      } else {
        updatedEvents = [...events, newEvent];
      }

      setEvents(updatedEvents);
      setShowPopup(false);
      setHolidayType('');
      setHolidayDesc('');
      setEditEvent(null);

      await CommonService.addOrUpdateHolidays(newEvent);
      showToast(popupMode === 'edit'? 'Holiday Updated' : 'Holiday Added', 'success');
        handleClosePopup();
      }
  };

  const capitalize = (str) =>
    str?.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  useEffect(() => {
    const fetchHolidayEvents = async () => {
      try {
        const response = await CommonService.getHolidaysInAnYear(calendarYear);
        const eventData = response.data.map(item => ({
          title: `${capitalize(item.holidayType)}: ${item.holidayDescription}`,
          start: new Date(item.holidayDate),
          end: new Date(item.holidayDate),
          desc: item.holidayDescription,
          holidayType: capitalize(item.holidayType),
          isHoliday: true,
          id: item.idHoliday
        }));
        setEvents(eventData);
      } catch (error) {
        console.error("Failed to fetch holidays", error);
      }
    };

    fetchHolidayEvents();
  }, [calendarYear]);

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.isHoliday ? '#6f1d1f' : undefined,
        color: event.isHoliday ? 'white' : undefined,
        borderRadius: '4px',
        border: 'none',
      }
    };
  };

  const tooltipAccessor = (event) => `${event.holidayType}: ${event.desc}`;

  const EventWithDelete = ({ event }) => {
    const handleDelete = (e) => {
      e.stopPropagation();
      setConfirmMessage(`Are you sure you want to delete "${event.title}"?`);
      setOnConfirm(() => async () => {
        try {
          await CommonService.deleteHolidays(event.idHoliday);
          setEvents(prev => prev.filter(ev => ev.id !== event.id));
          showToast("Holiday deleted", "success");
        } catch (err) {
          console.error("Delete failed", err);
          showToast("Failed to delete holiday", "error");
        }
      });
      setConfirmModalVisible(true);
    };

    return (
      <div className="d-flex justify-content-between align-items-center">
        <span>{event.title}</span>
        <FaTrashAlt
          style={{ cursor: 'pointer', marginLeft: 8 }}
          onClick={handleDelete}
          title="Delete Holiday"
        />
      </div>
    );
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y" style={{ position: 'relative' }}>
      <div className="pb-3">
        <h5 className="m-0">Holiday Calendar</h5>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable={true}
        onSelectSlot={handleDateSelect}
        onSelectEvent={handleDateSelect}
        eventPropGetter={eventStyleGetter}
        views={['month']}
        components={{
          toolbar: (toolbarProps) => (
            <CustomToolbar {...toolbarProps} onYearChange={setCalendarYear} />
          ),
          event: EventWithDelete
        }}
        dayPropGetter={(date) => {
          const isHolidayDate = events.some(event =>
            event.isHoliday && moment(event.start).isSame(date, 'day')
          );

          return {
            className: isHolidayDate ? 'holiday-cell' : ''
          };
        }}
        tooltipAccessor={tooltipAccessor}
      />

      {showPopup && popupInfo && (
        <div className='holiday-popup'>
          <center><b>{selectedDate}</b></center>

          <div className="mb-2">
            <label className="form-label">Holiday Type :</label>
            <select
              className="form-select mb-2"
              value={holidayType}
              onChange={handleHolidayTypeChange}
              ref={holidayTypeRef}
            >
              <option value="">Select Holiday Type</option>
              {availableHolidayTypes
                .filter(item => item.holidayType?.toLowerCase().includes("holiday"))
                .map((data) => (
                  <option key={data.holidayType} value={data.holidayTypeName}>
                    {data.holidayTypeName}
                  </option>
                ))}
            </select>
          </div>

          <div className="mb-2">
            <label className="form-label">Reason for Holiday</label>
            <textarea
              className="form-control"
              value={holidayDesc}
              onChange={handleHolidayDesc}
              placeholder="Enter reason"
              rows="3"
              ref={holidayDescRef}
            />
          </div>

            {popupMode === 'edit' && (
            <div className="mt-3 d-flex justify-content-end">
              <FaTrashAlt
                className="delete-icon"
                onClick={() => {
                  setConfirmMessage(`Are you sure you want to delete "${editEvent.title}"?`);
                  setOnConfirm(() => async () => {
                    await CommonService.deleteHolidays(editEvent.id);
                    setEvents(prev => prev.filter(ev => ev.id !== editEvent.id));
                    showToast("Holiday deleted", "success");
                    handleClosePopup();
                  });
                  setConfirmModalVisible(true);
                }}
                style={{ cursor: 'pointer', color: 'red', marginRight: '10px' }}
              />
            </div>
          )}

          <div className="mt-3 d-flex justify-content-end">
            <button onClick={handleSubmit} className="btn btn-primary me-2">{popupMode === 'edit' ? 'Update' : 'Add'}</button>
            <button onClick={handleClosePopup} className="btn btn-outline-secondary btn-sm py-2 px-4">Close</button>
          </div>
        </div>
      )}

      {confirmModalVisible && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setConfirmModalVisible(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>{confirmMessage}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    onConfirm();
                    setConfirmModalVisible(false);
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setConfirmModalVisible(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holiday;
