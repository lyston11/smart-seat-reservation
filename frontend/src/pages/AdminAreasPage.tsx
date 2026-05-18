import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { createArea, listAreas, updateArea, updateAreaStatus } from '../api/areas';
import type { Area, AreaStatus } from '../types/seat';

type AreaFormValues = {
  name: string;
  floor?: string;
  description?: string;
  status: AreaStatus;
  openTime?: string;
  closeTime?: string;
};

const statusLabels: Record<AreaStatus, string> = {
  ACTIVE: '启用',
  INACTIVE: '停用',
};

const statusColors: Record<AreaStatus, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
};

export default function AdminAreasPage() {
  const [form] = Form.useForm<AreaFormValues>();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      description: '',
      status: 'ACTIVE',
      openTime: '08:00',
      closeTime: '22:00',
    });
    setModalOpen(true);
  }

  function openEditModal(area: Area) {
    setEditingArea(area);
    form.setFieldsValue({
      name: area.name,
      floor: area.floor ?? '',
      description: area.description ?? '',
      status: area.status,
      openTime: area.openTime?.slice(0, 5) ?? '08:00',
      closeTime: area.closeTime?.slice(0, 5) ?? '22:00',
    });
    setModalOpen(true);
  }

  async function saveArea() {
    const values = await form.validateFields();
    const payload = {
      ...values,
      openTime: normalizeFormTime(values.openTime),
      closeTime: normalizeFormTime(values.closeTime),
    };
    setSaving(true);
    try {
      if (editingArea) {
        await updateArea(editingArea.id, payload);
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAreas();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAreas]);

  const columns: TableColumnsType<Area> = [
    { title: '区域 ID', dataIndex: 'id', width: 120 },
    { title: '区域名称', dataIndex: 'name', width: 180 },
    { title: '楼层', dataIndex: 'floor', width: 120, render: (value) => value ?? '-' },
    {
      title: '开放时段',
      width: 160,
      render: (_, record) => `${record.openTime?.slice(0, 5) ?? '08:00'}-${record.closeTime?.slice(0, 5) ?? '22:00'}`,
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
