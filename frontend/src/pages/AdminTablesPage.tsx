import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  QRCode,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { Edit3, Power, QrCode, RotateCcw, Save } from 'lucide-react';
import { listAreas } from '../api/areas';
import { listSeats } from '../api/seats';
import { createTable, getTableCheckinQr, listTables, updateTable, updateTableStatus } from '../api/tables';
import AdminResourceActions from '../components/AdminResourceActions';
import SeatMap from '../components/SeatMap';
import TableLayoutPreview from '../components/TableLayoutPreview';
import type { Area, Seat, SeatSlot, SeatSlotStatus, StudyTable, StudyTableQr, StudyTableStatus } from '../types/seat';
import { getSeatPathText } from '../utils/seatDisplay';

type TableFormValues = {
  areaId: number;
  tableNo: string;
  name?: string;
  rowNo?: number;
  columnNo?: number;
  displayOrder?: number;
  seatCount?: number;
  positionX?: number;
  positionY?: number;
  widthPx?: number;
  heightPx?: number;
  rotationDeg?: number;
  status: StudyTableStatus;
};

type TablePresetKey = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'CUSTOM';

type TablePreset = {
  label: string;
  widthPx?: number;
  heightPx?: number;
  seatCount?: number;
};

const statusLabels: Record<StudyTableStatus, string> = {
  ACTIVE: '启用',
  INACTIVE: '停用',
};

const statusColors: Record<StudyTableStatus, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
};

const adminSeatStatusText: Partial<Record<SeatSlotStatus, string>> = {
  AVAILABLE: '启用',
  UNPUBLISHED: '停用',
};

const adminSeatStatusColor: Partial<Record<SeatSlotStatus, string>> = {
  AVAILABLE: 'green',
  UNPUBLISHED: 'default',
};

const tablePresets: Record<TablePresetKey, TablePreset> = {
  ONE: { label: '1人桌', widthPx: 120, heightPx: 80, seatCount: 1 },
  TWO: { label: '2人桌', widthPx: 180, heightPx: 84, seatCount: 2 },
  THREE: { label: '3人桌', widthPx: 190, heightPx: 128, seatCount: 3 },
  FOUR: { label: '4人桌', widthPx: 220, heightPx: 96, seatCount: 4 },
  CUSTOM: { label: '自定义' },
};

const tablePresetOptions = (Object.keys(tablePresets) as TablePresetKey[]).map((key) => ({
  label: tablePresets[key].label,
  value: key,
}));

function buildCheckinUrl(checkinPath: string) {
  if (checkinPath.startsWith('http')) {
    return checkinPath;
  }
  return `${window.location.origin}${checkinPath}`;
}

function isManagedTableNo(tableNo?: string | null) {
  return (tableNo ?? '').toUpperCase() !== 'LEGACY';
}

function isManagedTable(table: StudyTable) {
  return isManagedTableNo(table.tableNo);
}

function inferTablePreset(table: StudyTable): TablePresetKey {
  const matchedPreset = (['ONE', 'TWO', 'THREE', 'FOUR'] as TablePresetKey[]).find((key) => {
    const preset = tablePresets[key];
    return table.widthPx === preset.widthPx && table.heightPx === preset.heightPx && table.rotationDeg === 0;
  });
  return matchedPreset ?? 'CUSTOM';
}

function getTablePresetLabel(table: StudyTable, seatCount: number) {
  if (seatCount >= 1 && seatCount <= 4) {
    return `${seatCount}人桌`;
  }
  const preset = tablePresets[inferTablePreset(table)];
  return preset.label;
}

function getDisplaySeatCount(table: StudyTable, seatCount: number) {
  return Math.max(seatCount, tablePresets[inferTablePreset(table)].seatCount ?? 0);
}

function formatPlanePosition(table: StudyTable) {
  const hasPosition = table.positionX !== null && table.positionY !== null;
  const positionText = hasPosition ? `x ${table.positionX} / y ${table.positionY}` : '未放置';
  const sizeText = `${table.widthPx ?? 0} x ${table.heightPx ?? 0}`;
  return { positionText, sizeText };
}

function applyPresetValues(values: TableFormValues, presetKey: TablePresetKey): TableFormValues {
  const preset = tablePresets[presetKey];
  if (!preset.widthPx || !preset.heightPx) {
    return values;
  }
  return {
    ...values,
    widthPx: preset.widthPx,
    heightPx: preset.heightPx,
    rotationDeg: 0,
    seatCount: preset.seatCount ?? values.seatCount,
  };
}

