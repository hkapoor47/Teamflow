const StatCard = ({ label, value, detail, icon = "•", onClick }) => <button className="overview-card" onClick={onClick}><span className="overview-icon teal">{icon}</span><span><small>{label}</small><strong>{value}</strong><em>{detail}</em></span></button>;
export default StatCard;
