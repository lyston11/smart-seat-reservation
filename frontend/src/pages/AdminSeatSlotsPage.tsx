import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
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
  adminMarkSeatSlotAbnormal,
  adminReleaseSeatSlot,
  adminRestoreSeatSlot,
  cancelSeatSlot,
  listSeatSlots,
  publishSeatSlots,
} from '../api/seatSlots';
import { listSeats } from '../api/seats';
import AdminSeatSlotActions from '../components/AdminSeatSlotActions';
import type { AdminSeatSlotActionType } from '../components/AdminSeatSlotActions';
import type { Area, Seat, SeatSlot, SeatSlotStatus } from '../types/seat';

type PublishFormValues = {
  areaId: number;
  slotDate: dayjs.Dayjs;
  timeRanges: [dayjs.Dayjs, dayjs.Dayjs][];
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
  const [slotDate, setSlotDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [reasonAction, setReasonAction] = useState<{
    type: AdminSeatSlotActionType;
    slotId: number;
  } | null>(null);
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
    const timeRanges = values.timeRanges.filter(Boolean);
    setPublishing(true);
    try {
      const result = await publishSeatSlots({
        areaId: values.areaId,
        slotDate: values.slotDate.format('YYYY-MM-DD'),
        periods: timeRanges.map((range) => ({
          startTime: range[0].format('HH:mm:ss'),
          endTime: range[1].format('HH:mm:ss'),
        })),
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

  useEffect(() => {
    form.setFieldsValue({
      areaId,
      slotDate,
      timeRanges: [
        [dayjs('08:00:00', 'HH:mm:ss'), dayjs('10:00:00', 'HH:mm:ss')],
        [dayjs('10:00:00', 'HH:mm:ss'), dayjs('12:00:00', 'HH:mm:ss')],
      ],
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
            required
          >
            <Form.List
              name="timeRanges"
              rules={[
                {
                  validator: async (_, value) => {
                    if (!value || value.length === 0) {
                      throw new Error('请选择开放时间段');
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <Space className="period-list" align="start" wrap>
                  {fields.map((field) => (
                    <Space key={field.key} align="baseline">
                      <Form.Item
                        {...field}
                        rules={[{ required: true, message: '请选择时间段' }]}
                      >
                        <TimePicker.RangePicker format="HH:mm" minuteStep={30} />
                      </Form.Item>
                      {fields.length > 1 ? (
                        <Button size="small" onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      ) : null}
                    </Space>
                  ))}
                  <Button onClick={() => add([dayjs('14:00', 'HH:mm'), dayjs('16:00', 'HH:mm')])}>
                    添加时间段
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Space>
              )}
            </Form.List>
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
        </Form>
      </div>

      <Table rowKey="id" loading={loading} dataSource={slots} columns={columns} pagination={false} />
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
