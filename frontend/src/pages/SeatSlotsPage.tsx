import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, message, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { listAreas } from '../api/areas';
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  createReservation,
  listSeatSlots,
} from '../api/seatSlots';
import SeatMap from '../components/SeatMap';
import type { ReservationResult } from '../types/reservation';
import type { Area, SeatSlot } from '../types/seat';

export default function SeatSlotsPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState(1);
  const [date, setDate] = useState(dayjs());
  const [slots, setSlots] = useState<SeatSlot[]>([]);
  const [activeReservation, setActiveReservation] = useState<ReservationResult | null>(null);
  const [checkinCode, setCheckinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [reservationAction, setReservationAction] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const dateText = useMemo(() => date.format('YYYY-MM-DD'), [date]);
  const activeAreas = useMemo(() => areas.filter((area) => area.status === 'ACTIVE'), [areas]);

  const loadAreas = useCallback(async () => {
    try {
      const nextAreas = await listAreas();
      setAreas(nextAreas);
      const nextActiveAreas = nextAreas.filter((area) => area.status === 'ACTIVE');
      if (nextActiveAreas.length > 0 && !nextActiveAreas.some((area) => area.id === areaId)) {
        setAreaId(nextActiveAreas[0].id);
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载区域失败');
    }
  }, [areaId, messageApi]);

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

  async function reserve(slotId: number) {
    setReservingId(slotId);
    try {
      const reservation = await createReservation(slotId);
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

      setActiveReservation(reservation);
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
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAreas, loadSlots]);

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
              onChange={setAreaId}
            />
          </Form.Item>
          <Form.Item label="日期">
            <DatePicker value={date} onChange={(value) => setDate(value ?? dayjs())} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={loadSlots} loading={loading}>
              查询
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div className="reservation-panel">
        <div className="reservation-fields">
          <Input
            className="reservation-input"
            addonBefore="预约"
            value={activeReservation?.reservationId ?? ''}
            readOnly
          />
          <Input
            className="reservation-code"
            addonBefore="签到码"
            value={checkinCode}
            onChange={(event) => setCheckinCode(event.target.value)}
          />
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

      <SeatMap slots={slots} loading={loading} loadingSlotId={reservingId} onReserve={reserve} />
    </div>
  );
}
