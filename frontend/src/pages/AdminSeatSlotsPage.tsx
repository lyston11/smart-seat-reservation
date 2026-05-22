import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PointerEvent } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Popover,
  Radio,
  Select,
  Space,
  message,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { CalendarDays, CheckSquare, Clock3, Eraser, Plus, Trash2 } from 'lucide-react';
import { listAreas } from '../api/areas';
import {
  adminMarkSeatSlotAbnormal,
  adminReleaseSeatSlot,
  adminRestoreSeatSlot,
} from '../api/adminSeatSlots';
import {
  cancelSeatSlotsBatch,
  cancelSeatSlot,
  createSeatSlotPublishPlan,
  listSeatSlots,
  listSeatSlotPublishPlans,
  publishSeatSlotsBatch,
  publishSeatSlots,
  stopSeatSlotPublishPlan,
} from '../api/seatSlots';
import { listSeats } from '../api/seats';
import AdminSeatSlotActions from '../components/AdminSeatSlotActions';
import type { AdminSeatSlotActionType } from '../components/AdminSeatSlotActions';
import type { Area, Seat, SeatSlot, SeatSlotPublishPlan, SeatSlotStatus } from '../types/seat';

type PublishFormValues = {
  areaId: number;
  slotDates: dayjs.Dayjs[];
  timeRanges: TimeRangeValue[];
  seatIds: number[];
};

type CancelMode = 'selectedDates' | 'dateRange' | 'stopPlan';

type TimeRangeValue = {
  startTime: string;
  endTime: string;
};

type TimeOption = {
  label: string;
  value: string;
};

type TimeOptions = {
  startOptions: TimeOption[];
  endOptions: TimeOption[];
};

type SeatGroup = {
  key: string;
  tableNo: string;
  seats: Seat[];
  selectedCount: number;
};

type TimeTemplate = {
  label: string;
  periods: [string, string][];
};

const timeTemplates: TimeTemplate[] = [
  { label: '上午', periods: [['08:00', '12:00']] },
  { label: '下午', periods: [['14:00', '18:00']] },
  { label: '晚间', periods: [['18:00', '22:00']] },
  {
    label: '全天常用',
    periods: [
      ['08:00', '10:00'],
      ['10:00', '12:00'],
      ['14:00', '16:00'],
      ['16:00', '18:00'],
      ['18:00', '20:00'],
      ['20:00', '22:00'],
    ],
  },
];

const statusText: Record<SeatSlotStatus, string> = {
  AVAILABLE: '空闲',
  RESERVED: '已预约',
  USING: '使用中',
  LOCKED: '已锁位',
  ABNORMAL: '异常占用',
  UNPUBLISHED: '未开放',
};

const statusColor: Record<SeatSlotStatus, string> = {
  AVAILABLE: 'green',
  RESERVED: 'blue',
  USING: 'orange',
  LOCKED: 'purple',
  ABNORMAL: 'red',
  UNPUBLISHED: 'default',
};

function compareNullableNumber(left: number | null, right: number | null) {
  const normalizedLeft = left ?? Number.MAX_SAFE_INTEGER;
  const normalizedRight = right ?? Number.MAX_SAFE_INTEGER;
  return normalizedLeft - normalizedRight;
}

function compareSeats(left: Seat, right: Seat) {
  return (
    compareNullableNumber(left.tableDisplayOrder, right.tableDisplayOrder) ||
    compareNullableNumber(left.tableRowNo, right.tableRowNo) ||
    compareNullableNumber(left.tableColumnNo, right.tableColumnNo) ||
    (left.tableNo ?? '').localeCompare(right.tableNo ?? '') ||
    compareNullableNumber(left.displayOrder, right.displayOrder) ||
    compareNullableNumber(left.rowNo, right.rowNo) ||
    compareNullableNumber(left.columnNo, right.columnNo) ||
    compareNullableNumber(left.seatOrder, right.seatOrder) ||
    left.seatNo.localeCompare(right.seatNo)
  );
}

function isVisibleSeat(seat: Seat) {
  return seat.status === 'ACTIVE' && (seat.tableNo ?? '').toUpperCase() !== 'LEGACY';
}

function getSeatOptionLabel(seat: Seat) {
  const tableText = seat.tableNo ?? '未分配桌位';
  const labelText = seat.seatLabel ? ` (${seat.seatLabel})` : '';
  return `${tableText} · ${seat.seatNo}${labelText}`;
}

function toTimeRangeValue(period: [string, string]): TimeRangeValue {
  return { startTime: period[0], endTime: period[1] };
}

