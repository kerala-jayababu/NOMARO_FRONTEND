import React from 'react';

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
    const nextDate = new Date(toolbar.date);
    nextDate.setMonth(nextDate.getMonth() + 1);
    onYearChange(nextDate.getFullYear());
  }
  const goToNext = () => {
    toolbar.onNavigate('NEXT');
    const nextDate = new Date(toolbar.date);
    nextDate.setMonth(nextDate.getMonth() + 1);
    onYearChange(nextDate.getFullYear());
  }
  const goToToday = () => {
    toolbar.onNavigate('TODAY');
    const nextDate = new Date(toolbar.date);
    nextDate.setMonth(nextDate.getMonth() + 1);
    onYearChange(nextDate.getFullYear());
  }

  return (
    <div className="d-flex justify-content-between align-items-center mb-2">
      <div>
        <button onClick={goToBack} className="btn btn-outline-secondary me-2">
          Previous Month
        </button>
        <button onClick={goToToday} className="btn btn-outline-secondary me-2">
          Today
        </button>
        <button onClick={goToNext} className="btn btn-outline-secondary">
          Next Month
        </button>
      </div>
      <div className="flex-grow-1 text-center">
        <h5 className="m-0">{toolbar.label}</h5>
      </div>
      <div style={{ width: '400px' }} />
    </div>
  );
};

export default CustomToolbar;