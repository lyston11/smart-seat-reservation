import { useCallback, useEffect, useState } from 'react';
import { Button, message, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { listAuditLogs } from '../api/audit';
import type { AuditLog } from '../types/audit';

const actionLabels: Record<string, string> = {
  ADMIN_RELEASE_SEAT_SLOT: '管理员释放',
  ADMIN_MARK_SEAT_SLOT_ABNORMAL: '标记异常',
  ADMIN_RESTORE_SEAT_SLOT: '恢复异常',
  AREA_CREATE: '新增区域',
  AREA_UPDATE: '更新区域',
  AREA_STATUS_UPDATE: '区域状态变更',
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await listAuditLogs());
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
        <Button type="primary" loading={loading} onClick={loadLogs}>
          刷新日志
        </Button>
      </div>
      <Table rowKey="id" loading={loading} dataSource={logs} columns={columns} pagination={false} />
    </div>
  );
}
