export type DashboardSummary = {
  totalSlots: number;
  availableSlots: number;
  reservedSlots: number;
  usingSlots: number;
  abnormalSlots: number;
  activeReservations: number;
  checkedInReservations: number;
};

export type AreaUsageSummary = {
  areaId: number;
  areaName: string;
  totalSlots: number;
  reservedSlots: number;
  usingSlots: number;
  abnormalSlots: number;
  usageRate: number;
};

export type DashboardData = {
  date: string;
  summary: DashboardSummary;
  areaUsage: AreaUsageSummary[];
};
