import PropTypes from "prop-types";

const Card = ({ title, children }) => (
  <div className="card">
    <div className="card-header d-flex justify-content-between align-items-center">
      <h5 className="mb-0">{title}</h5>
      <button className="btn-close"></button>
    </div>
    <div className="card-body">{children}</div>
  </div>
);

export default Card;

Card.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};