import React from "react";
import PropTypes from "prop-types";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const MAX_VISIBLE_PAGES = 5; 
  const EDGE_PAGES = 2; 

  const renderPageNumbers = () => {
    if (totalPages <= 10) {
      return Array.from({ length: totalPages }, (_, index) => (
        <PageItem
          key={index}
          pageNumber={index + 1}
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
      ));
    }

    const pages = [];
    const leftBound = currentPage - Math.floor(MAX_VISIBLE_PAGES / 2);
    const rightBound = currentPage + Math.floor(MAX_VISIBLE_PAGES / 2);

    for (let i = 1; i <= EDGE_PAGES; i++) {
      pages.push(
        <PageItem
          key={i}
          pageNumber={i}
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
      );
    }

    if (leftBound > EDGE_PAGES + 1) {
      pages.push(<Ellipsis key="left-ellipsis" />);
    }

    const start = Math.max(EDGE_PAGES + 1, leftBound);
    const end = Math.min(totalPages - EDGE_PAGES, rightBound);

    for (let i = start; i <= end; i++) {
      pages.push(
        <PageItem
          key={i}
          pageNumber={i}
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
      );
    }

    if (rightBound < totalPages - EDGE_PAGES) {
      pages.push(<Ellipsis key="right-ellipsis" />);
    }


    for (let i = Math.max(totalPages - EDGE_PAGES + 1, end + 1); i <= totalPages; i++) {
      if (i > end) { 
        pages.push(
          <PageItem
            key={i}
            pageNumber={i}
            currentPage={currentPage}
            onPageChange={onPageChange}
          />
        );
      }
    }

    return pages;
  };

  return (
    <nav aria-label="Page navigation">
      <ul className="pagination justify-content-end">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => onPageChange(1)} aria-label="First">
            <i className="tf-icon bx bx-chevrons-left"></i>
          </button>
        </li>
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            aria-label="Previous"
          >
            <i className="tf-icon bx bx-chevron-left"></i>
          </button>
        </li>

        {renderPageNumbers()}

        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            aria-label="Next"
          >
            <i className="tf-icon bx bx-chevron-right"></i>
          </button>
        </li>
        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(totalPages)}
            aria-label="Last"
          >
            <i className="tf-icon bx bx-chevrons-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
};


const PageItem = ({ pageNumber, currentPage, onPageChange }) => (
  <li className={`page-item ${currentPage === pageNumber ? "active" : ""}`}>
    <button
      className="page-link"
      onClick={() => onPageChange(pageNumber)}
      aria-label={`Page ${pageNumber}`}
      aria-current={currentPage === pageNumber ? "page" : null}
    >
      {pageNumber}
    </button>
  </li>
);


const Ellipsis = () => (
  <li className="page-item disabled">
    <span className="page-link">...</span>
  </li>
);

PageItem.propTypes = {
  pageNumber: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;