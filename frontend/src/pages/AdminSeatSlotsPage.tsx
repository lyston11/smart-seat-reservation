import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  TimePicker,
  message,
  Table,
  Tag,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { listAreas } from '../api/areas';
import {
  adminReleaseSeatSlot,
  cancelSeatSlot,
  listSeatSlots,
  publishSeatSlots,
} from '../api/seatSlots';
import { listSeats } from '../api/seats';
import type { Area, Seat, SeatSlot, SeatSlotStatus } from '../types/seat';

type PublishFormValues = {
  areaId: number;
  slotDate: dayjs.Dayjs;
  timeRange: [dayjs.Dayjs, dayjs.Dayjs];
  seatIds: number[];
};

const statusText: Record<SeatSlotStatus, string> = {
  AVAILABLE: '空闲',
  RESERVED: '已预约',
  USING: '使用中',
  ABNORMAL: '异常占用',
};

const statusColor: Record<SeatSlotStatus, string> = {
  AVAILABLE: 'green',
  RESERVED: 'blue',
  USING: 'orange',
  ABNORMAL: 'red',
};

export default function AdminSeatSlotsPage() {
  const [form] = Form.useForm<PublishFormValues>();
  const [areas, setAreas] = useState<Area[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [slots, setSlots] = useState<SeatSlot[]>([]);
  const [areaId, setAreaId] = useState(1);
  const [adminUserId, setAdminUserId] = useState(2);
  const [slotDate, setSlotDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const dateText = useMemo(() => slotDate.format('YYYY-MM-DD'), [slotDate]);
  const activeSeats = useMemo(() => seats.filter((seat) => seat.status === 'ACTIVE'), [seats]);

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

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      setSlots(await listSeatSlots(areaId, dateText));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载开放时段失败');
    } finally {
      setLoading(false);
    }
  }, [areaId, dateText, messageApi]);

  async function publishSlots() {
    const values = await form.validateFields();
    setPublishing(true);
    try {
      const result = await publishSeatSlots({
        areaId: values.areaId,
        slotDate: values.slotDate.format('YYYY-MM-DD'),
        startTime: values.timeRange[0].format('HH:mm:ss'),
        endTime: values.timeRange[1].format('HH:mm:ss'),
        seatIds: values.seatIds,
      });
      messageApi.success(`已发布 ${result.createdCount} 个时段，跳过 ${result.skippedCount} 个重复时段`);
      setAreaId(values.areaId);
      setSlotDate(values.slotDate);
      await loadSlots();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '发布失败');
    } finally {
      setPublishing(false);
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

  async function releaseSlot(slotId: number) {
    setReleasingId(slotId);
    try {
      await adminReleaseSeatSlot(slotId, adminUserId);
      messageApi.success('座位时段已释放');
      await loadSlots();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '释放失败');
    } finally {
      setReleasingId(null);
    }
  }

  useEffect(() => {
    form.setFieldsValue({
      areaId,
      slotDate,
      timeRange: [dayjs('08:00:00', 'HH:mm:ss'), dayjs('10:00:00', 'HH:mm:ss')],
    });
  }, [areaId, form, slotDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAreas();
      void loadSeats();
      void loadSlots();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAreas, loadSeats, loadSlots]);

  const columns: TableColumnsType<SeatSlot> = [
    { title: '时段 ID', dataIndex: 'id', width: 120 },
    { title: '座位 ID', dataIndex: 'seatId', width: 120 },
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
      render: (_, record) => {
        const canCancel = record.status === 'AVAILABLE';
        const canRelease = record.status === 'RESERVED' || record.status === 'USING' || record.status === 'ABNORMAL';

        return (
          <Space>
            {canCancel ? (
              <Popconfirm
                title="撤销开放时段"
                description="只能撤销尚未被预约的空闲时段。"
                okText="撤销"
                cancelText="取消"
                onConfirm={() => cancelSlot(record.id)}
              >
                <Button size="small" danger loading={cancellingId === record.id}>
                  撤销
                </Button>
              </Popconfirm>
            ) : null}
            {canRelease ? (
              <Popconfirm
                title="释放占用时段"
                description="释放后该座位时段会回到空闲状态，关联预约会标记为管理员释放。"
                okText="释放"
                cancelText="取消"
                onConfirm={() => releaseSlot(record.id)}
              >
                <Button size="small" danger loading={releasingId === record.id}>
                  释放
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <Form form={form} layout="inline">
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
              }}
            />
          </Form.Item>
          <Form.Item
            label="日期"
            name="slotDate"
            rules={[{ required: true, message: '请选择开放日期' }]}
          >
            <DatePicker onChange={(value) => setSlotDate(value ?? dayjs())} />
          </Form.Item>
          <Form.Item
            label="时间"
            name="timeRange"
            rules={[{ required: true, message: '请选择开放时间段' }]}
          >
            <TimePicker.RangePicker format="HH:mm" minuteStep={30} />
          </Form.Item>
          <Form.Item
            label="座位"
            name="seatIds"
            rules={[{ required: true, message: '请选择要发布的座位' }]}
          >
            <Select
              className="seat-select"
              mode="multiple"
              maxTagCount="responsive"
              options={activeSeats.map((seat) => ({ label: seat.seatNo, value: seat.id }))}
              placeholder="选择座位"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={publishing} onClick={publishSlots}>
              发布时段
            </Button>
          </Form.Item>
          <Form.Item>
            <Button loading={loading} onClick={loadSlots}>
              查询时段
            </Button>
          </Form.Item>
          <Form.Item label="管理员">
            <InputNumber
              min={1}
              value={adminUserId}
              onChange={(value) => setAdminUserId(value ?? 2)}
            />
          </Form.Item>
        </Form>
      </div>

      <Table rowKey="id" loading={loading} dataSource={slots} columns={columns} pagination={false} />
    </div>
  );
}
