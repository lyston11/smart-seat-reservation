import { useCallback, useEffect, useState } from 'react';
import { Button, DatePicker, Form, InputNumber, message, Select, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { listAuditLogs } from '../api/audit';
import type { AuditLog, AuditLogQuery } from '../types/audit';

const { RangePicker } = DatePicker;

type AuditFilterValues = {
  action?: string;
  actorUserId?: number;
  targetType?: string;
  timeRange?: [Dayjs, Dayjs];
  limit?: number;
};

const actionLabels: Record<string, string> = {
  ADMIN_RELEASE_SEAT_SLOT: '管理员释放',
  ADMIN_MARK_SEAT_SLOT_ABNORMAL: '标记异常',
  ADMIN_RESTORE_SEAT_SLOT: '恢复异常',
  AREA_CREATE: '新增区域',
  AREA_UPDATE: '更新区域',
  AREA_STATUS_UPDATE: '区域状态变更',
  AREA_CHANGE: '区域变更',
  RESERVATION_RULE_UPDATE: '预约规则变更',
};

const actionOptions = [
  { label: '管理员释放', value: 'ADMIN_RELEASE_SEAT_SLOT' },
  { label: '标记异常', value: 'ADMIN_MARK_SEAT_SLOT_ABNORMAL' },
  { label: '恢复异常', value: 'ADMIN_RESTORE_SEAT_SLOT' },
  { label: '区域变更', value: 'AREA_CHANGE' },
  { label: '预约规则变更', value: 'RESERVATION_RULE_UPDATE' },
];

const targetTypeOptions = [
  { label: '座位时段', value: 'SEAT_SLOT' },
  { label: '区域', value: 'AREA' },
  { label: '预约规则', value: 'RESERVATION_RULE' },
];

export default function AdminAuditLogsPage() {
  const [form] = Form.useForm<AuditFilterValues>();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const loadLogs = useCallback(async (query: AuditLogQuery = {}) => {
    setLoading(true);
    try {
      setLogs(await listAuditLogs(query));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载审计日志失败');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadLogs]);

  async function applyFilters() {
    const values = await form.validateFields();
    await loadLogs({
      action: values.action,
      actorUserId: values.actorUserId,
      targetType: values.targetType,
      startAt: values.timeRange?.[0]?.startOf('minute').format('YYYY-MM-DDTHH:mm:ss'),
      endAt: values.timeRange?.[1]?.endOf('minute').format('YYYY-MM-DDTHH:mm:ss'),
      limit: values.limit ?? 50,
    });
  }

  function resetFilters() {
    form.resetFields();
    void loadLogs();
  }

  const columns: TableColumnsType<AuditLog> = [
    { title: '日志 ID', dataIndex: 'id', width: 100 },
    { title: '操作人', dataIndex: 'actorUserId', width: 100 },
    {
      title: '动作',
      dataIndex: 'action',
      width: 180,
      render: (value: string) => <Tag color="blue">{actionLabels[value] ?? value}</Tag>,
    },
    {
      title: '对象',
      width: 160,
      render: (_, record) => `${record.targetType} #${record.targetId}`,
    },
    { title: '原因', dataIndex: 'reason', ellipsis: true, render: (value) => value ?? '-' },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 190,
      render: (value: string) => value.replace('T', ' ').slice(0, 19),
    },
  ];

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <Form form={form} layout="inline" initialValues={{ limit: 50 }}>
          <Form.Item label="动作" name="action">
            <Select allowClear className="audit-filter-select" options={actionOptions} placeholder="全部动作" />
          </Form.Item>
          <Form.Item label="操作人" name="actorUserId">
            <InputNumber min={1} precision={0} placeholder="用户 ID" />
          </Form.Item>
          <Form.Item label="对象" name="targetType">
            <Select allowClear className="audit-filter-select" options={targetTypeOptions} placeholder="全部对象" />
          </Form.Item>
          <Form.Item label="时间" name="timeRange">
            <RangePicker showTime />
          </Form.Item>
          <Form.Item label="条数" name="limit">
            <InputNumber min={1} max={100} precision={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={loading} onClick={applyFilters}>
              筛选
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={resetFilters}>重置</Button>
          </Form.Item>
        </Form>
      </div>
      <Table rowKey="id" loading={loading} dataSource={logs} columns={columns} pagination={false} />
    </div>
  );
}
