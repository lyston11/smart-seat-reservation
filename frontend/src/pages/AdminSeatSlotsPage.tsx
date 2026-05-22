import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
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
} from '../api/adminSeatSlots';
import {
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
  timeRanges: TimeRangeValue[];
  seatIds: number[];
};

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
  const publishEstimateCount = selectedSeatIds.length * validPeriodCount;
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

  async function publishSlots() {
    const values = await form.validateFields();
    const timeRanges = values.timeRanges.filter((range) => range?.startTime && range?.endTime);
    const invalidPeriod = timeRanges.find((range) => isPastOrStartedPeriod(values.slotDate, range.startTime, now));
    if (invalidPeriod) {
      messageApi.warning(`${values.slotDate.format('YYYY-MM-DD')} ${invalidPeriod.startTime} 已开始或已过去，不能发布`);
      return;
    }
    setPublishing(true);
    try {
      const result = await publishSeatSlots({
        areaId: values.areaId,
        slotDate: values.slotDate.format('YYYY-MM-DD'),
        periods: timeRanges.map((range) => ({
          startTime: `${range.startTime}:00`,
          endTime: `${range.endTime}:00`,
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

  useEffect(() => {
    const existingRanges = form.getFieldValue('timeRanges');
    form.setFieldsValue({
      areaId,
      slotDate,
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
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAreas, loadSeats, loadSlots]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(dayjs()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
                    }}
                  />
                </Form.Item>
                <Form.Item
                  label="日期"
                  name="slotDate"
                  rules={[{ required: true, message: '请选择开放日期' }]}
                >
                  <DatePicker
                    disabledDate={(current) => Boolean(current && current.isBefore(now, 'day'))}
                    onChange={(value) => setSlotDate(value ?? dayjs())}
                  />
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
                {selectedSeatIds.length} 个座位 x {validPeriodCount} 个时间段
              </Typography.Text>
            </Space>
            <Space wrap>
              <Button type="primary" loading={publishing} disabled={!hasFuturePublishTime} onClick={publishSlots}>
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