function toTimeText(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getAdminEarliestStartMinutes(slotDate: dayjs.Dayjs, now: dayjs.Dayjs) {
  if (!slotDate.isSame(now, 'day')) {
    return 0;
  }
  return Math.ceil((now.hour() * 60 + now.minute() + 1) / 30) * 30;
}

function buildAdminTimeOptions(slotDate: dayjs.Dayjs, now: dayjs.Dayjs): TimeOptions {
  const earliestStartMinutes = getAdminEarliestStartMinutes(slotDate, now);
  const latestEndMinutes = 23 * 60 + 30;
  const latestStartMinutes = latestEndMinutes - 30;
  const startOptions: TimeOption[] = [];
  const endOptions: TimeOption[] = [];

  for (let minutes = earliestStartMinutes; minutes <= latestStartMinutes; minutes += 30) {
    const value = toTimeText(minutes);
    startOptions.push({ label: value, value });
  }

  for (let minutes = Math.max(earliestStartMinutes + 30, 30); minutes <= latestEndMinutes; minutes += 30) {
    const value = toTimeText(minutes);
    endOptions.push({ label: value, value });
  }

  return { startOptions, endOptions };
}

function isPastOrStartedPeriod(slotDate: dayjs.Dayjs, startTime: string, now: dayjs.Dayjs) {
  const startAt = dayjs(`${slotDate.format('YYYY-MM-DD')}T${startTime}:00`);
  return !startAt.isAfter(now);
}

function getDefaultFutureRange(slotDate: dayjs.Dayjs, now: dayjs.Dayjs): TimeRangeValue {
  const latestStartMinutes = 23 * 60;
  const latestEndMinutes = 23 * 60 + 30;
  const startMinutes = Math.min(getAdminEarliestStartMinutes(slotDate, now), latestStartMinutes);
  const endMinutes = Math.min(startMinutes + 120, latestEndMinutes);
  return {
    startTime: toTimeText(startMinutes),
    endTime: toTimeText(endMinutes),
  };
}

function normalizeSelectedDates(dates: dayjs.Dayjs[]) {
  return Array.from(
    new Map(
      dates
        .filter((date) => date.isValid())
        .map((date) => [date.format('YYYY-MM-DD'), date.startOf('day')]),
    ).values(),
  ).sort((left, right) => left.valueOf() - right.valueOf());
}

function buildDatesBetween(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) {
  const start = startDate.isBefore(endDate, 'day') ? startDate.startOf('day') : endDate.startOf('day');
  const end = startDate.isBefore(endDate, 'day') ? endDate.startOf('day') : startDate.startOf('day');
  const dates: dayjs.Dayjs[] = [];
  let cursor = start;
  while (!cursor.isAfter(end, 'day')) {
    dates.push(cursor);
    cursor = cursor.add(1, 'day');
  }
  return dates;
}

function getCalendarCells(month: dayjs.Dayjs) {
  const start = month.startOf('month').startOf('week');
  return Array.from({ length: 42 }, (_, index) => start.add(index, 'day'));
}

function formatPlanPeriods(plan: SeatSlotPublishPlan) {
  return plan.periods
    .map((period) => `${period.startTime.slice(0, 5)}-${period.endTime.slice(0, 5)}`)
    .join('、');
}

export default function AdminSeatSlotsPage() {
  const [form] = Form.useForm<PublishFormValues>();
  const [areas, setAreas] = useState<Area[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [slots, setSlots] = useState<SeatSlot[]>([]);
  const [areaId, setAreaId] = useState(1);
  const [now, setNow] = useState(() => dayjs());
  const [slotDate, setSlotDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishPlanLoading, setPublishPlanLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState<CancelMode>('selectedDates');
  const [cancelRange, setCancelRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(() => [dayjs(), dayjs()]);
  const [cancelBlockAutoPublish, setCancelBlockAutoPublish] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [cancelGeneratedSlots, setCancelGeneratedSlots] = useState(true);
  const [cancellingOpenings, setCancellingOpenings] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [publishPlans, setPublishPlans] = useState<SeatSlotPublishPlan[]>([]);
  const [reasonAction, setReasonAction] = useState<{
    type: AdminSeatSlotActionType;
    slotId: number;
  } | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => dayjs().startOf('month'));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dragSelection, setDragSelection] = useState<{
    startDate: dayjs.Dayjs;
    mode: 'add' | 'remove';
  } | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const watchedSeatIds = Form.useWatch('seatIds', form);
  const watchedTimeRanges = Form.useWatch('timeRanges', form);
  const watchedSlotDates = Form.useWatch('slotDates', form);

  const dateText = useMemo(() => slotDate.format('YYYY-MM-DD'), [slotDate]);
  const selectedSeatIds = useMemo(() => watchedSeatIds ?? [], [watchedSeatIds]);
  const selectedSlotDates = useMemo(() => normalizeSelectedDates(watchedSlotDates ?? [slotDate]), [slotDate, watchedSlotDates]);
  const selectedSlotDateKeys = useMemo(
    () => new Set(selectedSlotDates.map((date) => date.format('YYYY-MM-DD'))),
    [selectedSlotDates],
  );
  const selectedDateSummary = useMemo(() => {
    if (selectedSlotDates.length === 0) {
      return '';
    }
    if (selectedSlotDates.length === 1) {
      return selectedSlotDates[0].format('YYYY-MM-DD');
    }
    if (selectedSlotDates.length <= 3) {
      return selectedSlotDates.map((date) => date.format('YYYY-MM-DD')).join('、');
    }
    return `${selectedSlotDates[0].format('YYYY-MM-DD')} 等 ${selectedSlotDates.length} 天`;
  }, [selectedSlotDates]);
  const publishDateCount = selectedSlotDates.length;
  const activePublishPlans = useMemo(
    () => publishPlans.filter((plan) => plan.status === 'ACTIVE'),
    [publishPlans],
  );
  const activeSeats = useMemo(
    () => seats.filter(isVisibleSeat).sort(compareSeats),
    [seats],
  );
  const selectedSeatIdSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);
  const timeOptions = useMemo(
    () => buildAdminTimeOptions(slotDate, now),
    [now, slotDate],
  );
  const startTimeOptions = timeOptions.startOptions;
  const endTimeOptions = timeOptions.endOptions;
  const defaultFutureRange = useMemo(
    () => getDefaultFutureRange(slotDate, now),
    [now, slotDate],
  );
  const calendarCells = useMemo(() => getCalendarCells(calendarMonth), [calendarMonth]);
  const seatGroups = useMemo<SeatGroup[]>(() => {
    const groups = new Map<string, SeatGroup>();
    activeSeats.forEach((seat) => {
      const key = seat.tableId ? `table-${seat.tableId}` : `table-${seat.tableNo ?? 'none'}`;
      const existingGroup = groups.get(key);
      if (existingGroup) {
        existingGroup.seats.push(seat);
        if (selectedSeatIdSet.has(seat.id)) {
          existingGroup.selectedCount += 1;
        }
        return;
      }
      groups.set(key, {
        key,
        tableNo: seat.tableNo ?? '未分配桌位',
        seats: [seat],
        selectedCount: selectedSeatIdSet.has(seat.id) ? 1 : 0,
      });
    });
    return Array.from(groups.values());
  }, [activeSeats, selectedSeatIdSet]);
  const validPeriodCount = useMemo(
    () => (watchedTimeRanges ?? []).filter((range) => range?.startTime && range?.endTime).length,
    [watchedTimeRanges],
  );
  const publishEstimateCount = selectedSeatIds.length * validPeriodCount * publishDateCount;
  const hasFuturePublishTime = startTimeOptions.length > 0;
  const watchedTimeRangeKeys = useMemo(
    () => (watchedTimeRanges ?? []).map((range) => `${range?.startTime ?? ''}-${range?.endTime ?? ''}`).join('|'),
    [watchedTimeRanges],
  );
  const seatSelectOptions = useMemo(
    () =>
      seatGroups.map((group) => ({
        label: `${group.tableNo} (${group.seats.length})`,
        options: group.seats.map((seat) => ({ label: getSeatOptionLabel(seat), value: seat.id })),
      })),
    [seatGroups],
  );

  const loadAreas = useCallback(async () => {
    try {
      const nextAreas = await listAreas();
      setAreas(nextAreas);
      if (nextAreas.length > 0 && !nextAreas.some((area) => area.id === areaId)) {
        setAreaId(nextAreas[0].id);
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载区域失败');
    }
  }, [areaId, messageApi]);

  const loadSeats = useCallback(async () => {
    try {
      setSeats(await listSeats(areaId));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载座位失败');
    }
  }, [areaId, messageApi]);

  const loadSlots = useCallback(async (nextAreaId = areaId, nextDateText = dateText) => {
    setLoading(true);
    try {
      setSlots(await listSeatSlots(nextAreaId, nextDateText));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载开放时段失败');
    } finally {
      setLoading(false);
    }
  }, [areaId, dateText, messageApi]);

  const loadPublishPlans = useCallback(async (nextAreaId = areaId) => {
    try {
      const plans = await listSeatSlotPublishPlans(nextAreaId);
      setPublishPlans(plans);
      const firstActivePlan = plans.find((plan) => plan.status === 'ACTIVE');
      setSelectedPlanId((currentPlanId) => {
        if (currentPlanId && plans.some((plan) => plan.id === currentPlanId && plan.status === 'ACTIVE')) {
          return currentPlanId;
        }
        return firstActivePlan?.id ?? null;
      });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载持续开放计划失败');
    }
  }, [areaId, messageApi]);

  async function publishSlots() {
    const values = await form.validateFields();
    const timeRanges = values.timeRanges.filter((range) => range?.startTime && range?.endTime);
    const publishDates = normalizeSelectedDates(values.slotDates ?? []);
    if (publishDates.length === 0) {
      messageApi.warning('请选择开放日期');
      return;
    }
    const firstPublishDate = publishDates[0];
    const invalidPeriod = timeRanges.find((range) => isPastOrStartedPeriod(firstPublishDate, range.startTime, now));
    if (invalidPeriod) {
      messageApi.warning(`${firstPublishDate.format('YYYY-MM-DD')} ${invalidPeriod.startTime} 已开始或已过去，不能发布`);
      return;
    }
    const periods = timeRanges.map((range) => ({
      startTime: `${range.startTime}:00`,
      endTime: `${range.endTime}:00`,
    }));
    setPublishing(true);
    try {
      if (publishDates.length > 1) {
        const result = await publishSeatSlotsBatch({
          areaId: values.areaId,
          slotDates: publishDates.map((date) => date.format('YYYY-MM-DD')),
          periods,
          seatIds: values.seatIds,
        });
        messageApi.success(
          `已开放 ${result.dateCount} 天，共发布 ${result.createdCount} 个时段，跳过 ${result.skippedCount} 个重复时段`,
        );
      } else {
        const result = await publishSeatSlots({
          areaId: values.areaId,
          slotDate: firstPublishDate.format('YYYY-MM-DD'),
          periods,
          seatIds: values.seatIds,
        });
        messageApi.success(`已发布 ${result.createdCount} 个时段，跳过 ${result.skippedCount} 个重复时段`);
      }
      setAreaId(values.areaId);
      setSlotDate(firstPublishDate);
      await loadSlots(values.areaId, firstPublishDate.format('YYYY-MM-DD'));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  }

  async function createContinuousPublishPlan() {
    const values = await form.validateFields();
    const publishDates = normalizeSelectedDates(values.slotDates ?? []);
    if (publishDates.length === 0) {
      messageApi.warning('请选择持续开放开始日期');
      return;
    }
    const periods = values.timeRanges
      .filter((range) => range?.startTime && range?.endTime)
      .map((range) => ({
        startTime: `${range.startTime}:00`,
        endTime: `${range.endTime}:00`,
      }));
    setPublishPlanLoading(true);
    try {
      const plan = await createSeatSlotPublishPlan({
        areaId: values.areaId,
        startDate: publishDates[0].format('YYYY-MM-DD'),
        endDate: null,
        periods,
        seatIds: values.seatIds,
      });
      messageApi.success(`已创建持续开放计划 #${plan.id}，系统会滚动生成后续开放时段`);
      setAreaId(values.areaId);
      await loadPublishPlans(values.areaId);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '创建持续开放计划失败');
    } finally {
      setPublishPlanLoading(false);
    }
  }

  async function runCancelOpenings() {
    setCancellingOpenings(true);
    try {
      if (cancelMode === 'stopPlan') {
        if (!selectedPlanId) {
          messageApi.warning('请选择要停止的持续开放计划');
          return;
        }
        const result = await stopSeatSlotPublishPlan(selectedPlanId, {
          stopFromDate: cancelRange[0].format('YYYY-MM-DD'),
          cancelGeneratedSlots,
        });
        const blockedText = result.blockedCount > 0
          ? `，${result.blockedCount} 个已预约/占用时段已保留`
          : '';
        messageApi.success(`已停止持续开放计划，撤销 ${result.cancelledCount} 个空闲时段${blockedText}`);
        setCancelModalOpen(false);
        await loadPublishPlans();
        await loadSlots();
        return;
      }

      const result = await cancelSeatSlotsBatch(
        cancelMode === 'selectedDates'
          ? {
              areaId,
              slotDates: selectedSlotDates.map((date) => date.format('YYYY-MM-DD')),
              blockAutoPublish: cancelBlockAutoPublish,
              reason: '管理员撤销开放',
            }
          : {
              areaId,
              startDate: cancelRange[0].format('YYYY-MM-DD'),
              endDate: cancelRange[1].format('YYYY-MM-DD'),
              blockAutoPublish: cancelBlockAutoPublish,
              reason: '管理员撤销开放',
            },
      );
      const blockedText = result.blockedCount > 0
        ? `，${result.blockedCount} 个已预约/占用时段已保留`
        : '';
      const autoPublishText = result.blockedAutoPublishDateCount > 0
        ? `，并阻止 ${result.blockedAutoPublishDateCount} 天被持续计划重新开放`
        : '';
      messageApi.success(`已撤销 ${result.dateCount} 天内 ${result.cancelledCount} 个空闲时段${blockedText}${autoPublishText}`);
      setCancelModalOpen(false);
      await loadSlots();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '撤销开放失败');
    } finally {
      setCancellingOpenings(false);
    }
  }

  async function cancelSlot(slotId: number) {
    setCancellingId(slotId);
    try {
      await cancelSeatSlot(slotId);
      messageApi.success('开放时段已撤销');
      await loadSlots();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '撤销失败');
    } finally {
      setCancellingId(null);
    }
  }

  async function runReasonAction() {
    if (!reasonAction) {
      return;
    }
    if (!reason.trim()) {
      messageApi.warning('请填写原因');
      return;
    }
    const slotId = reasonAction.slotId;
    setActionLoadingId(slotId);
    try {
      if (reasonAction.type === 'release') {
        await adminReleaseSeatSlot(slotId, reason.trim());
        messageApi.success('座位时段已释放');
      } else if (reasonAction.type === 'mark-abnormal') {
        await adminMarkSeatSlotAbnormal(slotId, reason.trim());
        messageApi.success('座位时段已标记异常');
      } else {
        await adminRestoreSeatSlot(slotId, reason.trim());
        messageApi.success('座位时段已恢复空闲');
      }
      setReasonAction(null);
      setReason('');
      await loadSlots();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setActionLoadingId(null);
    }
  }

  function openReasonAction(type: AdminSeatSlotActionType, slotId: number) {
    setReasonAction({ type, slotId });
    setReason('');
  }

  function setSeatIds(nextSeatIds: number[]) {
    const activeSeatOrder = new Map(activeSeats.map((seat, index) => [seat.id, index]));
    const normalizedSeatIds = Array.from(new Set(nextSeatIds))
      .filter((seatId) => activeSeatOrder.has(seatId))
      .sort((left, right) => (activeSeatOrder.get(left) ?? 0) - (activeSeatOrder.get(right) ?? 0));
    form.setFieldValue('seatIds', normalizedSeatIds);
  }

  function selectAllSeats() {
    setSeatIds(activeSeats.map((seat) => seat.id));
  }

  function clearSelectedSeats() {
    setSeatIds([]);
  }

  function toggleTableSeats(group: SeatGroup) {
    const tableSeatIds = group.seats.map((seat) => seat.id);
    const isWholeTableSelected = tableSeatIds.every((seatId) => selectedSeatIdSet.has(seatId));
    if (isWholeTableSelected) {
      setSeatIds(selectedSeatIds.filter((seatId) => !tableSeatIds.includes(seatId)));
      return;
    }
    setSeatIds([...selectedSeatIds, ...tableSeatIds]);
  }

  function applyTimeTemplate(template: TimeTemplate) {
    const nextRanges = template.periods
      .map(toTimeRangeValue)
      .filter((range) => !isPastOrStartedPeriod(slotDate, range.startTime, now));
    if (nextRanges.length === 0) {
      messageApi.warning('该模板的时间段都已开始或过去，请选择后续时间段');
      return;
    }
    if (nextRanges.length < template.periods.length) {
      messageApi.info('已自动跳过开始时间已过的时间段');
    }
    form.setFieldValue('timeRanges', nextRanges);
  }

  function setSelectedDates(nextDates: dayjs.Dayjs[]) {
    const normalizedDates = normalizeSelectedDates(nextDates);
    form.setFieldValue('slotDates', normalizedDates);
    if (normalizedDates.length > 0) {
      setSlotDate(normalizedDates[0]);
    }
  }

  function applyCalendarDateSelection(targetDate: dayjs.Dayjs, mode: 'add' | 'remove') {
    if (targetDate.isBefore(now, 'day')) {
      return;
    }
    const nextDateKeys = new Set(selectedSlotDateKeys);
    const rangeDates = dragSelection
      ? buildDatesBetween(dragSelection.startDate, targetDate)
      : [targetDate.startOf('day')];
    rangeDates.forEach((date) => {
      if (date.isBefore(now, 'day')) {
        return;
      }
      const key = date.format('YYYY-MM-DD');
      if (mode === 'add') {
        nextDateKeys.add(key);
      } else {
        nextDateKeys.delete(key);
      }
    });
    setSelectedDates(Array.from(nextDateKeys).map((key) => dayjs(key)));
  }

  function startCalendarDrag(targetDate: dayjs.Dayjs, event: PointerEvent<HTMLButtonElement>) {
    if (targetDate.isBefore(now, 'day')) {
      return;
    }
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const key = targetDate.format('YYYY-MM-DD');
    const mode = selectedSlotDateKeys.has(key) ? 'remove' : 'add';
    setDragSelection({ startDate: targetDate.startOf('day'), mode });
    applyCalendarDateSelection(targetDate, mode);
  }

  function applyCalendarPointerMove(event: PointerEvent<HTMLElement>) {
    if (!dragSelection) {
      return;
    }
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLButtonElement>('[data-slot-date]');
    const dateText = target?.dataset.slotDate;
    if (!dateText) {
      return;
    }
    applyCalendarDateSelection(dayjs(dateText), dragSelection.mode);
  }

  function clearSelectedDates() {
    setSelectedDates([]);
  }

  function selectRestOfCurrentMonth() {
    const monthEnd = calendarMonth.endOf('month');
    const startDate = now.isAfter(calendarMonth.startOf('month'), 'day') ? now.startOf('day') : calendarMonth.startOf('month');
    setSelectedDates([...selectedSlotDates, ...buildDatesBetween(startDate, monthEnd)]);
  }

  function selectNextThirtyDays() {
    setSelectedDates([...selectedSlotDates, ...buildDatesBetween(now.startOf('day'), now.add(29, 'day').startOf('day'))]);
  }

  useEffect(() => {
    const existingRanges = form.getFieldValue('timeRanges');
    const existingDates = form.getFieldValue('slotDates');
    form.setFieldsValue({
      areaId,
      slotDates: Array.isArray(existingDates) ? existingDates : [slotDate],
      seatIds: form.getFieldValue('seatIds') ?? [],
      timeRanges: existingRanges?.length
        ? existingRanges
        : [
            defaultFutureRange,
          ],
    });
  }, [areaId, defaultFutureRange, form, slotDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAreas();
      void loadSeats();
      void loadSlots();
      void loadPublishPlans();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAreas, loadPublishPlans, loadSeats, loadSlots]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(dayjs()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!dragSelection) {
      return;
    }
    const stopDrag = () => setDragSelection(null);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, [dragSelection]);

  useEffect(() => {
    const ranges = (form.getFieldValue('timeRanges') ?? []) as TimeRangeValue[];
    let changed = false;
    const normalizedRanges = ranges.map((range) => {
      if (!range?.startTime || !range?.endTime) {
        return range;
      }
      const nextRange = { ...range };
      if (isPastOrStartedPeriod(slotDate, nextRange.startTime, now)) {
        nextRange.startTime = startTimeOptions[0]?.value ?? nextRange.startTime;
        changed = true;
      }
      if (nextRange.endTime <= nextRange.startTime) {
        nextRange.endTime =
          endTimeOptions.find((option) => option.value > nextRange.startTime)?.value
          ?? nextRange.endTime;
        changed = true;
      }
      return nextRange;
    });
    if (changed) {
      form.setFieldValue('timeRanges', normalizedRanges);
    }
  }, [endTimeOptions, form, now, slotDate, startTimeOptions, watchedTimeRangeKeys]);

  const columns: TableColumnsType<SeatSlot> = [
    { title: '时段 ID', dataIndex: 'id', width: 120 },
    {
      title: '座位',
      width: 180,
      render: (_, record) => (
        <Space size={4} wrap>
          <Typography.Text strong>{record.seatNo ?? `#${record.seatId}`}</Typography.Text>
          {record.tableNo ? <Tag>{record.tableNo}</Tag> : null}
        </Space>
      ),
    },
    { title: '日期', dataIndex: 'slotDate', width: 140 },
    {
      title: '时间段',
      width: 180,
      render: (_, record) => `${record.startTime.slice(0, 5)}-${record.endTime.slice(0, 5)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 140,
      render: (status: SeatSlotStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
    },
    { title: '预约人', dataIndex: 'reservedBy', width: 120, render: (value) => value ?? '-' },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <AdminSeatSlotActions
          slot={record}
          cancelling={cancellingId === record.id}
          actionLoading={actionLoadingId === record.id}
          onCancel={cancelSlot}
          onReasonAction={openReasonAction}
        />
      ),
    },
  ];

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <Form form={form} layout="vertical">
          <div className="slot-publish-grid">
            <div className="slot-publish-section">
              <Typography.Text strong>基础信息</Typography.Text>
              <div className="slot-base-fields">
                <Form.Item
                  label="区域"
                  name="areaId"
                  rules={[{ required: true, message: '请选择区域' }]}
                >
                  <Select
                    className="area-select"
                    options={areas.map((area) => ({
                      label: `${area.name}${area.floor ? ` · ${area.floor}` : ''}`,
                      value: area.id,
                    }))}
                    onChange={(value) => {
                      setAreaId(value);
                      form.setFieldValue('seatIds', []);
                      void loadPublishPlans(value);
                    }}
                  />
                </Form.Item>
                <Form.Item
                  label="开放日期"
                  name="slotDates"
                  rules={[
                    {
                      validator: async (_, value?: dayjs.Dayjs[]) => {
                        if (!value || value.length === 0) {
                          throw new Error('请选择开放日期');
                        }
                      },
                    },
                  ]}
                >
                  <Popover
                    arrow={false}
                    content={(
                      <div className="multi-date-picker">
                        <div className="multi-date-picker-header">
                          <Button
                            aria-label="上个月"
                            size="small"
                            onClick={() => setCalendarMonth(calendarMonth.subtract(1, 'month'))}
                          >
                            ‹
                          </Button>
                          <Typography.Text strong>{calendarMonth.format('YYYY年 M月')}</Typography.Text>
                          <Button
                            aria-label="下个月"
                            size="small"
                            onClick={() => setCalendarMonth(calendarMonth.add(1, 'month'))}
                          >
                            ›
                          </Button>
                        </div>
                        <div className="multi-date-picker-weekdays">
                          {['日', '一', '二', '三', '四', '五', '六'].map((weekday) => (
                            <span key={weekday}>{weekday}</span>
                          ))}
                        </div>
                        <div
                          className="multi-date-picker-grid"
                          onMouseLeave={() => setDragSelection(null)}
                          onPointerMove={applyCalendarPointerMove}
                        >
                          {calendarCells.map((date) => {
                            const key = date.format('YYYY-MM-DD');
                            const selected = selectedSlotDateKeys.has(key);
                            const disabled = date.isBefore(now, 'day');
                            return (
                              <button
                                key={key}
                                type="button"
                                className={[
                                  'multi-date-picker-cell',
                                  selected ? 'multi-date-picker-cell-selected' : '',
                                  !date.isSame(calendarMonth, 'month') ? 'multi-date-picker-cell-muted' : '',
                                  disabled ? 'multi-date-picker-cell-disabled' : '',
                                ].filter(Boolean).join(' ')}
                                aria-label={`${key}${selected ? ' 已选择' : ' 未选择'}`}
                                aria-pressed={selected}
                                data-slot-date={key}
                                disabled={disabled}
                                onPointerDown={(event) => startCalendarDrag(date, event)}
                                onPointerEnter={() => {
                                  if (dragSelection) {
                                    applyCalendarDateSelection(date, dragSelection.mode);
                                  }
                                }}
                              >
                                {date.date()}
                              </button>
                            );
                          })}
                        </div>
                        <div className="multi-date-picker-footer">
                          <Typography.Text type="secondary">已选 {publishDateCount} 天</Typography.Text>
                          <Space wrap>
                            <Button size="small" onClick={selectRestOfCurrentMonth}>
                              选本月剩余
                            </Button>
                            <Button size="small" onClick={selectNextThirtyDays}>
                              选未来 30 天
                            </Button>
                            <Button size="small" onClick={clearSelectedDates}>
                              清空日期
                            </Button>
                          </Space>
                        </div>
                      </div>
                    )}
                    onOpenChange={setDatePickerOpen}
                    open={datePickerOpen}
                    placement="bottomLeft"
                    trigger="click"
                    getPopupContainer={(triggerNode) => triggerNode.parentElement ?? document.body}
                  >
                    <button
                      aria-label={`选择开放日期 ${selectedDateSummary || '未选择'}`}
                      className="ant-picker multi-date-picker-trigger"
                      type="button"
                    >
                      <span
                        className={selectedDateSummary
                          ? 'multi-date-picker-trigger-value'
                          : 'multi-date-picker-trigger-placeholder'}
                      >
                        {selectedDateSummary || '请选择开放日期'}
                      </span>
                      <CalendarDays size={16} />
                    </button>
                  </Popover>
                </Form.Item>
              </div>
            </div>

            <div className="slot-publish-section">
              <Space className="slot-section-title" align="center" size={6}>
                <Clock3 size={16} />
                <Typography.Text strong>开放时间</Typography.Text>
                <Typography.Text type="secondary">半小时步进，最多 12 段</Typography.Text>
                {!hasFuturePublishTime ? (
                  <Typography.Text type="secondary">今天已无可发布时间段，请选择后续日期</Typography.Text>
                ) : null}
              </Space>
              <Space className="slot-template-row" wrap>
                {timeTemplates.map((template) => (
                  <Button
                    key={template.label}
                    size="small"
                    disabled={!template.periods.some((period) => !isPastOrStartedPeriod(slotDate, period[0], now))}
                    onClick={() => applyTimeTemplate(template)}
                  >
                    {template.label}
                  </Button>
                ))}
              </Space>
              <Form.Item required className="slot-period-form-item">
                <Form.List
                  name="timeRanges"
                  rules={[
                    {
                      validator: async (_, value) => {
                        if (!value || value.length === 0) {
                          throw new Error('请选择开放时间段');
                        }
                        if (value.length > 12) {
                          throw new Error('一次最多发布 12 个时间段');
                        }
                        const normalizedRanges = value
                          .filter((range: TimeRangeValue | undefined) => range?.startTime && range?.endTime)
                          .map((range: TimeRangeValue) => {
                            if (range.startTime >= range.endTime) {
                              throw new Error('结束时间必须晚于开始时间');
                            }
                            if (isPastOrStartedPeriod(slotDate, range.startTime, now)) {
                              throw new Error(`${range.startTime} 已开始或已过去`);
                            }
                            return `${range.startTime}-${range.endTime}`;
                          });
                        if (new Set(normalizedRanges).size !== normalizedRanges.length) {
                          throw new Error('存在重复时间段');
                        }
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <div className="period-list">
                      {fields.map(({ key, ...field }) => (
                        <Space key={key} className="period-item" align="baseline">
                          <Form.Item
                            name={[field.name, 'startTime']}
                            rules={[{ required: true, message: '请选择开始时间' }]}
                          >
                            <Select
                              aria-label="开始时间"
                              className="slot-time-select"
                              options={startTimeOptions}
                            />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'endTime']}
                            rules={[{ required: true, message: '请选择时间段' }]}
                          >
                            <Select
                              aria-label="结束时间"
                              className="slot-time-select"
                              options={endTimeOptions}
                            />
                          </Form.Item>
                          {fields.length > 1 ? (
                            <Button
                              aria-label="删除时间段"
                              icon={<Trash2 size={15} />}
                              size="small"
                              onClick={() => remove(field.name)}
                            />
                          ) : null}
                        </Space>
                      ))}
                      <Button
                        icon={<Plus size={15} />}
                        disabled={startTimeOptions.length === 0}
                        onClick={() => add(getDefaultFutureRange(slotDate, now))}
                      >
                        添加时间段
                      </Button>
                      <Form.ErrorList errors={errors} />
                    </div>
                  )}
                </Form.List>
              </Form.Item>
            </div>

            <div className="slot-publish-section slot-publish-section-wide">
              <div className="slot-seat-header">
                <Space align="center" size={8} wrap>
                  <Typography.Text strong>发布座位</Typography.Text>
                  <Tag color={selectedSeatIds.length > 0 ? 'blue' : 'default'}>
                    已选 {selectedSeatIds.length} / {activeSeats.length} 个座位
                  </Tag>
                </Space>
                <Space wrap>
                  <Button
                    icon={<CheckSquare size={15} />}
                    disabled={activeSeats.length === 0}
                    onClick={selectAllSeats}
                  >
                    全选当前区域座位
                  </Button>
                  <Button icon={<Eraser size={15} />} onClick={clearSelectedSeats}>
                    清空
                  </Button>
                </Space>
              </div>
              <div className="slot-table-selector" aria-label="按桌选择座位">
                {seatGroups.map((group) => {
                  const isWholeTableSelected = group.selectedCount === group.seats.length;
                  return (
                    <Button
                      key={group.key}
                      type={isWholeTableSelected ? 'primary' : 'default'}
                      onClick={() => toggleTableSeats(group)}
                    >
                      {group.tableNo} {group.selectedCount}/{group.seats.length}
                    </Button>
                  );
                })}
              </div>
              <Form.Item
                label="座位明细"
                name="seatIds"
                rules={[{ required: true, message: '请选择要发布的座位' }]}
              >
                <Select
                  className="seat-select"
                  mode="multiple"
                  maxTagCount="responsive"
                  options={seatSelectOptions}
                  placeholder="按桌或座位编号选择"
                  onChange={setSeatIds}
                />
              </Form.Item>
            </div>
          </div>

          <div className="slot-publish-footer">
            <Space wrap>
              <Tag color={publishEstimateCount > 0 ? 'green' : 'default'}>
                预计发布 {publishEstimateCount} 个座位时段
              </Tag>
              <Typography.Text type="secondary">
                {publishDateCount} 天 x {selectedSeatIds.length} 个座位 x {validPeriodCount} 个时间段
              </Typography.Text>
              {activePublishPlans.length > 0 ? (
                <Tag color="blue">持续开放计划 {activePublishPlans.length} 个</Tag>
              ) : null}
            </Space>
            <Space wrap>
              <Button type="primary" loading={publishing} disabled={!hasFuturePublishTime} onClick={publishSlots}>
                发布时段
              </Button>
              <Button loading={publishPlanLoading} onClick={createContinuousPublishPlan}>
                一直开放
              </Button>
              <Button loading={loading} onClick={() => loadSlots()}>
                查询时段
              </Button>
              <Button danger loading={cancellingOpenings} onClick={() => setCancelModalOpen(true)}>
                撤销开放
              </Button>
            </Space>
          </div>
        </Form>
      </div>

      {activePublishPlans.length > 0 ? (
        <div className="toolbar slot-plan-panel">
          <Space align="center" size={8} wrap>
            <Typography.Text strong>持续开放计划</Typography.Text>
            {activePublishPlans.map((plan) => (
              <Tag key={plan.id} color="blue">
                #{plan.id} 自 {plan.startDate} 起 · {plan.seatIds.length} 座位 · {formatPlanPeriods(plan)}
              </Tag>
            ))}
          </Space>
        </div>
      ) : null}

      <Table rowKey="id" loading={loading} dataSource={slots} columns={columns} pagination={false} />
      <Modal
        title="撤销开放"
        open={cancelModalOpen}
        okText="确认撤销"
        cancelText="取消"
        confirmLoading={cancellingOpenings}
        onOk={runCancelOpenings}
        onCancel={() => setCancelModalOpen(false)}
      >
        <Space direction="vertical" className="cancel-openings-form" size={14}>
          <Radio.Group
            value={cancelMode}
            onChange={(event) => setCancelMode(event.target.value as CancelMode)}
          >
            <Space direction="vertical">
              <Radio value="selectedDates">撤销当前已选日期</Radio>
              <Radio value="dateRange">撤销一个日期范围</Radio>
              <Radio value="stopPlan" disabled={activePublishPlans.length === 0}>
                停止持续开放计划
              </Radio>
            </Space>
          </Radio.Group>

          {cancelMode === 'selectedDates' ? (
            <Typography.Text type="secondary">
              将撤销当前已选 {publishDateCount} 天内未被预约的空闲时段。
            </Typography.Text>
          ) : null}

          {cancelMode === 'dateRange' ? (
            <Space wrap>
              <Input
                type="date"
                value={cancelRange[0].format('YYYY-MM-DD')}
                onChange={(event) => setCancelRange([dayjs(event.target.value), cancelRange[1]])}
              />
              <Input
                type="date"
                value={cancelRange[1].format('YYYY-MM-DD')}
                onChange={(event) => setCancelRange([cancelRange[0], dayjs(event.target.value)])}
              />
            </Space>
          ) : null}

          {cancelMode === 'stopPlan' ? (
            <Space direction="vertical" className="cancel-openings-form" size={10}>
              <Select
                value={selectedPlanId ?? undefined}
                placeholder="选择持续开放计划"
                options={activePublishPlans.map((plan) => ({
                  label: `#${plan.id} 自 ${plan.startDate} 起 · ${plan.seatIds.length} 座位`,
                  value: plan.id,
                }))}
                onChange={setSelectedPlanId}
              />
              <Input
                type="date"
                value={cancelRange[0].format('YYYY-MM-DD')}
                onChange={(event) => setCancelRange([dayjs(event.target.value), cancelRange[1]])}
              />
              <label className="checkbox-line">
                <input
                  checked={cancelGeneratedSlots}
                  type="checkbox"
                  onChange={(event) => setCancelGeneratedSlots(event.target.checked)}
                />
                同时撤销停止日期之后已经生成的空闲时段
              </label>
            </Space>
          ) : null}

          {cancelMode !== 'stopPlan' ? (
            <label className="checkbox-line">
              <input
                checked={cancelBlockAutoPublish}
                type="checkbox"
                onChange={(event) => setCancelBlockAutoPublish(event.target.checked)}
              />
              阻止持续开放计划在这些日期重新生成开放时段
            </label>
          ) : null}

          <Typography.Text type="secondary">
            已预约、使用中、锁位或异常占用的时段会被保留，只撤销空闲时段。
          </Typography.Text>
        </Space>
      </Modal>

      <Modal
        title={
          reasonAction?.type === 'release'
            ? '释放占用时段'
            : reasonAction?.type === 'mark-abnormal'
              ? '标记异常占用'
              : '恢复异常时段'
        }
        open={reasonAction !== null}
        okText={
          reasonAction?.type === 'release'
            ? '释放'
            : reasonAction?.type === 'mark-abnormal'
              ? '标记'
              : '恢复'
        }
        cancelText="取消"
        confirmLoading={actionLoadingId !== null}
        onOk={runReasonAction}
        onCancel={() => {
          setReasonAction(null);
          setReason('');
        }}
      >
        <Input.TextArea
          rows={4}
          maxLength={255}
          showCount
          value={reason}
          placeholder="填写原因，例如：设备故障、现场确认空座、清洁维护完成"
          onChange={(event) => setReason(event.target.value)}
        />
      </Modal>
    </div>
  );
}
