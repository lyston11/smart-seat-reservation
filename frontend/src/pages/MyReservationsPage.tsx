import { Empty } from 'antd';

export default function MyReservationsPage() {
  return (
    <div className="page">
      <div className="empty-panel">
        <Empty
          description="我的预约页面骨架已就绪，后续接入预约历史接口。"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    </div>
  );
}
