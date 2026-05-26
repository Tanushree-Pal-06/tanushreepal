/**
 * DeskFlow - SLA Computation Utilities
 * Author: Tanushree Pal | 0827AL231132
 */

export const SLA_THRESHOLDS = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 72,
};

export function computeDerivedFields(ticket) {
  const now = new Date();
  const createdAt = new Date(ticket.created_at);
  const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at) : null;

  const endTime =
    ticket.status === 'resolved' || ticket.status === 'closed'
      ? resolvedAt || now
      : now;

  const ageMinutes = Math.floor((endTime - createdAt) / 60000);

  const thresholdHours = SLA_THRESHOLDS[ticket.priority] || 72;
  const thresholdMinutes = thresholdHours * 60;
  const slaBreached = ageMinutes > thresholdMinutes;

  return {
    ...ticket,
    ageMinutes,
    slaBreached,
  };
}

export const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export const ALLOWED_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['open', 'resolved'],
  resolved: ['in_progress', 'closed'],
  closed: ['resolved'],
};

export function isValidTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) || false;
}

export function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
