const AIInsightCard = ({ title, description, action }) => <article className="insight-card"><span>✦ Insight</span><h4>{title}</h4><p>{description}</p>{action && <button className="text-button" onClick={action}>Review work →</button>}</article>;
export default AIInsightCard;
