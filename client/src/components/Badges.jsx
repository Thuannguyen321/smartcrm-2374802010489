import { PRIORITY_LABEL, SLA_LABEL, STATUS_LABEL } from '../utils/format';

export const StatusBadge = ({ value }) => <span className={`badge status-${value}`}>{STATUS_LABEL[value] || value}</span>;
export const PriorityBadge = ({ value }) => <span className={`badge prio-${value}`}>{PRIORITY_LABEL[value] || value}</span>;
export const SlaBadge = ({ value }) => <span className={`badge sla-${value}`}>{SLA_LABEL[value] || value}</span>;
