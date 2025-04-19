import React, { useState, useEffect } from 'react';
import moment from "moment";

const MonthSelector = ({ months, onSelection }) => {
  const today = new Date();
  const date = moment(today).format("YYYY-MM");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < months.length - 1;

  useEffect(() => {
    if(currentIndex) {
      onSelection(months[currentIndex]?.idSalaryMonth ?? 0);
    }
  }, [currentIndex]);

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {hasPrevious && (
        <button onClick={handlePrevious} className='arrowbuttonStyle'>
          &lt;
        </button>
      )}

      {!hasPrevious && <div style={{ width: '42px' }}></div>} {/* Spacer for consistent layout */}

      <input
        type="text"
        value={months[currentIndex]?.salaryMonthText || ''}
        readOnly
        className='form-control'
      />

      {hasNext && (
        <button onClick={handleNext} className='arrowbuttonStyle'>
          &gt;
        </button>
      )}

      {!hasNext && <div style={{ width: '42px' }}></div>} {/* Spacer for consistent layout */}
    </div>
  );
};

export default MonthSelector;
