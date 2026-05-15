export type AuditLog = {
  id: number;
  actorUserId: number;
  action: string;
  targetType: string;
  targetId: number;
  reason: string | null;
  createdAt: string;
};

export type AuditLogQuery = {
  action?: string;
  actorUserId?: number;
  targetType?: string;
  startAt?: string;
  endAt?: string;
  limit?: number;
};
