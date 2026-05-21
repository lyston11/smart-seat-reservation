import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Input, message, Segmented, Select, Space, Statistic, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { listAreas } from '../api/areas';
import { listSeats } from '../api/seats';
import { listSeatSlots } from '../api/seatSlots';
import { getReservationRules } from '../api/reservationRules';
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  createReservation,
  listUserReservations,
} from '../api/reservations';
import CampusIndoorMap from '../components/CampusIndoorMap';
import SeatMap from '../components/SeatMap';
import type { ReservationResult } from '../types/reservation';
import type { Area, Seat, SeatSlot } from '../types/seat';
import {
  formatDateTime,
  formatReservationLocation,
  formatReservationTime,
  reservationStatusColor,
  reservationStatusText,
} from '../utils/reservationDisplay';
import {
  DEFAULT_RESERVATION_RULES,
  normalizeReservationRules,
  type NormalizedReservationRule,
} from '../utils/reservationRules';

type TimeOption = {
  label: string;
  value: string;
};

type TimeOptions = {
  startOptions: TimeOption[];
  endOptions: TimeOption[];
};

export default function SeatSlotsPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState(1);
  const [areaTimeInitialized, setAreaTimeInitialized] = useState(false);
  const [timeInitializedFromSlots, setTimeInitializedFromSlots] = useState(false);
  const [now, setNow] = useState(() => dayjs());
  const [slotDate, setSlotDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [slots, setSlots] = useState<SeatSlot[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [activeReservation, setActiveReservation] = useState<ReservationResult | null>(null);
  const [reservationRules, setReservationRules] = useState<NormalizedReservationRule | null>(null);
  const [checkinCode, setCheckinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [reservationAction, setReservationAction] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const todayText = useMemo(() => now.format('YYYY-MM-DD'), [now]);
  const tomorrowText = useMemo(() => now.add(1, 'day').format('YYYY-MM-DD'), [now]);
  const reservationOpenHour = reservationRules?.reservationOpenHour ?? DEFAULT_RESERVATION_RULES.reservationOpenHour;
  const tomorrowReservationOpened = now.hour() >= reservationOpenHour;
  const dateText = useMemo(
    () => normalizeStudentSlotDate(slotDate, todayText, tomorrowText, tomorrowReservationOpened),
    [slotDate, todayText, tomorrowReservationOpened, tomorrowText],
  );
  const dateOptions = useMemo(
    () => [
      { label: '今天', value: todayText },
      {
        label: '明天',
        value: tomorrowText,
        disabled: !tomorrowReservationOpened,
      },
    ],
    [todayText, tomorrowReservationOpened, tomorrowText],
  );
  const activeAreas = useMemo(() => areas.filter((area) => area.status === 'ACTIVE'), [areas]);
  const selectedArea = useMemo(() => areas.find((area) => area.id === areaId), [areas, areaId]);
  const earliestStartTime = useMemo(
    () => getEarliestStartTimeForDate(dateText, now, selectedArea?.openTime),
    [dateText, now, selectedArea?.openTime],
  );
  const effectiveStartTime = useMemo(() => {
    const closeBoundary = toMinutes(toHalfHourFloor(selectedArea?.closeTime?.slice(0, 5) ?? '22:00'));
    const earliestStartMinutes = toMinutes(earliestStartTime.slice(0, 5));
    if (Math.max(toMinutes(startTime), earliestStartMinutes) >= closeBoundary) {
      return earliestStartTime.slice(0, 5);
    }
    return startTime;
  }, [earliestStartTime, selectedArea?.closeTime, startTime]);
  const timeOptions = useMemo(
    () =>
      buildHalfHourTimeOptions(
        selectedArea?.openTime,
        selectedArea?.closeTime,
        effectiveStartTime,
        earliestStartTime,
      ),
    [earliestStartTime, effectiveStartTime, selectedArea?.closeTime, selectedArea?.openTime],
  );
  const validStartTime = useMemo(
    () => pickValidTime(startTime, timeOptions.startOptions),
    [startTime, timeOptions.startOptions],
  );
  const validEndTime = useMemo(
    () => pickValidTime(endTime, timeOptions.endOptions),
    [endTime, timeOptions.endOptions],
  );
  const startTimeText = useMemo(() => normalizeInputTime(validStartTime), [validStartTime]);
  const endTimeText = useMemo(() => normalizeInputTime(validEndTime), [validEndTime]);
  const canReserveSelectedDate = useMemo(
    () => isStudentReservationDateOpen(dateText, now, reservationOpenHour),
    [dateText, now, reservationOpenHour],
  );
  const selectedTimeStarted = useMemo(
    () => !isFutureSlotStart(dateText, startTimeText, now),
    [dateText, now, startTimeText],
  );
  const canReserveSelectedTime = canReserveSelectedDate && !selectedTimeStarted;
  const reservationBlockedReason = useMemo(
    () => getReservationBlockedReason(dateText, startTimeText, now, reservationOpenHour),
    [dateText, now, reservationOpenHour, startTimeText],
  );
  const visibleSlots = useMemo(
    () => buildVisibleSlotsForSelectedTime(slots, seats, areaId, dateText, startTimeText, endTimeText),
    [areaId, dateText, endTimeText, seats, slots, startTimeText],
  );
  const availableSeatCount = useMemo(
    () => (canReserveSelectedTime ? visibleSlots.filter((slot) => slot.status === 'AVAILABLE').length : 0),
    [canReserveSelectedTime, visibleSlots],
  );
  const occupiedSeatCount = useMemo(
    () => visibleSlots.filter((slot) => slot.status !== 'AVAILABLE' && slot.status !== 'UNPUBLISHED').length,
    [visibleSlots],
  );
  const selectedSlot = useMemo(
    () => visibleSlots.find((slot) => slot.seatId === selectedSeatId) ?? null,
    [selectedSeatId, visibleSlots],
  );

  function restoreActiveReservation(reservations: ReservationResult[]) {
    const active = reservations.find((reservation) =>
      reservation.status === 'RESERVED' || reservation.status === 'CHECKED_IN' || reservation.status === 'LOCKED'
    );
    setActiveReservation(active ?? null);
    setCheckinCode(active?.checkinCode ?? '');
  }

  const loadAreas = useCallback(async () => {
    try {
      const nextAreas = await listAreas();
      setAreas(nextAreas);
      const nextActiveAreas = nextAreas.filter((area) => area.status === 'ACTIVE');
      if (nextActiveAreas.length > 0) {
        const currentArea = nextActiveAreas.find((area) => area.id === areaId);
        if (!currentArea) {
          applySelectedArea(nextActiveAreas[0]);
        } else if (!areaTimeInitialized) {
          applySelectedArea(currentArea);
          setAreaTimeInitialized(true);
        }
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载区域失败');
    }
  }, [areaId, areaTimeInitialized, messageApi]);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSlots, nextSeats] = await Promise.all([listSeatSlots(areaId, dateText), listSeats(areaId)]);
      setSlots(nextSlots);
      setSeats(nextSeats);
      setSelectedSeatId((currentSeatId) => {
        if (currentSeatId && nextSeats.some((seat) => seat.id === currentSeatId && seat.status === 'ACTIVE')) {
          return currentSeatId;
        }
        return null;
      });
      if (!timeInitializedFromSlots) {
        const firstSlot =
          nextSlots.find((slot) => slot.status === 'AVAILABLE' && isFutureSlotStart(slot.slotDate, slot.startTime, now))
          ?? nextSlots.find((slot) => slot.status === 'AVAILABLE')
          ?? nextSlots[0];
        if (firstSlot) {
          setStartTime(toHalfHourCeil(firstSlot.startTime.slice(0, 5)));
          setEndTime(toHalfHourFloor(firstSlot.endTime.slice(0, 5)));
          setTimeInitializedFromSlots(true);
        }
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载座位失败');
    } finally {
      setLoading(false);
    }
  }, [areaId, dateText, messageApi, now, timeInitializedFromSlots]);

  const loadRules = useCallback(async () => {
    try {
      setReservationRules(normalizeReservationRules(await getReservationRules()));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载预约规则失败');
    }
  }, [messageApi]);

  const loadActiveReservation = useCallback(async () => {
    try {
      restoreActiveReservation(await listUserReservations(10));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载当前预约失败');
    }
  }, [messageApi]);

  async function reserve(slot: SeatSlot) {
    if (startTimeText >= endTimeText) {
      messageApi.warning('开始时间必须早于结束时间');
      return;
    }
    if (!isHalfHourTime(validStartTime) || !isHalfHourTime(validEndTime)) {
      messageApi.warning('预约时间只能按半小时选择');
      return;
    }
    if (reservationBlockedReason) {
      messageApi.warning(reservationBlockedReason);
      return;
    }
    if (slot.status !== 'AVAILABLE') {
      messageApi.warning(slot.status === 'UNPUBLISHED' ? '该座位当前时间未开放' : '该座位当前时间不可预约');
      return;
    }

    setReservingId(slot.id);
    try {
      const reservation = await createReservation({
        seatId: slot.seatId,
        slotDate: dateText,
        startTime: startTimeText,
        endTime: endTimeText,
      });
      setActiveReservation(reservation);
      setCheckinCode(reservation.checkinCode);
      const lockQuota = reservation.seatLockQuota ?? 0;
      messageApi.success(lockQuota > 0 ? `预约成功，本次连续预约可锁位 ${lockQuota} 次` : '预约成功');
      await loadSlots();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '预约失败');
    } finally {
      setReservingId(null);
    }
  }

  async function runReservationAction(action: 'check-in' | 'check-out' | 'cancel') {
    if (!activeReservation) {
      messageApi.warning('请先完成预约');
      return;
    }

    setReservationAction(action);
    try {
      const reservation =
        action === 'check-in'
          ? await checkInReservation(activeReservation.reservationId, { checkinCode })
          : action === 'check-out'
            ? await checkOutReservation(activeReservation.reservationId)
            : await cancelReservation(activeReservation.reservationId);

      if (reservation.status === 'RESERVED' || reservation.status === 'CHECKED_IN' || reservation.status === 'LOCKED') {
        setActiveReservation(reservation);
        setCheckinCode(reservation.checkinCode);
      } else {
        setActiveReservation(null);
        setCheckinCode('');
      }
      messageApi.success('操作成功');
      await loadSlots();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setReservationAction(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAreas();
      void loadSlots();
      void loadRules();
      void loadActiveReservation();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadActiveReservation, loadAreas, loadSlots, loadRules]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(dayjs()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function applySelectedArea(area: Area) {
    setAreaId(area.id);
    setStartTime(toHalfHourCeil(area.openTime.slice(0, 5)));
    setEndTime(toHalfHourFloor(area.closeTime.slice(0, 5)));
    setSelectedSeatId(null);
    setTimeInitializedFromSlots(false);
  }

  function changeSlotDate(nextDate: string) {
    setSlotDate(nextDate);
    setSelectedSeatId(null);
    setTimeInitializedFromSlots(false);
  }

  return (
    <div className="page">
      {contextHolder}
      <CampusIndoorMap areas={activeAreas} selectedAreaId={areaId} onSelectArea={applySelectedArea} />

      <div className="toolbar">
        <Form layout="inline">
          <Form.Item label="区域">
            <Select
              className="area-select"
              value={areaId}
              options={activeAreas.map((area) => ({
                label: `${area.name}${area.floor ? ` · ${area.floor}` : ''}`,
                value: area.id,
              }))}
              onChange={(nextAreaId) => {
                const nextArea = areas.find((area) => area.id === nextAreaId);
                if (nextArea) {
                  applySelectedArea(nextArea);
                } else {
                  setAreaId(nextAreaId);
                }
              }}
            />
          </Form.Item>
          <Form.Item label="日期">
            <Segmented<string> value={dateText} options={dateOptions} onChange={changeSlotDate} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={loadSlots} loading={loading}>
              刷新座位
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div className="student-summary-grid">
        <Card>
          <Statistic title="可预约座位" value={availableSeatCount} suffix="个" />
        </Card>
        <Card>
          <Statistic title="已占用/异常" value={occupiedSeatCount} suffix="个" />
        </Card>
        <Card>
          <Statistic title="预约日期" value={dateText} />
        </Card>
      </div>

      <div className="reservation-rules">
        <span>同一时间仅允许保留一个活跃预约</span>
        <span>
          当前选择 {validStartTime}-{validEndTime}
        </span>
        {selectedArea ? (
          <span>
            开放 {selectedArea.openTime.slice(0, 5)}-{selectedArea.closeTime.slice(0, 5)}
          </span>
        ) : null}
        <span>
          每日最多保留 {reservationRules?.dailyActiveReservationLimit ?? '-'} 个活跃预约
        </span>
        <span>已开始或过期时段不可预约</span>
        <span>
          每日 {String(reservationOpenHour).padStart(2, '0')}:00 开放明日预约
        </span>
        <span>时间最小粒度为半小时</span>
        <span>预约后 {reservationRules?.checkinGraceMinutes ?? '-'} 分钟内未签到将自动释放</span>
        <span>
          连续跨上午/下午可锁位 1 次，跨上午/下午/晚上可锁位 2 次
        </span>
        <span>分开预约不累计锁位权益</span>
      </div>

      <div className="student-seat-workspace">
        <SeatMap
          slots={visibleSlots}
          loading={loading}
          loadingSlotId={reservingId}
          sectionTitle="选择座位位置"
          selectedSeatId={selectedSeatId}
          selectableStatuses={canReserveSelectedTime ? ['AVAILABLE', 'UNPUBLISHED'] : ['UNPUBLISHED']}
          emptyDescription="当前区域暂无真实座位，请管理员先维护区域、桌子和座位"
          onReserve={(slot) => setSelectedSeatId(slot.seatId)}
        />

        <aside className="student-seat-side-panel">
          <Card title="已选座位">
            {selectedSlot ? (
              <Space orientation="vertical" size={12} className="student-seat-panel-stack">
                <Space wrap>
                  <Typography.Text strong>
                    {selectedSlot.seatNo ?? `座位 ${selectedSlot.seatId}`}
                    {selectedSlot.seatLabel ? ` (${selectedSlot.seatLabel})` : ''}
                  </Typography.Text>
                  <Tag color={seatStatusColor(selectedSlot.status)}>
                    {seatStatusText(selectedSlot.status)}
                  </Tag>
                </Space>
                <Typography.Text type="secondary">
                  {selectedArea?.name ?? '未知区域'}
                  {selectedArea?.floor ? ` · ${selectedArea.floor}` : ''}
                  {selectedSlot.tableNo ? ` · ${selectedSlot.tableNo}` : ''}
                </Typography.Text>
                <div className="student-seat-time-grid">
                  <label>
                    <span>开始时间</span>
                    <Select
                      aria-label="开始时间"
                      value={validStartTime}
                      options={timeOptions.startOptions}
                      onChange={(value) => {
                        setStartTime(value);
                        setSelectedSeatId(null);
                      }}
                    />
                  </label>
                  <label>
                    <span>结束时间</span>
                    <Select
                      aria-label="结束时间"
                      value={validEndTime}
                      options={timeOptions.endOptions}
                      onChange={(value) => {
                        setEndTime(value);
                        setSelectedSeatId(null);
                      }}
                    />
                  </label>
                </div>
                <Button
                  type="primary"
                  block
                  disabled={selectedSlot.status !== 'AVAILABLE' || !canReserveSelectedTime}
                  loading={reservingId === selectedSlot.id}
                  onClick={() => reserve(selectedSlot)}
                >
                  预约该座位
                </Button>
                {reservationBlockedReason ? (
                  <Typography.Text type="secondary">
                    {reservationBlockedReason}
                  </Typography.Text>
                ) : null}
                {selectedSlot.status === 'UNPUBLISHED' ? (
                  <Typography.Text type="secondary">
                    当前时间段未开放，可调整时间或等待管理员开放后预约。
                  </Typography.Text>
                ) : null}
              </Space>
            ) : (
              <Typography.Text type="secondary">请先在座位地图中选择一个位置。</Typography.Text>
            )}
          </Card>

          <Card title="当前预约">
            {activeReservation ? (
              <Space orientation="vertical" size={12} className="student-seat-panel-stack">
                <Space wrap>
                  <Tag color={reservationStatusColor[activeReservation.status] ?? 'default'}>
                    {reservationStatusText[activeReservation.status] ?? activeReservation.status}
                  </Tag>
                  <Typography.Text>#{activeReservation.reservationId}</Typography.Text>
                </Space>
                <Typography.Text>{formatReservationLocation(activeReservation)}</Typography.Text>
                <Typography.Text type="secondary">{formatReservationTime(activeReservation)}</Typography.Text>
                <Typography.Text type="secondary">
                  签到截止 {formatDateTime(activeReservation.expiresAt)}
                </Typography.Text>
                <Typography.Text type="secondary">
                  锁位次数 {activeReservation.seatLockUsedCount ?? 0}/{activeReservation.seatLockQuota ?? 0}
                  {activeReservation.lockedUntilAt ? ` · 锁位至 ${formatDateTime(activeReservation.lockedUntilAt)}` : ''}
                </Typography.Text>
                <div className="reservation-code-field reservation-code">
                  <span>签到码</span>
                  <Input
                    value={checkinCode}
                    placeholder="预约成功后自动填入"
                    onChange={(event) => setCheckinCode(event.target.value)}
                  />
                </div>
                <Space wrap>
                  <Button
                    disabled={!activeReservation}
                    loading={reservationAction === 'check-in'}
                    onClick={() => runReservationAction('check-in')}
                  >
                    签到
                  </Button>
                  <Button
                    disabled={!activeReservation}
                    loading={reservationAction === 'check-out'}
                    onClick={() => runReservationAction('check-out')}
                  >
                    签退
                  </Button>
                  <Button
                    danger
                    disabled={!activeReservation}
                    loading={reservationAction === 'cancel'}
                    onClick={() => runReservationAction('cancel')}
                  >
                    取消
                  </Button>
                </Space>
              </Space>
            ) : (
              <Typography.Text type="secondary">暂无活跃预约。</Typography.Text>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function normalizeInputTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function toTimeText(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function toHalfHourFloor(value: string) {
  const minutes = toMinutes(value);
  return toTimeText(Math.floor(minutes / 30) * 30);
}

function toHalfHourCeil(value: string) {
  const minutes = toMinutes(value);
  return toTimeText(Math.ceil(minutes / 30) * 30);
}

function isHalfHourTime(value: string) {
  const minutes = toMinutes(value);
  return minutes % 30 === 0;
}

function normalizeStudentSlotDate(
  slotDate: string,
  todayText: string,
  tomorrowText: string,
  tomorrowReservationOpened: boolean,
) {
  if (slotDate < todayText || slotDate > tomorrowText) {
    return todayText;
  }
  if (slotDate === tomorrowText && !tomorrowReservationOpened) {
    return todayText;
  }
  return slotDate;
}

function pickValidTime(value: string, options: TimeOption[]) {
  if (options.some((option) => option.value === value)) {
    return value;
  }
  return options[0]?.value ?? value;
}

function getEarliestStartTimeForDate(slotDate: string, now: dayjs.Dayjs, openTime = '08:00:00') {
  if (slotDate !== now.format('YYYY-MM-DD')) {
    return openTime;
  }
  const openMinutes = toMinutes(openTime.slice(0, 5));
  const nextHalfHourMinutes = Math.ceil((now.hour() * 60 + now.minute() + 1) / 30) * 30;
  return toTimeText(Math.max(openMinutes, nextHalfHourMinutes));
}

function isStudentReservationDateOpen(slotDate: string, now: dayjs.Dayjs, reservationOpenHour: number) {
  const today = now.format('YYYY-MM-DD');
  if (slotDate === today) {
    return true;
  }
  if (slotDate === now.add(1, 'day').format('YYYY-MM-DD')) {
    return now.hour() >= reservationOpenHour;
  }
  return false;
}

function isFutureSlotStart(slotDate: string, startTime: string, now: dayjs.Dayjs) {
  const startAt = dayjs(`${slotDate} ${startTime.slice(0, 5)}`, 'YYYY-MM-DD HH:mm');
  return startAt.isAfter(now);
}

function getReservationBlockedReason(
  slotDate: string,
  startTime: string,
  now: dayjs.Dayjs,
  reservationOpenHour: number,
) {
  const today = now.format('YYYY-MM-DD');
  const tomorrow = now.add(1, 'day').format('YYYY-MM-DD');
  if (slotDate < today) {
    return '过去日期不可预约';
  }
  if (slotDate === tomorrow && now.hour() < reservationOpenHour) {
    return `今日 ${String(reservationOpenHour).padStart(2, '0')}:00 后开放预约明天`;
  }
  if (slotDate > tomorrow) {
    return '当前仅支持预约今天未来时段，18:00 后可预约明天';
  }
  if (!isFutureSlotStart(slotDate, startTime, now)) {
    return '已开始或过去的时间段不可预约';
  }
  return null;
}

function buildHalfHourTimeOptions(
  openTime = '08:00:00',
  closeTime = '22:00:00',
  startTime = '08:00',
  minStartTime = openTime,
): TimeOptions {
  const startBoundary = toMinutes(toHalfHourCeil(openTime.slice(0, 5)));
  const endBoundary = toMinutes(toHalfHourFloor(closeTime.slice(0, 5)));
  const minStartBoundary = Math.max(startBoundary, toMinutes(toHalfHourCeil(minStartTime.slice(0, 5))));
  const selectedStart = Math.max(toMinutes(startTime), minStartBoundary);
  const startOptions: TimeOption[] = [];
  const endOptions: TimeOption[] = [];

  for (let minutes = minStartBoundary; minutes < endBoundary; minutes += 30) {
    const value = toTimeText(minutes);
    startOptions.push({ label: value, value });
  }

  for (let minutes = minStartBoundary + 30; minutes <= endBoundary; minutes += 30) {
    if (minutes > selectedStart) {
      const value = toTimeText(minutes);
      endOptions.push({ label: value, value });
    }
  }

  return { startOptions, endOptions };
}

function overlaps(slot: SeatSlot, startTime: string, endTime: string) {
  return slot.startTime < endTime && slot.endTime > startTime;
}

function contains(slot: SeatSlot, startTime: string, endTime: string) {
  return slot.startTime <= startTime && slot.endTime >= endTime;
}

function getBusySlot(slots: SeatSlot[], startTime: string, endTime: string) {
  return slots.find((slot) => slot.status !== 'AVAILABLE' && overlaps(slot, startTime, endTime));
}

function getAvailableWindow(slots: SeatSlot[], startTime: string, endTime: string) {
  return slots.find((slot) => slot.status === 'AVAILABLE' && contains(slot, startTime, endTime));
}

function buildVisibleSlotsForSelectedTime(
  slots: SeatSlot[],
  seats: Seat[],
  areaId: number,
  slotDate: string,
  startTime: string,
  endTime: string,
) {
  const bySeat = new Map<number, SeatSlot[]>();
  slots.forEach((slot) => {
    bySeat.set(slot.seatId, [...(bySeat.get(slot.seatId) ?? []), slot]);
  });

  return seats
    .filter((seat) => seat.status === 'ACTIVE')
    .map((seat) => {
      const seatSlots = bySeat.get(seat.id) ?? [];
      const busySlot = getBusySlot(seatSlots, startTime, endTime);
      if (busySlot) {
        return { ...busySlot, startTime, endTime };
      }
      const availableWindow = getAvailableWindow(seatSlots, startTime, endTime);
      if (availableWindow) {
        return { ...availableWindow, startTime, endTime };
      }
      return buildUnpublishedSlot(seat, areaId, slotDate, startTime, endTime);
    })
    .sort(bySeatMapPosition);
}

function buildUnpublishedSlot(
  seat: Seat,
  areaId: number,
  slotDate: string,
  startTime: string,
  endTime: string,
): SeatSlot {
  return {
    id: -seat.id,
    seatId: seat.id,
    seatNo: seat.seatNo,
    tableId: seat.tableId,
    tableNo: seat.tableNo,
    tableRowNo: seat.tableRowNo,
    tableColumnNo: seat.tableColumnNo,
    tableDisplayOrder: seat.tableDisplayOrder,
    tablePositionX: seat.tablePositionX,
    tablePositionY: seat.tablePositionY,
    tableWidthPx: seat.tableWidthPx,
    tableHeightPx: seat.tableHeightPx,
    tableRotationDeg: seat.tableRotationDeg,
    seatLabel: seat.seatLabel,
    seatSide: seat.seatSide,
    seatOrder: seat.seatOrder,
    rowNo: seat.rowNo,
    columnNo: seat.columnNo,
    displayOrder: seat.displayOrder,
    areaId,
    slotDate,
    startTime,
    endTime,
    status: 'UNPUBLISHED',
    reservedBy: null,
    reservationId: null,
  };
}

function bySeatMapPosition(left: SeatSlot, right: SeatSlot) {
  const tableCompare = (left.tableNo ?? '').localeCompare(right.tableNo ?? '');
  if (tableCompare !== 0) {
    return tableCompare;
  }
  const seatOrderCompare = (left.seatOrder ?? Number.MAX_SAFE_INTEGER) - (right.seatOrder ?? Number.MAX_SAFE_INTEGER);
  if (seatOrderCompare !== 0) {
    return seatOrderCompare;
  }
  return (left.seatNo ?? String(left.seatId)).localeCompare(right.seatNo ?? String(right.seatId));
}

function seatStatusText(status: SeatSlot['status']) {
  const text: Record<SeatSlot['status'], string> = {
    AVAILABLE: '可预约',
    RESERVED: '已预约',
    USING: '使用中',
    LOCKED: '已锁位',
    ABNORMAL: '异常占用',
    UNPUBLISHED: '未开放',
  };
  return text[status];
}

function seatStatusColor(status: SeatSlot['status']) {
  const color: Record<SeatSlot['status'], string> = {
    AVAILABLE: 'green',
    RESERVED: 'blue',
    USING: 'orange',
    LOCKED: 'purple',
    ABNORMAL: 'red',
    UNPUBLISHED: 'default',
  };
  return color[status];
}
