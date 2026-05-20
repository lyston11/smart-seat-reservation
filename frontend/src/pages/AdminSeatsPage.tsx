import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, InputNumber, message, Modal, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { Edit3, Power } from 'lucide-react';
import { listAreas } from '../api/areas';
import { createSeat, listSeats, updateSeat, updateSeatStatus } from '../api/seats';
import { listTables } from '../api/tables';
import AdminResourceActions from '../components/AdminResourceActions';
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

function getSeatSideLabel(side?: string | null) {
  return seatSideOptions.find((option) => option.value === side)?.label ?? side ?? '未配置方位';
}

function isManagedSeat(seat: Seat) {
  return (seat.tableNo ?? '').toUpperCase() !== 'LEGACY';
}

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

  const managedSeats = useMemo(() => seats.filter(isManagedSeat), [seats]);
  const tablesById = useMemo(
    () =>
      tables.reduce<Record<number, StudyTable>>((map, table) => {
        map[table.id] = table;
        return map;
      }, {}),
    [tables],
  );
  const activeSeatCount = useMemo(
    () => managedSeats.filter((seat) => seat.status === 'ACTIVE').length,
    [managedSeats],
  );
  const inactiveSeatCount = useMemo(
    () => managedSeats.filter((seat) => seat.status === 'INACTIVE').length,
    [managedSeats],
  );
  const configuredTableCount = useMemo(
    () => new Set(managedSeats.map((seat) => seat.tableId).filter(Boolean)).size,
    [managedSeats],
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
    { title: '座位 ID', dataIndex: 'id', width: 90, fixed: 'left' },
    {
      title: '座位信息',
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{record.seatNo}</Typography.Text>
          <Typography.Text type="secondary">{record.seatLabel ?? '未配置桌上标签'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '所属桌位',
      width: 190,
      render: (_, record) => {
        const table = tablesById[record.tableId];
        const tableRowNo = record.tableRowNo ?? table?.rowNo;
        const tableColumnNo = record.tableColumnNo ?? table?.columnNo;
        const tableNo = record.tableNo ?? table?.tableNo;
        return (
          <Space direction="vertical" size={2}>
            <Typography.Text>{tableNo ?? '未绑定桌子'}</Typography.Text>
            <Typography.Text type="secondary">
              {tableRowNo && tableColumnNo ? `第 ${tableRowNo} 排 / 第 ${tableColumnNo} 列` : '桌位行列未配'}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: '桌上位置',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text>{getSeatSideLabel(record.seatSide)}</Typography.Text>
          <Typography.Text type="secondary">同侧顺序 {record.seatOrder ?? '-'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '网格顺序',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text>
            {record.rowNo && record.columnNo ? `第 ${record.rowNo} 排 / 第 ${record.columnNo} 列` : '未配置行列'}
          </Typography.Text>
          <Typography.Text type="secondary">顺序 {record.displayOrder ?? '-'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: SeatStatus) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <AdminResourceActions
          actions={[
            { key: 'edit', label: '编辑', icon: <Edit3 size={14} />, onClick: () => openEditModal(record) },
            record.status === 'ACTIVE'
              ? {
                  key: 'disable',
                  label: '停用',
                  icon: <Power size={14} />,
                  danger: true,
                  confirmTitle: '停用座位',
                  confirmDescription: '停用后学生端不再展示该座位的开放时段。',
                  confirmOkText: '停用',
                  onClick: () => changeStatus(record, 'INACTIVE'),
                }
              : {
                  key: 'enable',
                  label: '启用',
                  icon: <Power size={14} />,
                  type: 'primary',
                  onClick: () => changeStatus(record, 'ACTIVE'),
                },
          ]}
        />
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

      <div className="admin-resource-summary-grid">
        <div className="admin-resource-summary-item">
          <Statistic title="当前区域座位" value={managedSeats.length} suffix="个" />
        </div>
        <div className="admin-resource-summary-item">
          <Statistic title="启用座位" value={activeSeatCount} suffix="个" />
        </div>
        <div className="admin-resource-summary-item">
          <Statistic title="停用座位" value={inactiveSeatCount} suffix="个" />
        </div>
        <div className="admin-resource-summary-item">
          <Statistic title="已配置桌位" value={configuredTableCount} suffix="张" />
        </div>
      </div>

      <Table
        className="admin-resource-table admin-seats-table"
        rowKey="id"
        loading={loading}
        dataSource={managedSeats}
        columns={columns}
        pagination={false}
        scroll={{ x: 1100 }}
      />
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
