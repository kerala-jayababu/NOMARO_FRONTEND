import PropTypes from "prop-types";

const Card = ({ title, children }) => (
  <div className="card">
    {title && (
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{title}</h5>
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
);

export default Card;

Card.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
};