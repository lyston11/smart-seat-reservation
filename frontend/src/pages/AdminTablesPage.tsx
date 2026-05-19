import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  QRCode,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { RotateCcw, Save } from 'lucide-react';
import { listAreas } from '../api/areas';
import { createTable, getTableCheckinQr, listTables, updateTable, updateTableStatus } from '../api/tables';
import TableLayoutPreview from '../components/TableLayoutPreview';
import type { Area, StudyTable, StudyTableQr, StudyTableStatus } from '../types/seat';

type TableFormValues = {
  areaId: number;
  tableNo: string;
  name?: string;
  rowNo?: number;
  columnNo?: number;
  displayOrder?: number;
  positionX?: number;
  positionY?: number;
  widthPx?: number;
  heightPx?: number;
  rotationDeg?: number;
  status: StudyTableStatus;
};

const statusLabels: Record<StudyTableStatus, string> = {
  ACTIVE: '启用',
  INACTIVE: '停用',
};

const statusColors: Record<StudyTableStatus, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
};

function buildCheckinUrl(checkinPath: string) {
  if (checkinPath.startsWith('http')) {
    return checkinPath;
  }
  return `${window.location.origin}${checkinPath}`;
}

function isManagedTable(table: StudyTable) {
  return table.tableNo.toUpperCase() !== 'LEGACY';
}

export default function AdminTablesPage() {
  const [form] = Form.useForm<TableFormValues>();
  const [areaId, setAreaId] = useState(1);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tables, setTables] = useState<StudyTable[]>([]);
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
  const [messageApi, contextHolder] = message.useMessage();

  const selectedArea = useMemo(() => areas.find((area) => area.id === areaId), [areaId, areas]);
  const managedTables = useMemo(() => tables.filter(isManagedTable), [tables]);
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
      setTables(await listTables(targetAreaId));
      setLayoutDrafts({});
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载桌子失败');
    } finally {
      setLoading(false);
    }
  }, [areaId, messageApi]);

  function openCreateModal() {
    setEditingTable(null);
    form.setFieldsValue({
      areaId,
      tableNo: '',
      name: '',
      rowNo: undefined,
      columnNo: undefined,
      displayOrder: undefined,
      positionX: 80,
      positionY: 80,
      widthPx: 260,
      heightPx: 96,
      rotationDeg: 0,
      status: 'ACTIVE',
    });
    setLayoutPreviewValues(form.getFieldsValue());
    setModalOpen(true);
  }

  function openEditModal(table: StudyTable) {
    setEditingTable(table);
    form.setFieldsValue({
      areaId: table.areaId,
      tableNo: table.tableNo,
      name: table.name ?? '',
      rowNo: table.rowNo ?? undefined,
      columnNo: table.columnNo ?? undefined,
      displayOrder: table.displayOrder ?? undefined,
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

  async function saveTable() {
    await form.validateFields();
    const values = form.getFieldsValue(true) as TableFormValues;
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
    { title: '桌子 ID', dataIndex: 'id', width: 90 },
    { title: '桌号', dataIndex: 'tableNo', width: 120 },
    { title: '名称', dataIndex: 'name', width: 180, ellipsis: true, render: (value) => value ?? '-' },
    {
      title: '布局位置',
      width: 150,
      render: (_, record) =>
        record.rowNo && record.columnNo ? `第 ${record.rowNo} 排 / 第 ${record.columnNo} 列` : '-',
    },
    {
      title: '桌面尺寸',
      width: 130,
      render: (_, record) => `${record.widthPx ?? 260} × ${record.heightPx ?? 96}`,
    },
    { title: '展示顺序', dataIndex: 'displayOrder', width: 110, render: (value) => value ?? '-' },
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
        <Space wrap size={8} className="admin-table-actions">
          <Button size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button size="small" onClick={() => openQrModal(record)}>
            签到码
          </Button>
          {record.status === 'ACTIVE' ? (
            <Popconfirm
              title="停用桌子"
              description="停用后该桌子不能承载启用座位，已有活跃预约时后端会拒绝。"
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

      <Table
        className="admin-tables-table"
        rowKey="id"
        loading={loading}
        dataSource={managedTables}
        columns={columns}
        pagination={false}
        scroll={{ x: 1140 }}
      />

      <div className="layout-preview-panel">
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
          onSelectTable={openEditModal}
          selectedTableId={editingTable?.id}
          onMoveTable={(table, position) => {
            setLayoutDrafts((drafts) => ({ ...drafts, [table.id]: position }));
          }}
        />
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
          <div className="resource-layout-fields">
            <Form.Item label="桌宽 px" name="widthPx">
              <InputNumber min={80} precision={0} placeholder="260" />
            </Form.Item>
            <Form.Item label="桌高 px" name="heightPx">
              <InputNumber min={48} precision={0} placeholder="96" />
            </Form.Item>
            <Form.Item label="旋转角度" name="rotationDeg">
              <InputNumber precision={0} placeholder="0" />
            </Form.Item>
          </div>
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
            tables={[
              {
                id: editingTable?.id ?? -1,
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
