import { useEffect, useState } from 'react';
import { Button, Form, InputNumber, message, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { listSeats } from '../api/seats';
import type { Seat } from '../types/seat';

export default function AdminSeatsPage() {
  const [areaId, setAreaId] = useState(1);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  async function loadSeats() {
    setLoading(true);
    try {
      setSeats(await listSeats(areaId));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载座位失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSeats();
  }, []);

  const columns: TableColumnsType<Seat> = [
    { title: '座位 ID', dataIndex: 'id', width: 120 },
    { title: '区域 ID', dataIndex: 'areaId', width: 120 },
    { title: '座位编号', dataIndex: 'seatNo', width: 180 },
    {
      title: '资源状态',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>{status}</Tag>,
    },
  ];

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <Form layout="inline">
          <Form.Item label="区域">
            <InputNumber min={1} value={areaId} onChange={(value) => setAreaId(value ?? 1)} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={loading} onClick={loadSeats}>
              查询座位
            </Button>
          </Form.Item>
        </Form>
      </div>
      <Table rowKey="id" loading={loading} dataSource={seats} columns={columns} pagination={false} />
    </div>
  );
}
