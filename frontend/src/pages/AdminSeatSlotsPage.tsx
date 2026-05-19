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
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { CheckSquare, Clock3, Eraser, Plus, Trash2 } from 'lucide-react';
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
  ABNORMAL: '异常占用',
  UNPUBLISHED: '未开放',
};

const statusColor: Record<SeatSlotStatus, string> = {
  AVAILABLE: 'green',
  RESERVED: 'blue',
  USING: 'orange',
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

function toDayjsPeriod(period: [string, string]) {
  return [dayjs(period[0], 'HH:mm'), dayjs(period[1], 'HH:mm')] as [dayjs.Dayjs, dayjs.Dayjs];
}

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
  const watchedSeatIds = Form.useWatch('seatIds', form);
  const watchedTimeRanges = Form.useWatch('timeRanges', form);

  const dateText = useMemo(() => slotDate.format('YYYY-MM-DD'), [slotDate]);
  const selectedSeatIds = useMemo(() => watchedSeatIds ?? [], [watchedSeatIds]);
  const activeSeats = useMemo(
    () => seats.filter(isVisibleSeat).sort(compareSeats),
    [seats],
  );
  const selectedSeatIdSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);
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
    () => (watchedTimeRanges ?? []).filter((range) => range?.[0] && range?.[1]).length,
    [watchedTimeRanges],
  );
  const publishEstimateCount = selectedSeatIds.length * validPeriodCount;
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
      await loadSlots(values.areaId, values.slotDate.format('YYYY-MM-DD'));
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
    form.setFieldValue('timeRanges', template.periods.map(toDayjsPeriod));
  }

  useEffect(() => {
    form.setFieldsValue({
      areaId,
      slotDate,
      seatIds: form.getFieldValue('seatIds') ?? [],
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
              </div>
            </div>

            <div className="slot-publish-section">
              <Space className="slot-section-title" align="center" size={6}>
                <Clock3 size={16} />
                <Typography.Text strong>开放时间</Typography.Text>
                <Typography.Text type="secondary">半小时步进，最多 12 段</Typography.Text>
              </Space>
              <Space className="slot-template-row" wrap>
                {timeTemplates.map((template) => (
                  <Button key={template.label} size="small" onClick={() => applyTimeTemplate(template)}>
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
                          .filter((range: [dayjs.Dayjs, dayjs.Dayjs] | undefined) => range?.[0] && range?.[1])
                          .map((range: [dayjs.Dayjs, dayjs.Dayjs]) => {
                            const startTime = range[0].format('HH:mm');
                            const endTime = range[1].format('HH:mm');
                            if (!range[0].isBefore(range[1])) {
                              throw new Error('结束时间必须晚于开始时间');
                            }
                            return `${startTime}-${endTime}`;
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
                            {...field}
                            rules={[{ required: true, message: '请选择时间段' }]}
                          >
                            <TimePicker.RangePicker format="HH:mm" minuteStep={30} />
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
                        onClick={() => add([dayjs('14:00', 'HH:mm'), dayjs('16:00', 'HH:mm')])}
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
                {selectedSeatIds.length} 个座位 x {validPeriodCount} 个时间段
              </Typography.Text>
            </Space>
            <Space wrap>
              <Button type="primary" loading={publishing} onClick={publishSlots}>
                发布时段
              </Button>
              <Button loading={loading} onClick={() => loadSlots()}>
                查询时段
              </Button>
            </Space>
          </div>
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
