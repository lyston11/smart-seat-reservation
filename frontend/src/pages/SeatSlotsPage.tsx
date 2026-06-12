import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Drawer, Form, Input, message, Segmented, Select, Space, Tag, Typography } from 'antd';
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
  canCancelReservation,
  canCheckInReservation,
  canCheckOutReservation,
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
import {
  formatConnectorAreaName,
  getVisibleConnectorAreasForFloor,
  isCampusConnectorArea,
  normalizeAreaFloor,
} from '../utils/campusConnectors';
import { buildStudentTimeOptions, type StudentTimeOption } from '../utils/studentTimeOptions';
import { getSeatDisplayLabelInSlots, getSeatPathText } from '../utils/seatDisplay';
import { getBusinessNow, parseBusinessDateTime } from '../utils/businessTime';

type AreaOccupancy = {
  total: number;
  occupied: number;
};

export default function SeatSlotsPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState(1);
  const [areaTimeInitialized, setAreaTimeInitialized] = useState(false);
  const [timeInitializedFromSlots, setTimeInitializedFromSlots] = useState(false);
  const [now, setNow] = useState(() => getBusinessNow());
  const [slotDate, setSlotDate] = useState(() => getBusinessNow().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [slots, setSlots] = useState<SeatSlot[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [selectedCampusFloor, setSelectedCampusFloor] = useState<string | null>(null);
  const [activeReservation, setActiveReservation] = useState<ReservationResult | null>(null);
  const [reservationRules, setReservationRules] = useState<NormalizedReservationRule | null>(null);
  const [checkinCode, setCheckinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [reservationAction, setReservationAction] = useState<string | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
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
  const reservableAreas = useMemo(() => activeAreas.filter(isCampusConnectorArea), [activeAreas]);
  const selectedArea = useMemo(() => reservableAreas.find((area) => area.id === areaId), [areaId, reservableAreas]);
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
    () => buildStudentTimeOptions(slots, selectedArea, effectiveStartTime, earliestStartTime),
    [earliestStartTime, effectiveStartTime, selectedArea, slots],
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
  const reservationWarningText = useMemo(() => {
    if (reservationBlockedReason) {
      return reservationBlockedReason;
    }
    if (slots.length > 0 && timeOptions.startOptions.length === 0) {
      return '当前已发布时段均已开始或无可预约座位';
    }
    return null;
  }, [reservationBlockedReason, slots.length, timeOptions.startOptions.length]);
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
  const [areaOccupancy, setAreaOccupancy] = useState<Record<number, AreaOccupancy>>({});
  const selectedSlot = useMemo(
    () => visibleSlots.find((slot) => slot.seatId === selectedSeatId) ?? null,
    [selectedSeatId, visibleSlots],
  );
  const selectedAreaFloorText = selectedArea ? getAreaFloorText(selectedArea) : selectedCampusFloor ?? '未选择';
  const selectedAreaOccupancy = selectedArea ? areaOccupancy[selectedArea.id] : undefined;
  const selectedAreaOccupancyRate =
    selectedAreaOccupancy && selectedAreaOccupancy.total > 0
      ? Math.round((selectedAreaOccupancy.occupied / selectedAreaOccupancy.total) * 100)
      : null;
  const selectedAreaDisplayName = selectedArea ? formatConnectorAreaName(selectedArea) : '未选择区域';
  const selectedSeatPathText = selectedSlot ? getSeatPathText(selectedSlot, visibleSlots) : '未选择座位';

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
      const nextReservableAreas = nextAreas.filter((area) => area.status === 'ACTIVE' && isCampusConnectorArea(area));
      if (nextReservableAreas.length > 0) {
        const currentArea = nextReservableAreas.find((area) => area.id === areaId);
        if (!currentArea) {
          applySelectedArea(nextReservableAreas[0]);
        } else if (!areaTimeInitialized) {
          applySelectedArea(currentArea);
          setAreaTimeInitialized(true);
        }
      } else {
        setSlots([]);
        setSeats([]);
        setSelectedSeatId(null);
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载区域失败');
    }
  }, [areaId, areaTimeInitialized, messageApi]);

  const loadSlots = useCallback(async () => {
    if (!selectedArea) {
      setSlots([]);
      setSeats([]);
      setSelectedSeatId(null);
      return;
    }
    setLoading(true);
    try {
      const [nextSlots, nextSeats] = await Promise.all([listSeatSlots(selectedArea.id, dateText), listSeats(selectedArea.id)]);
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
  }, [dateText, messageApi, now, selectedArea, timeInitializedFromSlots]);

  const loadAreaOccupancy = useCallback(async () => {
    if (reservableAreas.length === 0) {
      setAreaOccupancy({});
      return;
    }

    const visibleAreas = selectedCampusFloor
      ? getVisibleConnectorAreasForFloor(reservableAreas, selectedCampusFloor)
      : selectedArea
        ? getVisibleConnectorAreasForFloor(reservableAreas, normalizeAreaFloor(selectedArea))
        : reservableAreas;

    if (visibleAreas.length === 0) {
      setAreaOccupancy({});
      return;
    }

    try {
      const entries = await Promise.all(
        visibleAreas.map(async (area) => {
          const [nextSlots, nextSeats] = await Promise.all([listSeatSlots(area.id, dateText), listSeats(area.id)]);
          const nextVisibleSlots = buildVisibleSlotsForSelectedTime(
            nextSlots,
            nextSeats,
            area.id,
            dateText,
            startTimeText,
            endTimeText,
          );
          return [
            area.id,
            {
              total: nextVisibleSlots.length,
              occupied: nextVisibleSlots.filter((slot) => slot.status !== 'AVAILABLE' && slot.status !== 'UNPUBLISHED').length,
            },
          ] as const;
        }),
      );
      setAreaOccupancy(Object.fromEntries(entries));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载连廊占用率失败');
    }
  }, [dateText, endTimeText, messageApi, reservableAreas, selectedArea, selectedCampusFloor, startTimeText]);

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
      void loadRules();
      void loadActiveReservation();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadActiveReservation, loadAreas, loadRules]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSlots();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSlots]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAreaOccupancy();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAreaOccupancy]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(getBusinessNow()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function applySelectedArea(area: Area) {
    setAreaId(area.id);
    setSelectedCampusFloor(normalizeAreaFloor(area));
    setStartTime(toHalfHourCeil(area.openTime.slice(0, 5)));
    setEndTime(toHalfHourFloor(area.closeTime.slice(0, 5)));
    setSelectedSeatId(null);
    setTimeInitializedFromSlots(false);
  }

  function changeCampusFloor(nextFloor: string, visibleAreas: Area[]) {
    setSelectedCampusFloor(nextFloor);
    const selectedAreaStillVisible =
      selectedArea &&
      normalizeAreaFloor(selectedArea) === nextFloor &&
      visibleAreas.some((area) => area.id === selectedArea.id);
    if (selectedAreaStillVisible) {
      return;
    }
    const nextArea = visibleAreas[0];
    if (nextArea) {
      applySelectedArea(nextArea);
      return;
    }
    setSelectedSeatId(null);
  }

  function changeSlotDate(nextDate: string) {
    setSlotDate(nextDate);
    setSelectedSeatId(null);
    setTimeInitializedFromSlots(false);
  }

  const reservationPanelContent = (
    <>
      <div
        className="student-reservation-floating-summary student-seat-adaptive-frame"
        aria-label="预约确认浮窗"
      >
        <div className="student-reservation-path-header">
          <strong>选择路径</strong>
          <span>从楼层到桌座连续确认</span>
        </div>
        <div className="student-reservation-path-steps">
          <div className="student-reservation-path-step">
            <span>楼层</span>
            <strong>{selectedAreaFloorText}</strong>
          </div>
          <div className="student-reservation-path-step">
            <span>区域</span>
            <strong>{selectedAreaDisplayName}</strong>
          </div>
          <div className="student-reservation-path-step">
            <span>预约时段</span>
            <strong>
              {dateText} {validStartTime}-{validEndTime}
            </strong>
          </div>
          <div className="student-reservation-path-step student-reservation-path-step-active">
            <span>桌座</span>
            <strong>{selectedSeatPathText}</strong>
          </div>
        </div>
        <div className="student-floating-stat-grid">
          <div>
            <span>可预约</span>
            <strong>{availableSeatCount} 个</strong>
          </div>
          <div>
            <span>占用/异常</span>
            <strong>{occupiedSeatCount} 个</strong>
          </div>
        </div>
      </div>
      <Card title="已选座位">
        {selectedSlot ? (
          <Space orientation="vertical" size={12} className="student-seat-panel-stack">
            <Space wrap>
              <Typography.Text strong>
                {getSeatDisplayLabelInSlots(selectedSlot, visibleSlots)}
              </Typography.Text>
              <Tag color={seatStatusColor(selectedSlot.status)}>
                {seatStatusText(selectedSlot.status)}
              </Tag>
            </Space>
            <Typography.Text type="secondary">
              {selectedAreaDisplayName}
              {selectedArea?.floor ? ` · ${selectedArea.floor}` : ''}
              {selectedSlot.tableNo ? ` · ${selectedSlot.tableNo}` : ''}
            </Typography.Text>
            <div className="student-seat-selected-summary">
              <span>预约日期</span>
              <strong>{dateText}</strong>
              <span>预约时段</span>
              <strong>
                {validStartTime}-{validEndTime}
              </strong>
            </div>
            <div className="student-seat-next-step">
              <Typography.Text strong>下一步：确认座位和时间无误后提交预约，成功后到座扫码签到。</Typography.Text>
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

      <Card title="当前预约" className="student-current-reservation-card" aria-label="当前预约">
        {activeReservation ? (
          <Space orientation="vertical" size={10} className="student-seat-panel-stack">
            <div className="student-current-reservation-head">
              <Tag color={reservationStatusColor[activeReservation.status] ?? 'default'}>
                {reservationStatusText[activeReservation.status] ?? activeReservation.status}
              </Tag>
              <Typography.Text type="secondary">#{activeReservation.reservationId}</Typography.Text>
            </div>
            <div className="student-current-reservation-summary">
              <span>预约位置</span>
              <strong>{formatReservationLocation(activeReservation)}</strong>
              <span>预约时段</span>
              <strong>{formatReservationTime(activeReservation)}</strong>
              <span>签到截止</span>
              <strong>{formatDateTime(activeReservation.expiresAt)}</strong>
              <span>锁位次数</span>
              <strong>
                {activeReservation.seatLockUsedCount ?? 0}/{activeReservation.seatLockQuota ?? 0}
                {activeReservation.lockedUntilAt ? ` · 至 ${formatDateTime(activeReservation.lockedUntilAt)}` : ''}
              </strong>
            </div>
            {activeReservation.status === 'RESERVED' ? (
              <Typography.Text type="secondary" className="reservation-qr-checkin-hint">
                扫描桌面/座位二维码完成正式签到；测试入口仍会校验校园网 IP 和签到时间窗。
              </Typography.Text>
            ) : null}
            <div className="student-current-reservation-code">
              <span>签到凭证</span>
              <div className="reservation-code-field reservation-code">
                <span>签到码</span>
                <Input
                  value={checkinCode}
                  placeholder="预约成功后自动填入"
                  disabled={!canCheckInReservation(activeReservation)}
                  onChange={(event) => setCheckinCode(event.target.value)}
                />
              </div>
            </div>
            <Space wrap className="student-current-reservation-actions">
              <Button
                disabled={!canCheckInReservation(activeReservation)}
                loading={reservationAction === 'check-in'}
                onClick={() => runReservationAction('check-in')}
              >
                开发测试签到
              </Button>
              <Button
                disabled={!canCheckOutReservation(activeReservation)}
                loading={reservationAction === 'check-out'}
                onClick={() => runReservationAction('check-out')}
              >
                签退
              </Button>
              <Button
                danger
                disabled={!canCancelReservation(activeReservation)}
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
    </>
  );

  return (
    <>
      <div className="page student-seat-page student-seat-centered-page">
      {contextHolder}
      <section className="student-seat-reservation-control student-seat-adaptive-frame" aria-label="选座导航">
        <div className="student-seat-control-header">
          <div className="student-seat-control-title">
            <span>学生选座</span>
            <strong>公共区域位置</strong>
            <p>选择教学楼连廊公共座位、日期和时段。</p>
          </div>
          <div className="student-seat-control-status" aria-label="当前选择">
            <Tag color="blue">{selectedAreaFloorText}</Tag>
            <span>
              {selectedAreaOccupancyRate === null ? '占用率 暂无数据' : `占用率 ${selectedAreaOccupancyRate}%`}
            </span>
          </div>
        </div>

        <div className="student-seat-control-body">
          <CampusIndoorMap
            areas={reservableAreas}
            selectedAreaId={areaId}
            selectedFloor={selectedCampusFloor ?? selectedAreaFloorText}
            areaOccupancy={areaOccupancy}
            embedded
            onFloorChange={changeCampusFloor}
            onSelectArea={applySelectedArea}
          />

          <div className="student-seat-time-panel" aria-label="日期与时段">
            <div className="student-seat-time-panel-header">
              <strong>预约时间</strong>
              <span>可预约今天，达到开放时间后可预约明天。</span>
            </div>
            <Form layout="vertical" className="student-seat-filter-form student-seat-control-form">
              <Form.Item label="区域">
                <Select
                  className="area-select"
                  value={areaId}
                  options={reservableAreas.map((area) => ({
                    label: `${formatConnectorAreaName(area)}${area.floor ? ` · ${area.floor}` : ''}`,
                    value: area.id,
                  }))}
                  onChange={(nextAreaId) => {
                    const nextArea = reservableAreas.find((area) => area.id === nextAreaId);
                    if (nextArea) {
                      applySelectedArea(nextArea);
                    } else {
                      setAreaId(nextAreaId);
                    }
                  }}
                />
              </Form.Item>
              <Form.Item label="日期">
                <Segmented<string>
                  aria-label="预约日期"
                  className="student-seat-date-segmented"
                  value={dateText}
                  options={dateOptions}
                  onChange={changeSlotDate}
                />
              </Form.Item>
              <Form.Item label="开始时间">
                <Select
                  aria-label="开始时间"
                  className="student-seat-time-select"
                  classNames={{ popup: { root: 'student-seat-time-popup' } }}
                  getPopupContainer={() => document.body}
                  value={validStartTime}
                  options={timeOptions.startOptions}
                  placeholder="暂无可预约开始时间"
                  onChange={(value) => {
                    setStartTime(value);
                  }}
                />
              </Form.Item>
              <Form.Item label="结束时间">
                <Select
                  aria-label="结束时间"
                  className="student-seat-time-select"
                  classNames={{ popup: { root: 'student-seat-time-popup' } }}
                  getPopupContainer={() => document.body}
                  value={validEndTime}
                  options={timeOptions.endOptions}
                  placeholder="暂无可预约结束时间"
                  onChange={(value) => {
                    setEndTime(value);
                  }}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={loadSlots} loading={loading}>
                  刷新座位
                </Button>
              </Form.Item>
            </Form>
            <div className="student-seat-filter-hints student-seat-control-hints">
              <span>
                {dateText} {validStartTime}-{validEndTime}
              </span>
              <span>{availableSeatCount} 个座位可预约</span>
            </div>
          </div>
        </div>
      </section>

      {reservationWarningText ? (
        <div className="reservation-rules student-seat-adaptive-frame" aria-label="预约规则提示" role="alert">
          <span>{reservationWarningText}</span>
        </div>
      ) : null}

      <div className="student-seat-workspace student-seat-adaptive-frame" aria-label="座位预约工作区">
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

        <aside className="student-seat-side-panel student-seat-desktop-side-panel" aria-label="桌面预约侧栏">
          {reservationPanelContent}
        </aside>
      </div>
      </div>
      <div className="student-mobile-reservation-dock" aria-label="移动端预约入口">
        <Button
          type="primary"
          size="large"
          className="student-mobile-reservation-trigger"
          onClick={() => setMobilePanelOpen(true)}
        >
          预约面板 · {selectedSlot ? selectedSeatPathText : '未选座'} · {availableSeatCount} 可预约
        </Button>
      </div>
      <Drawer
        title="预约面板"
        placement="bottom"
        size="78vh"
        open={mobilePanelOpen}
        rootClassName="student-mobile-reservation-drawer"
        classNames={{ body: 'student-mobile-reservation-drawer-body' }}
        onClose={() => setMobilePanelOpen(false)}
      >
        <div className="student-seat-mobile-panel" aria-label="移动端预约面板">
          {reservationPanelContent}
        </div>
      </Drawer>
    </>
  );
}

function getAreaFloorText(area: Area) {
  return area.floorCode?.trim() || area.floor || '未选择';
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

function pickValidTime(value: string, options: StudentTimeOption[]) {
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
  const startAt = parseBusinessDateTime(slotDate, startTime);
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
  const windows = mergeAvailableWindows(slots);
  return windows.find((slot) => contains(slot, startTime, endTime));
}

function mergeAvailableWindows(slots: SeatSlot[]) {
  const sortedSlots = slots
    .filter((slot) => slot.status === 'AVAILABLE')
    .slice()
    .sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime));
  const windows: SeatSlot[] = [];

  sortedSlots.forEach((slot) => {
    const latest = windows[windows.length - 1];
    if (latest && latest.endTime === slot.startTime) {
      latest.endTime = slot.endTime;
      return;
    }
    windows.push({ ...slot });
  });

  return windows;
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
