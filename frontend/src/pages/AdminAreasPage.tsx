import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { createArea, listAreas, testCheckinIp, updateArea, updateAreaStatus } from '../api/areas';
import type { Area, AreaBuildingCode, AreaMapType, AreaStatus } from '../types/seat';
import { formatConnectorAreaName } from '../utils/campusConnectors';

type AreaFormValues = {
  name: string;
  floor?: string;
  buildingCode?: AreaBuildingCode;
  floorCode?: string;
  areaType?: AreaMapType;
  mapX?: number;
  mapY?: number;
  description?: string;
  status: AreaStatus;
  openTime?: string;
  closeTime?: string;
  checkinIpCidrs?: string;
};

const statusLabels: Record<AreaStatus, string> = {
  ACTIVE: '启用',
  INACTIVE: '停用',
};

const statusColors: Record<AreaStatus, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
};

const buildingOptions: { label: string; value: AreaBuildingCode }[] = [
  { label: 'A 楼', value: 'A' },
  { label: 'B 楼', value: 'B' },
  { label: 'C 楼', value: 'C' },
  { label: 'D 楼', value: 'D' },
  { label: 'A-B教学楼连廊', value: 'CONNECTOR' },
  { label: 'B-C教学楼连廊', value: 'CONNECTOR_CD' },
];

const areaTypeOptions: { label: string; value: AreaMapType }[] = [
  { label: '自习室', value: 'STUDY_ROOM' },
  { label: '大厅', value: 'HALL' },
  { label: '走廊', value: 'CORRIDOR' },
  { label: '连廊', value: 'CONNECTOR' },
];

const buildingLabels: Record<AreaBuildingCode, string> = {
  A: 'A 楼',
  B: 'B 楼',
  C: 'C 楼',
  D: 'D 楼',
  CONNECTOR: 'A-B教学楼连廊',
  CONNECTOR_AB: 'A-B教学楼连廊',
  CONNECTOR_CD: 'B-C教学楼连廊',
};

const areaTypeLabels: Record<AreaMapType, string> = {
  STUDY_ROOM: '自习室',
  HALL: '大厅',
  CORRIDOR: '走廊',
  CONNECTOR: '连廊',
};

