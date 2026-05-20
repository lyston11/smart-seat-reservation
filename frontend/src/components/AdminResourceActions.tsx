import { Button, Popconfirm, Space } from 'antd';
import type { ReactNode } from 'react';

export type AdminResourceAction = {
  key: string;
  label: string;
  icon?: ReactNode;
  type?: 'primary' | 'default';
  danger?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmOkText?: string;
  onClick: () => void;
};

type AdminResourceActionsProps = {
  actions: AdminResourceAction[];
};

export default function AdminResourceActions({ actions }: AdminResourceActionsProps) {
  return (
    <Space wrap size={6} className="admin-resource-actions">
      {actions.map((action) => {
        const button = (
          <Button
            size="small"
            type={action.type}
            danger={action.danger}
            icon={action.icon}
            onClick={action.confirmTitle ? undefined : action.onClick}
          >
            {action.label}
          </Button>
        );

        if (!action.confirmTitle) {
          return <span key={action.key}>{button}</span>;
        }

        return (
          <Popconfirm
            key={action.key}
            title={action.confirmTitle}
            description={action.confirmDescription}
            okText={action.confirmOkText ?? '确认'}
            cancelText="取消"
            onConfirm={action.onClick}
          >
            {button}
          </Popconfirm>
        );
      })}
    </Space>
  );
}
