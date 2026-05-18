import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, message, Select, Space, Statistic, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { listAreas } from '../api/areas';
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  createReservation,
  getReservationRules,
  listUserReservations,
  listSeatSlots,
} from '../api/seatSlots';
import SeatMap from '../components/SeatMap';
import type { ReservationResult, ReservationRule } from '../types/reservation';
import type { Area, SeatSlot } from '../types/seat';
import {
  formatDateTime,
  formatReservationLocation,
  formatReservationTime,
  reservationStatusColor,
  reservationStatusText,
} from '../utils/reservationDisplay';

export default function SeatSlotsPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState(1);
  const [areaTimeInitialized, setAreaTimeInitialized] = useState(false);
  const [date, setDate] = useState(dayjs());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [slots, setSlots] = useState<SeatSlot[]>([]);
  const [activeReservation, setActiveReservation] = useState<ReservationResult | null>(null);
  const [reservationRules, setReservationRules] = useState<ReservationRule | null>(null);
  const [checkinCode, setCheckinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [reservationAction, setReservationAction] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const dateText = useMemo(() => date.format('YYYY-MM-DD'), [date]);
  const activeAreas = useMemo(() => areas.filter((area) => area.status === 'ACTIVE'), [areas]);
  const selectedArea = useMemo(() => areas.find((area) => area.id === areaId), [areas, areaId]);
  const startTimeText = useMemo(() => normalizeInputTime(startTime), [startTime]);
  const endTimeText = useMemo(() => normalizeInputTime(endTime), [endTime]);
  const visibleSlots = useMemo(
    () => buildVisibleSlotsForSelectedTime(slots, startTimeText, endTimeText),
    [endTimeText, slots, startTimeText],
  );
  const availableSeatCount = useMemo(
    () => visibleSlots.filter((slot) => slot.status === 'AVAILABLE').length,
    [visibleSlots],
  );
  const occupiedSeatCount = useMemo(
    () => visibleSlots.filter((slot) => slot.status !== 'AVAILABLE').length,
    [visibleSlots],
  );

  function restoreActiveReservation(reservations: ReservationResult[]) {
    const active = reservations.find((reservation) =>
      reservation.status === 'RESERVED' || reservation.status === 'CHECKED_IN'
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
      setSlots(await listSeatSlots(areaId, dateText));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载座位失败');
    } finally {
      setLoading(false);
    }
  }, [areaId, dateText, messageApi]);

  const loadRules = useCallback(async () => {
    try {
      setReservationRules(await getReservationRules());
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
      messageApi.success('预约成功');
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

      if (reservation.status === 'RESERVED' || reservation.status === 'CHECKED_IN') {
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

  function applySelectedArea(area: Area) {
    setAreaId(area.id);
    setStartTime(area.openTime.slice(0, 5));
    setEndTime(area.closeTime.slice(0, 5));
  }

  return (
    <div className="page">
      {contextHolder}
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
            <DatePicker value={date} onChange={(value) => setDate(value ?? dayjs())} />
          </Form.Item>
          <Form.Item label="开始时间">
            <Input
              type="time"
              aria-label="开始时间"
              value={startTime}
              step={900}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </Form.Item>
          <Form.Item label="结束时间">
            <Input
              type="time"
              aria-label="结束时间"
              value={endTime}
              step={900}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={loadSlots} loading={loading}>
              查询
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
          <Statistic title="当前日期" value={dateText} />
        </Card>
      </div>

      <div className="reservation-panel">
        <div className="reservation-current">
          <Typography.Text strong>当前预约</Typography.Text>
          {activeReservation ? (
            <>
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
            </>
          ) : (
            <Typography.Text type="secondary">暂无活跃预约，选择空闲座位后会显示签到信息。</Typography.Text>
          )}
        </div>
        <div className="reservation-fields">
          <div className="reservation-code-field reservation-code">
            <span>签到码</span>
            <Input
              value={checkinCode}
              placeholder="预约成功后自动填入"
              onChange={(event) => setCheckinCode(event.target.value)}
            />
          </div>
        </div>
        <Space>
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
      </div>

      <div className="reservation-rules">
        <span>同一时间仅允许保留一个活跃预约</span>
        <span>
          当前选择 {startTime}-{endTime}
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
        <span>最多可提前 {reservationRules?.maxAdvanceDays ?? '-'} 天预约</span>
        <span>预约后 {reservationRules?.checkinGraceMinutes ?? '-'} 分钟内未签到将自动释放</span>
      </div>

      <SeatMap slots={visibleSlots} loading={loading} loadingSlotId={reservingId} onReserve={reserve} />
    </div>
  );
}

function normalizeInputTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
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

function buildVisibleSlotsForSelectedTime(slots: SeatSlot[], startTime: string, endTime: string) {
  const bySeat = new Map<number, SeatSlot[]>();
  slots.forEach((slot) => {
    bySeat.set(slot.seatId, [...(bySeat.get(slot.seatId) ?? []), slot]);
  });

  return Array.from(bySeat.values())
    .map((seatSlots) => {
      const busySlot = getBusySlot(seatSlots, startTime, endTime);
      if (busySlot) {
        return { ...busySlot, startTime, endTime };
      }
      const availableWindow = getAvailableWindow(seatSlots, startTime, endTime);
      if (availableWindow) {
        return { ...availableWindow, startTime, endTime };
      }
      return null;
    })
    .filter((slot): slot is SeatSlot => slot !== null);
}
