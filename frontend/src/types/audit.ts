export type AuditLog = {
  id: number;
  actorUserId: number;
  action: string;
  targetType: string;
  targetId: number;
  reason: string | null;
  createdAt: string;
};
