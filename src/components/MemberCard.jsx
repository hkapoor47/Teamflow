const MemberCard = ({ member, taskCount, progress }) => <article className="member-card"><div className="member-avatar">{member.name.charAt(0)}</div><div><h4>{member.name}</h4><p>{member.role}</p></div><div className="member-card-stats"><strong>{taskCount}</strong><span>tasks · {progress}% avg.</span></div></article>;
export default MemberCard;