function toAdminSeatMapSlot(seat: Seat): SeatSlot {
  return {
    id: seat.id,
    seatId: seat.id,
    seatNo: seat.seatNo,
    tableId: seat.tableId,
    tableNo: seat.tableNo,
    tableRowNo: seat.tableRowNo,
    tableColumnNo: seat.tableColumnNo,
    tableDisplayOrder: seat.tableDisplayOrder,
    tablePositionX: seat.tablePositionX,
    tablePositionY: seat.tablePositionY,
    tableWidthPx: seat.tableWidthPx,
    tableHeightPx: seat.tableHeightPx,
    tableRotationDeg: seat.tableRotationDeg,
    seatLabel: seat.seatLabel,
    seatSide: seat.seatSide,
    seatOrder: seat.seatOrder,
    rowNo: seat.rowNo,
    columnNo: seat.columnNo,
    displayOrder: seat.displayOrder,
    areaId: seat.areaId,
    slotDate: 'ADMIN',
    startTime: '00:00:00',
    endTime: '23:59:00',
    status: seat.status === 'ACTIVE' ? 'AVAILABLE' : 'UNPUBLISHED',
    reservedBy: null,
    reservationId: null,
  };
}

export default function AdminTablesPage() {
  const [form] = Form.useForm<TableFormValues>();
  const [areaId, setAreaId] = useState(1);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tables, setTables] = useState<StudyTable[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<StudyTable | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [tableQr, setTableQr] = useState<StudyTableQr | null>(null);
  const [layoutPreviewValues, setLayoutPreviewValues] = useState<Partial<TableFormValues> | null>(null);
  const [layoutDrafts, setLayoutDrafts] = useState<Record<number, { positionX: number; positionY: number }>>({});
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [tablePresetKey, setTablePresetKey] = useState<TablePresetKey>('FOUR');
  const [selectedAdminSeatId, setSelectedAdminSeatId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const selectedArea = useMemo(() => areas.find((area) => area.id === areaId), [areaId, areas]);
  const managedTables = useMemo(() => tables.filter(isManagedTable), [tables]);
  const managedTableIds = useMemo(() => new Set(managedTables.map((table) => table.id)), [managedTables]);
  const seatCountsByTable = useMemo(
    () =>
      seats.reduce<Record<number, number>>((counts, seat) => {
        if (seat.status === 'ACTIVE' && seat.tableId) {
          counts[seat.tableId] = (counts[seat.tableId] ?? 0) + 1;
        }
        return counts;
      }, {}),
    [seats],
  );
  const displaySeatCountsByTable = useMemo(
    () =>
      managedTables.reduce<Record<number, number>>((counts, table) => {
        counts[table.id] = getDisplaySeatCount(table, seatCountsByTable[table.id] ?? 0);
        return counts;
      }, {}),
    [managedTables, seatCountsByTable],
  );
  const activeTableCount = useMemo(
    () => managedTables.filter((table) => table.status === 'ACTIVE').length,
    [managedTables],
  );
  const activeSeatCount = useMemo(
    () => seats.filter((seat) => seat.status === 'ACTIVE' && managedTableIds.has(seat.tableId)).length,
    [managedTableIds, seats],
  );
  const adminSeatMapSlots = useMemo(
    () =>
      seats
        .filter((seat) => managedTableIds.has(seat.tableId))
        .map(toAdminSeatMapSlot),
    [managedTableIds, seats],
  );
  const selectedAdminSeatSlot = useMemo(
    () => adminSeatMapSlots.find((slot) => slot.seatId === selectedAdminSeatId) ?? null,
    [adminSeatMapSlots, selectedAdminSeatId],
  );
  const layoutTables = useMemo(
    () =>
      managedTables.map((table) => ({
        ...table,
        positionX: layoutDrafts[table.id]?.positionX ?? table.positionX,
        positionY: layoutDrafts[table.id]?.positionY ?? table.positionY,
      })),
    [layoutDrafts, managedTables],
  );
  const layoutChanged = Object.keys(layoutDrafts).length > 0;
  const checkinUrl = tableQr ? buildCheckinUrl(tableQr.checkinPath) : '';
  const previewTableId = editingTable?.id ?? -1;
  const previewSeatCount =
    layoutPreviewValues?.seatCount ??
    tablePresets[tablePresetKey].seatCount ??
    (editingTable ? seatCountsByTable[editingTable.id] : undefined) ??
    4;
  const previewSeatCounts = { [previewTableId]: previewSeatCount };

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

  const loadTables = useCallback(async (targetAreaId = areaId) => {
    setLoading(true);
    try {
      const [nextTables, nextSeats] = await Promise.all([listTables(targetAreaId), listSeats(targetAreaId)]);
      setTables(nextTables);
      setSeats(nextSeats);
      setLayoutDrafts({});
      setSelectedAdminSeatId(null);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载桌子失败');
    } finally {
      setLoading(false);
    }
  }, [areaId, messageApi]);

  function openCreateModal() {
    setEditingTable(null);
    setTablePresetKey('FOUR');
    form.setFieldsValue({
      areaId,
      tableNo: '',
      name: '',
      rowNo: undefined,
      columnNo: undefined,
      displayOrder: undefined,
      seatCount: tablePresets.FOUR.seatCount,
      positionX: 80,
      positionY: 80,
      widthPx: tablePresets.FOUR.widthPx,
      heightPx: tablePresets.FOUR.heightPx,
      rotationDeg: 0,
      status: 'ACTIVE',
    });
    setLayoutPreviewValues(form.getFieldsValue());
    setModalOpen(true);
  }

  function openEditModal(table: StudyTable) {
    const nextPresetKey = inferTablePreset(table);
    const presetSeatCount = tablePresets[nextPresetKey].seatCount;
    setEditingTable(table);
    setTablePresetKey(nextPresetKey);
    form.setFieldsValue({
      areaId: table.areaId,
      tableNo: table.tableNo,
      name: table.name ?? '',
      rowNo: table.rowNo ?? undefined,
      columnNo: table.columnNo ?? undefined,
      displayOrder: table.displayOrder ?? undefined,
      seatCount: seatCountsByTable[table.id] ?? presetSeatCount ?? 4,
      positionX: table.positionX ?? 80,
      positionY: table.positionY ?? 80,
      widthPx: table.widthPx ?? 260,
      heightPx: table.heightPx ?? 96,
      rotationDeg: table.rotationDeg ?? 0,
      status: table.status,
    });
    setLayoutPreviewValues(form.getFieldsValue());
    setModalOpen(true);
  }

  function selectTablePreset(nextPresetKey: TablePresetKey) {
    setTablePresetKey(nextPresetKey);
    const preset = tablePresets[nextPresetKey];
    if (preset.widthPx && preset.heightPx) {
      const nextValues = {
        ...form.getFieldsValue(),
        widthPx: preset.widthPx,
        heightPx: preset.heightPx,
        rotationDeg: 0,
        seatCount: preset.seatCount,
      };
      form.setFieldsValue(nextValues);
      setLayoutPreviewValues(nextValues);
    } else {
      setLayoutPreviewValues(form.getFieldsValue());
    }
  }

  async function saveTable() {
    await form.validateFields();
    const values = applyPresetValues(form.getFieldsValue(true) as TableFormValues, tablePresetKey);
    setSaving(true);
    try {
      if (editingTable) {
        await updateTable(editingTable.id, values);
        messageApi.success('桌子已更新');
      } else {
        await createTable({
          areaId: values.areaId,
          tableNo: values.tableNo,
          name: values.name,
          rowNo: values.rowNo,
          columnNo: values.columnNo,
          displayOrder: values.displayOrder,
          seatCount: values.seatCount ?? tablePresets[tablePresetKey].seatCount ?? 4,
          positionX: values.positionX,
          positionY: values.positionY,
          widthPx: values.widthPx,
          heightPx: values.heightPx,
          rotationDeg: values.rotationDeg,
        });
        messageApi.success('桌子已新增');
      }
      setAreaId(values.areaId);
      setModalOpen(false);
      await loadTables(values.areaId);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function saveLayoutChanges() {
    const changedTables = managedTables.filter((table) => layoutDrafts[table.id]);
    if (changedTables.length === 0) {
      messageApi.info('当前布局没有变化');
      return;
    }
    setLayoutSaving(true);
    try {
      await Promise.all(
        changedTables.map((table) =>
          updateTable(table.id, {
            areaId: table.areaId,
            tableNo: table.tableNo,
            name: table.name ?? undefined,
            rowNo: table.rowNo ?? undefined,
            columnNo: table.columnNo ?? undefined,
            displayOrder: table.displayOrder ?? undefined,
            seatCount: seatCountsByTable[table.id] ?? tablePresets[inferTablePreset(table)].seatCount ?? 4,
            positionX: layoutDrafts[table.id].positionX,
            positionY: layoutDrafts[table.id].positionY,
            widthPx: table.widthPx,
            heightPx: table.heightPx,
            rotationDeg: table.rotationDeg,
            status: table.status,
          }),
        ),
      );
      messageApi.success(`已保存 ${changedTables.length} 张桌子的布局`);
      await loadTables();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '保存布局失败');
    } finally {
      setLayoutSaving(false);
    }
  }

  function resetLayoutDrafts() {
    setLayoutDrafts({});
  }

  async function changeStatus(table: StudyTable, status: StudyTableStatus) {
    setLoading(true);
    try {
      await updateTableStatus(table.id, status);
      messageApi.success(status === 'ACTIVE' ? '桌子已启用' : '桌子已停用');
      await loadTables();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '状态更新失败');
    } finally {
      setLoading(false);
    }
  }

  async function openQrModal(table: StudyTable) {
    setQrLoading(true);
    setQrModalOpen(true);
    setTableQr(null);
    try {
      setTableQr(await getTableCheckinQr(table.id));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载签到二维码失败');
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  }

  async function copyCheckinUrl() {
    if (!checkinUrl) {
      return;
    }
    try {
      await window.navigator.clipboard.writeText(checkinUrl);
      messageApi.success('签到链接已复制');
    } catch {
      messageApi.warning('浏览器不支持自动复制，请手动复制链接');
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAreas();
      void loadTables();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAreas, loadTables]);

  const columns: TableColumnsType<StudyTable> = [
    { title: '桌子 ID', dataIndex: 'id', width: 90, fixed: 'left' },
    {
      title: '桌位信息',
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{record.tableNo}</Typography.Text>
          <Typography.Text type="secondary">{record.name ?? '未命名桌位'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '平面位置',
      width: 190,
      render: (_, record) => {
        const { positionText, sizeText } = formatPlanePosition(record);
        return (
          <Space direction="vertical" size={2}>
            <Typography.Text>{positionText}</Typography.Text>
            <Typography.Text type="secondary">{sizeText}</Typography.Text>
          </Space>
        );
      },
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
      title: '桌型',
      width: 130,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text>{getTablePresetLabel(record, displaySeatCountsByTable[record.id] ?? 0)}</Typography.Text>
          <Typography.Text type="secondary">{displaySeatCountsByTable[record.id] ?? 0} 个座位</Typography.Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: StudyTableStatus) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: '操作',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <AdminResourceActions
          actions={[
            { key: 'edit', label: '编辑', icon: <Edit3 size={14} />, onClick: () => openEditModal(record) },
            { key: 'qr', label: '签到码', icon: <QrCode size={14} />, onClick: () => openQrModal(record) },
            record.status === 'ACTIVE'
              ? {
                  key: 'disable',
                  label: '停用',
                  icon: <Power size={14} />,
                  danger: true,
                  confirmTitle: '停用桌子',
                  confirmDescription: '停用后该桌子不能承载启用座位，已有活跃预约时后端会拒绝。',
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
    <div className="page admin-seat-layout-page admin-seat-centered-page">
      {contextHolder}
      <div className="toolbar admin-seat-adaptive-frame" aria-label="桌子筛选">
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
                void loadTables(nextAreaId);
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={loading} onClick={() => loadTables()}>
              查询桌子
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={openCreateModal}>新增桌子</Button>
          </Form.Item>
        </Form>
      </div>

      <div className="admin-resource-summary-grid admin-seat-adaptive-frame" aria-label="桌子统计">
        <div className="admin-resource-summary-item">
          <Statistic title="当前区域桌子" value={managedTables.length} suffix="张" />
        </div>
        <div className="admin-resource-summary-item">
          <Statistic title="启用桌子" value={activeTableCount} suffix="张" />
        </div>
        <div className="admin-resource-summary-item">
          <Statistic title="启用座位" value={activeSeatCount} suffix="个" />
        </div>
      </div>

      <div className="admin-seat-table-frame admin-seat-adaptive-frame" aria-label="桌子列表">
        <Table
          className="admin-resource-table admin-tables-table"
          rowKey="id"
          loading={loading}
          dataSource={managedTables}
          columns={columns}
          pagination={false}
          scroll={{ x: 1140 }}
        />
      </div>

      <div className="layout-preview-panel admin-seat-adaptive-frame" aria-label="区域桌位平面图">
        <div className="seat-map-section-header">
          <strong>区域桌位平面图</strong>
          <span>拖动桌子调整位置，点击桌子进入编辑</span>
        </div>
        <div className="table-layout-actions">
          <Button
            icon={<Save size={15} />}
            type="primary"
            disabled={!layoutChanged}
            loading={layoutSaving}
            onClick={saveLayoutChanges}
          >
            保存布局
          </Button>
          <Button icon={<RotateCcw size={15} />} disabled={!layoutChanged || layoutSaving} onClick={resetLayoutDrafts}>
            撤销调整
          </Button>
          <Typography.Text type="secondary">
            {layoutChanged ? `有 ${Object.keys(layoutDrafts).length} 张桌子待保存` : '当前布局已保存'}
          </Typography.Text>
        </div>
        <TableLayoutPreview
          editable
          tables={layoutTables}
          seatCounts={displaySeatCountsByTable}
          onSelectTable={openEditModal}
          selectedTableId={editingTable?.id}
          onMoveTable={(table, position) => {
            setLayoutDrafts((drafts) => ({ ...drafts, [table.id]: position }));
          }}
        />
      </div>

      <div className="layout-preview-panel admin-seat-map-panel admin-seat-adaptive-frame" aria-label="学生视角座位图">
        <div className="seat-map-section-header">
          <div className="seat-map-section-title">
            <strong>学生视角座位图</strong>
            <span>按学生看到的桌号和座位编号定位反馈问题</span>
          </div>
          <Typography.Text type="secondary">
            {selectedArea ? `${selectedArea.name}${selectedArea.floor ? ` · ${selectedArea.floor}` : ''}` : '当前区域'}
          </Typography.Text>
        </div>
        <div className="admin-seat-map-workspace">
          <SeatMap
            emptyDescription="当前区域暂无真实座位，请先维护座位后再对照学生视图"
            sectionTitle="全部桌座"
            slots={adminSeatMapSlots}
            selectableStatuses={['AVAILABLE', 'UNPUBLISHED']}
            selectedSeatId={selectedAdminSeatId}
            statusTextOverrides={adminSeatStatusText}
            onSeatClick={(slot) => setSelectedAdminSeatId(slot.seatId)}
          />
          <div className="admin-seat-map-detail">
            <Typography.Text type="secondary">当前定位</Typography.Text>
            <div className="admin-seat-map-hint">
              <Typography.Text type="secondary">
                当前区域 {adminSeatMapSlots.length} 个座位，点击座位可同步查看系统编号和启停状态。
              </Typography.Text>
            </div>
            {selectedAdminSeatSlot ? (
              <Space orientation="vertical" size={8}>
                <Typography.Text strong>{getSeatPathText(selectedAdminSeatSlot, adminSeatMapSlots)}</Typography.Text>
                <Typography.Text>系统座位号 {selectedAdminSeatSlot.seatNo ?? selectedAdminSeatSlot.seatId}</Typography.Text>
                <Tag color={adminSeatStatusColor[selectedAdminSeatSlot.status] ?? 'default'}>
                  {adminSeatStatusText[selectedAdminSeatSlot.status] ?? selectedAdminSeatSlot.status}
                </Tag>
                <Typography.Text type="secondary">
                  学生反馈桌座时，可按这个桌号和座位编号在平面图中定位。
                </Typography.Text>
              </Space>
            ) : (
              <Typography.Text type="secondary">点击平面图中的座位后显示桌号、座位号和状态。</Typography.Text>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={editingTable ? '编辑桌子' : '新增桌子'}
        open={modalOpen}
        width={760}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onOk={saveTable}
        onCancel={() => setModalOpen(false)}
      >
        <Form
          form={form}
          layout="vertical"
          className="table-form"
          onValuesChange={(_, values) => setLayoutPreviewValues(values)}
        >
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
            />
          </Form.Item>
          <Form.Item
            label="桌号"
            name="tableNo"
            rules={[
              { required: true, message: '请输入桌号' },
              { max: 32, message: '桌号不能超过 32 个字符' },
            ]}
          >
            <Input placeholder="例如 T01" />
          </Form.Item>
          <Form.Item label="名称" name="name" rules={[{ max: 64, message: '名称不能超过 64 个字符' }]}>
            <Input placeholder={selectedArea ? `${selectedArea.name} T01` : '例如 图书馆 A 区 T01'} />
          </Form.Item>
          <Form.Item label="桌型">
            <Segmented
              block
              className="table-preset-segmented"
              options={tablePresetOptions}
              value={tablePresetKey}
              onChange={(value) => selectTablePreset(value as TablePresetKey)}
            />
          </Form.Item>
          <Form.Item
            label="座位数"
            name="seatCount"
            rules={[{ required: true, message: '请输入座位数' }]}
          >
            <InputNumber min={1} max={12} precision={0} disabled={tablePresetKey !== 'CUSTOM'} />
          </Form.Item>
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
          {tablePresetKey === 'CUSTOM' ? (
            <div className="resource-layout-fields">
              <Form.Item label="桌宽 px" name="widthPx">
                <InputNumber min={80} precision={0} placeholder="220" />
              </Form.Item>
              <Form.Item label="桌高 px" name="heightPx">
                <InputNumber min={48} precision={0} placeholder="96" />
              </Form.Item>
              <Form.Item label="旋转角度" name="rotationDeg">
                <InputNumber precision={0} placeholder="0" />
              </Form.Item>
            </div>
          ) : null}
          {editingTable ? (
            <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <Select
                options={[
                  { label: '启用', value: 'ACTIVE' },
                  { label: '停用', value: 'INACTIVE' },
                ]}
              />
            </Form.Item>
          ) : null}
        </Form>
        <div className="table-form-preview">
          <div className="seat-map-section-header">
            <strong>实时预览</strong>
            <span>拖动桌子调整位置，尺寸和角度按当前表单渲染</span>
          </div>
          <TableLayoutPreview
            editable
            seatCounts={previewSeatCounts}
            tables={[
              {
                id: previewTableId,
                areaId: layoutPreviewValues?.areaId ?? areaId,
                tableNo: layoutPreviewValues?.tableNo || editingTable?.tableNo || 'T01',
                name: layoutPreviewValues?.name || editingTable?.name || null,
                status: 'ACTIVE',
                rowNo: layoutPreviewValues?.rowNo ?? editingTable?.rowNo ?? null,
                columnNo: layoutPreviewValues?.columnNo ?? editingTable?.columnNo ?? null,
                displayOrder: layoutPreviewValues?.displayOrder ?? editingTable?.displayOrder ?? null,
                positionX: layoutPreviewValues?.positionX ?? editingTable?.positionX ?? 80,
                positionY: layoutPreviewValues?.positionY ?? editingTable?.positionY ?? 80,
                widthPx: layoutPreviewValues?.widthPx ?? editingTable?.widthPx ?? 260,
                heightPx: layoutPreviewValues?.heightPx ?? editingTable?.heightPx ?? 96,
                rotationDeg: layoutPreviewValues?.rotationDeg ?? editingTable?.rotationDeg ?? 0,
              },
            ]}
            onMoveTable={(_, position) => {
              form.setFieldsValue(position);
              setLayoutPreviewValues({ ...form.getFieldsValue(), ...position });
            }}
          />
        </div>
      </Modal>

      <Modal
        title={tableQr ? `${tableQr.tableNo} 固定签到码` : '固定签到码'}
        open={qrModalOpen}
        footer={[
          <Button key="close" onClick={() => setQrModalOpen(false)}>
            关闭
          </Button>,
          <Button key="copy" type="primary" disabled={!checkinUrl} onClick={copyCheckinUrl}>
            复制链接
          </Button>,
        ]}
        onCancel={() => setQrModalOpen(false)}
      >
        <div className="table-qr-panel">
          {qrLoading ? (
            <Typography.Text type="secondary">正在加载签到码...</Typography.Text>
          ) : tableQr ? (
            <>
              <div className="table-qr-code" aria-label={`${tableQr.tableNo} 固定签到二维码`}>
                <QRCode value={checkinUrl} size={180} />
              </div>
              <Input.TextArea value={checkinUrl} rows={2} readOnly />
              <Typography.Text type="secondary">
                桌码固定贴在桌面，学生扫码后仍需输入预约签到码完成身份匹配。
              </Typography.Text>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
