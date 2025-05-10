import React from 'react';
import { FaTrashAlt } from 'react-icons/fa';

const CustomEvent = ({ event, onDelete }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span title={event.desc}>{event.title}</span>
      {event.isHoliday && (
        <FaTrashAlt
          onClick={(e) => {
            e.stopPropagation();
            onDelete(event);
          }}
          style={{ marginLeft: 8, cursor: 'pointer', color: 'white' }}
          title="Delete Holiday"
        />
      )}
    </div>
  );
};

export default CustomEvent;