export default function AdminAreasPage() {
  const [form] = Form.useForm<AreaFormValues>();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingIp, setTestingIp] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const loadAreas = useCallback(async () => {
    setLoading(true);
    try {
      setAreas(await listAreas());
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载区域失败');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  function openCreateModal() {
    setEditingArea(null);
    form.setFieldsValue({
      name: '',
      floor: '',
      buildingCode: undefined,
      floorCode: '',
      areaType: undefined,
      mapX: undefined,
      mapY: undefined,
      description: '',
      status: 'ACTIVE',
      openTime: '08:00',
      closeTime: '22:00',
      checkinIpCidrs: '127.0.0.1/32,::1/128',
    });
    setModalOpen(true);
  }

  function openEditModal(area: Area) {
    setEditingArea(area);
    form.setFieldsValue({
      name: area.name,
      floor: area.floor ?? '',
      buildingCode: area.buildingCode ?? undefined,
      floorCode: area.floorCode ?? '',
      areaType: area.areaType ?? undefined,
      mapX: area.mapX ?? undefined,
      mapY: area.mapY ?? undefined,
      description: area.description ?? '',
      status: area.status,
      openTime: area.openTime?.slice(0, 5) ?? '08:00',
      closeTime: area.closeTime?.slice(0, 5) ?? '22:00',
      checkinIpCidrs: area.checkinIpCidrs,
    });
    setModalOpen(true);
  }

  async function saveArea() {
    const values = await form.validateFields();
    const payload = {
      name: values.name,
      floor: normalizeOptionalString(values.floor),
      buildingCode: values.buildingCode,
      floorCode: normalizeOptionalString(values.floorCode),
      areaType: values.areaType,
      mapX: values.mapX,
      mapY: values.mapY,
      description: normalizeOptionalString(values.description),
      openTime: normalizeFormTime(values.openTime),
      closeTime: normalizeFormTime(values.closeTime),
      checkinIpCidrs: normalizeOptionalString(values.checkinIpCidrs),
    };
    setSaving(true);
    try {
      if (editingArea) {
        await updateArea(editingArea.id, { ...payload, status: values.status });
        messageApi.success('区域已更新');
      } else {
        await createArea(payload);
        messageApi.success('区域已新增');
      }
      setModalOpen(false);
      await loadAreas();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(area: Area, status: AreaStatus) {
    setLoading(true);
    try {
      await updateAreaStatus(area.id, status);
      messageApi.success(status === 'ACTIVE' ? '区域已启用' : '区域已停用');
      await loadAreas();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '状态更新失败');
    } finally {
      setLoading(false);
    }
  }

  async function runCheckinIpTest() {
    const checkinIpCidrs = form.getFieldValue('checkinIpCidrs');
    try {
      validateCidrList(checkinIpCidrs);
      setTestingIp(true);
      const result = await testCheckinIp(checkinIpCidrs);
      const proxyText = result.trustedProxy ? '可信代理转发' : '直连/未信任转发';
      const forwardedText = result.forwardedFor ? `，转发头 ${result.forwardedFor}` : '';
      if (result.matched) {
        messageApi.success(`当前 IP ${result.clientIp} 命中该网段（${proxyText}${forwardedText}）`);
      } else {
        messageApi.warning(`当前 IP ${result.clientIp} 未命中该网段（${proxyText}${forwardedText}）`);
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'IP 网段测试失败');
    } finally {
      setTestingIp(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAreas();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAreas]);

  const columns: TableColumnsType<Area> = [
    { title: '区域 ID', dataIndex: 'id', width: 120 },
    { title: '区域名称', dataIndex: 'name', width: 180, render: (_, record) => formatConnectorAreaName(record) },
    { title: '楼层', dataIndex: 'floor', width: 120, render: (value) => value ?? '-' },
    {
      title: '地图配置',
      width: 220,
      render: (_, record) => renderAreaMapMeta(record),
    },
    {
      title: '开放时段',
      width: 160,
      render: (_, record) => `${record.openTime?.slice(0, 5) ?? '08:00'}-${record.closeTime?.slice(0, 5) ?? '22:00'}`,
    },
    {
      title: '签到网段',
      dataIndex: 'checkinIpCidrs',
      width: 240,
      ellipsis: true,
      render: (value) => value || '-',
    },
    { title: '说明', dataIndex: 'description', ellipsis: true, render: (value) => value ?? '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status: AreaStatus) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
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
              title="停用区域"
              description="停用后学生端不再展示该区域下的开放时段。"
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
        <Space>
          <Button type="primary" onClick={openCreateModal}>
            新增区域
          </Button>
          <Button loading={loading} onClick={loadAreas}>
            刷新
          </Button>
        </Space>
      </div>
      <Table rowKey="id" loading={loading} dataSource={areas} columns={columns} pagination={false} />
      <Modal
        title={editingArea ? '编辑区域' : '新增区域'}
        open={modalOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onOk={saveArea}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="区域名称"
            name="name"
            rules={[
              { required: true, message: '请输入区域名称' },
              { max: 64, message: '区域名称不能超过 64 个字符' },
            ]}
          >
            <Input placeholder="例如 图书馆一楼 A 区" />
          </Form.Item>
          <Form.Item label="楼层" name="floor" rules={[{ max: 32, message: '楼层不能超过 32 个字符' }]}>
            <Input placeholder="例如 1F" />
          </Form.Item>
          <div className="resource-layout-fields area-map-fields">
            <Form.Item label="楼栋分区" name="buildingCode">
              <Select allowClear options={buildingOptions} placeholder="选择地图分区" />
            </Form.Item>
            <Form.Item label="地图楼层" name="floorCode" rules={[{ max: 32, message: '地图楼层不能超过 32 个字符' }]}>
              <Input placeholder="默认同楼层" />
            </Form.Item>
            <Form.Item label="区域类型" name="areaType">
              <Select allowClear options={areaTypeOptions} placeholder="选择区域类型" />
            </Form.Item>
            <Form.Item label="地图 X %" name="mapX" rules={[{ type: 'number', min: 0, max: 100, message: 'X 坐标范围为 0-100' }]}>
              <InputNumber min={0} max={100} placeholder="0-100" />
            </Form.Item>
            <Form.Item label="地图 Y %" name="mapY" rules={[{ type: 'number', min: 0, max: 100, message: 'Y 坐标范围为 0-100' }]}>
              <InputNumber min={0} max={100} placeholder="0-100" />
            </Form.Item>
          </div>
          <Form.Item
            label="说明"
            name="description"
            rules={[{ max: 255, message: '说明不能超过 255 个字符' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <div className="resource-layout-fields">
            <Form.Item
              label="开放开始"
              name="openTime"
              rules={[{ required: true, message: '请选择开放开始时间' }]}
            >
              <Input type="time" step={900} />
            </Form.Item>
            <Form.Item
              label="开放结束"
              name="closeTime"
              rules={[{ required: true, message: '请选择开放结束时间' }]}
            >
              <Input type="time" step={900} />
            </Form.Item>
          </div>
          <Form.Item
            label="签到校园网 IP 网段"
            name="checkinIpCidrs"
            tooltip="多个 CIDR 用英文逗号分隔，例如 10.10.0.0/16,172.16.20.0/24"
            rules={[
              { required: true, message: '请输入允许签到的校园网 IP 网段' },
              { max: 512, message: '签到网段不能超过 512 个字符' },
              {
                validator: (_, value) => {
                  try {
                    validateCidrList(value);
                    return Promise.resolve();
                  } catch (error) {
                    return Promise.reject(error);
                  }
                },
              },
            ]}
          >
            <Input placeholder="例如 10.10.0.0/16,172.16.20.0/24" />
          </Form.Item>
          <Space className="form-inline-actions">
            <Button loading={testingIp} onClick={runCheckinIpTest}>
              测试当前 IP
            </Button>
          </Space>
          {editingArea ? (
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
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

function normalizeFormTime(value?: string) {
  if (!value) {
    return undefined;
  }
  return value.length === 5 ? `${value}:00` : value;
}

function normalizeOptionalString(value?: string) {
  if (!value || !value.trim()) {
    return undefined;
  }
  return value.trim();
}

function renderAreaMapMeta(area: Area) {
  const tags = [
    area.buildingCode ? buildingLabels[area.buildingCode] : null,
    area.floorCode ?? null,
    area.areaType ? areaTypeLabels[area.areaType] : null,
    area.mapX != null && area.mapY != null ? `${area.mapX}, ${area.mapY}` : null,
  ].filter(Boolean);

  if (tags.length === 0) {
    return '-';
  }

  return (
    <Space size={[4, 4]} wrap>
      {tags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </Space>
  );
}

function validateCidrList(value?: string) {
  if (!value || !value.trim()) {
    throw new Error('请输入允许签到的校园网 IP 网段');
  }
  const ranges = value.split(',').map((range) => range.trim()).filter(Boolean);
  if (ranges.length === 0) {
    throw new Error('请输入允许签到的校园网 IP 网段');
  }
  ranges.forEach((range) => {
    const [address, prefix, extra] = range.split('/');
    if (!address || !prefix || extra !== undefined) {
      throw new Error('请使用 CIDR 格式，例如 10.10.0.0/16');
    }
    const prefixLength = Number(prefix);
    const maxPrefixLength = address.includes(':') ? 128 : 32;
    if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > maxPrefixLength) {
      throw new Error('CIDR 前缀长度不合法');
    }
  });
}
