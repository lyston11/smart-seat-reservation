import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { listAreas } from '../api/areas';
import { createSeat, listSeats, updateSeat, updateSeatStatus } from '../api/seats';
import { listTables } from '../api/tables';
import type { Area, Seat, SeatStatus, StudyTable } from '../types/seat';

type SeatFormValues = {
  areaId: number;
  tableId?: number;
  seatNo: string;
  seatLabel: string;
  seatSide: SeatSide;
  seatOrder: number;
  rowNo?: number;
  columnNo?: number;
  displayOrder?: number;
  status: SeatStatus;
};

type SeatSide = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST' | 'SINGLE';

const statusLabels: Record<SeatStatus, string> = {
  ACTIVE: '启用',
  INACTIVE: '停用',
};

const statusColors: Record<SeatStatus, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
};

const seatSideOptions: Array<{ label: string; value: SeatSide }> = [
  { label: '上侧', value: 'NORTH' },
  { label: '右侧', value: 'EAST' },
  { label: '下侧', value: 'SOUTH' },
  { label: '左侧', value: 'WEST' },
  { label: '单人位', value: 'SINGLE' },
];

export default function AdminSeatsPage() {
  const [form] = Form.useForm<SeatFormValues>();
  const [areaId, setAreaId] = useState(1);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tables, setTables] = useState<StudyTable[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

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

  const loadSeats = useCallback(async (targetAreaId = areaId) => {
    setLoading(true);
    try {
      setSeats(await listSeats(targetAreaId));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载座位失败');
    } finally {
      setLoading(false);
    }
  }, [areaId, messageApi]);

  const loadTablesForArea = useCallback(async (targetAreaId = areaId) => {
    try {
      setTables(await listTables(targetAreaId));
    } catch (error) {
      setTables([]);
      messageApi.error(error instanceof Error ? error.message : '加载桌子失败');
    }
  }, [areaId, messageApi]);

  function openCreateModal() {
    setEditingSeat(null);
    form.setFieldsValue({
      areaId,
      tableId: undefined,
      seatNo: '',
      seatLabel: '',
      seatSide: 'SINGLE',
      seatOrder: 1,
      status: 'ACTIVE',
    });
    setModalOpen(true);
  }

  function openEditModal(seat: Seat) {
    setEditingSeat(seat);
    form.setFieldsValue({
      areaId: seat.areaId,
      tableId: seat.tableId,
      seatNo: seat.seatNo,
      seatLabel: seat.seatLabel ?? '',
      seatSide: (seat.seatSide as SeatSide | null) ?? 'SINGLE',
      seatOrder: seat.seatOrder ?? 1,
      rowNo: seat.rowNo ?? undefined,
      columnNo: seat.columnNo ?? undefined,
      displayOrder: seat.displayOrder ?? undefined,
      status: seat.status as SeatStatus,
    });
    setModalOpen(true);
  }

  async function saveSeat() {
    const values = await form.validateFields();
    if (!values.tableId) {
      messageApi.error('请选择所属桌子');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        areaId: values.areaId,
        tableId: values.tableId,
        seatNo: values.seatNo,
        seatLabel: values.seatLabel,
        seatSide: values.seatSide,
        seatOrder: values.seatOrder,
        rowNo: values.rowNo,
        columnNo: values.columnNo,
        displayOrder: values.displayOrder,
      };
      if (editingSeat) {
        await updateSeat(editingSeat.id, {
          ...payload,
          status: values.status,
        });
        messageApi.success('座位已更新');
      } else {
        await createSeat(payload);
        messageApi.success('座位已新增');
      }
      setAreaId(values.areaId);
      setModalOpen(false);
      await loadTablesForArea(values.areaId);
      await loadSeats(values.areaId);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(seat: Seat, status: SeatStatus) {
    setLoading(true);
    try {
      await updateSeatStatus(seat.id, status);
      messageApi.success(status === 'ACTIVE' ? '座位已启用' : '座位已停用');
      await loadSeats();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '状态更新失败');
    } finally {
      setLoading(false);
    }
  }

  async function changeFormArea(nextAreaId: number) {
    setAreaId(nextAreaId);
    form.setFieldValue('tableId', undefined);
    try {
      setTables(await listTables(nextAreaId));
    } catch (error) {
      setTables([]);
      messageApi.error(error instanceof Error ? error.message : '加载桌子失败');
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAreas();
      void loadTablesForArea();
      void loadSeats();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAreas, loadSeats, loadTablesForArea]);

  const columns: TableColumnsType<Seat> = [
    { title: '座位 ID', dataIndex: 'id', width: 120 },
    { title: '区域 ID', dataIndex: 'areaId', width: 120 },
    { title: '所属桌子', dataIndex: 'tableNo', width: 120, render: (value) => value ?? '-' },
    { title: '座位编号', dataIndex: 'seatNo', width: 180 },
    {
      title: '桌上位置',
      width: 180,
      render: (_, record) => {
        const sideLabel = seatSideOptions.find((option) => option.value === record.seatSide)?.label;
        return record.seatLabel
          ? `${record.seatLabel} / ${sideLabel ?? record.seatSide ?? '-'} / ${record.seatOrder ?? 1}`
          : '-';
      },
    },
    {
      title: '布局位置',
      width: 160,
      render: (_, record) =>
        record.rowNo && record.columnNo ? `第 ${record.rowNo} 排 / 第 ${record.columnNo} 列` : '-',
    },
    { title: '展示顺序', dataIndex: 'displayOrder', width: 120, render: (value) => value ?? '-' },
    {
      title: '资源状态',
      dataIndex: 'status',
      width: 140,
      render: (status: SeatStatus) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          {record.status === 'ACTIVE' ? (
            <Popconfirm
              title="停用座位"
              description="停用后学生端不再展示该座位的开放时段。"
              okText="停用"
              cancelText="取消"
              onConfirm={() => changeStatus(record, 'INACTIVE')}
            >
              <Button size="small" danger>
                停用
              </Button>
            </Popconfirm>
          ) : (
            <Button size="small" type="primary" onClick={() => changeStatus(record, 'ACTIVE')}>
              启用
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page">
      {contextHolder}
      <div className="toolbar">
        <Form layout="inline">
          <Form.Item label="区域">
            <Select
              className="area-select"
              value={areaId}
              options={areas.map((area) => ({
                label: `${area.name}${area.floor ? ` · ${area.floor}` : ''}`,
                value: area.id,
              }))}
              onChange={(nextAreaId) => {
                setAreaId(nextAreaId);
                void loadTablesForArea(nextAreaId);
                void loadSeats(nextAreaId);
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={loading} onClick={() => loadSeats()}>
              查询座位
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={openCreateModal}>新增座位</Button>
          </Form.Item>
        </Form>
      </div>
      <Table rowKey="id" loading={loading} dataSource={seats} columns={columns} pagination={false} />
      <Modal
        title={editingSeat ? '编辑座位' : '新增座位'}
        open={modalOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onOk={saveSeat}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical" className="seat-form">
          <Form.Item
            label="所属区域"
            name="areaId"
            rules={[{ required: true, message: '请选择所属区域' }]}
          >
            <Select
              options={areas.map((area) => ({
                label: `${area.name}${area.floor ? ` · ${area.floor}` : ''}`,
                value: area.id,
              }))}
              onChange={changeFormArea}
            />
          </Form.Item>
          <Form.Item
            label="所属桌子"
            name="tableId"
            rules={[{ required: true, message: '请选择所属桌子' }]}
          >
            <Select
              placeholder="先在桌子管理中创建桌子"
              options={tables.map((table) => ({
                label: `${table.tableNo}${table.name ? ` · ${table.name}` : ''}`,
                value: table.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="座位编号"
            name="seatNo"
            rules={[
              { required: true, message: '请输入座位编号' },
              { max: 32, message: '座位编号不能超过 32 个字符' },
            ]}
          >
            <Input placeholder="例如 A-005" />
          </Form.Item>
          <div className="seat-table-layout-fields">
            <Form.Item
              label="桌上标签"
              name="seatLabel"
              rules={[
                { required: true, message: '请输入桌上标签' },
                { max: 32, message: '桌上标签不能超过 32 个字符' },
              ]}
            >
              <Input placeholder="例如 1、2、靠窗" />
            </Form.Item>
            <Form.Item
              label="桌边方位"
              name="seatSide"
              rules={[{ required: true, message: '请选择桌边方位' }]}
            >
              <Select options={seatSideOptions} />
            </Form.Item>
            <Form.Item
              label="同侧顺序"
              name="seatOrder"
              rules={[{ required: true, message: '请输入同侧顺序' }]}
            >
              <InputNumber min={1} precision={0} placeholder="1" />
            </Form.Item>
          </div>
          <div className="resource-layout-fields">
            <Form.Item label="行号" name="rowNo">
              <InputNumber min={1} precision={0} placeholder="1" />
            </Form.Item>
            <Form.Item label="列号" name="columnNo">
              <InputNumber min={1} precision={0} placeholder="1" />
            </Form.Item>
            <Form.Item label="展示顺序" name="displayOrder">
              <InputNumber min={1} precision={0} placeholder="自动" />
            </Form.Item>
          </div>
          {editingSeat ? (
            <Form.Item
              label="资源状态"
              name="status"
              rules={[{ required: true, message: '请选择资源状态' }]}
            >
              <Select
                options={[
                  { label: '启用', value: 'ACTIVE' },
                  { label: '停用', value: 'INACTIVE' },
                ]}
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}
