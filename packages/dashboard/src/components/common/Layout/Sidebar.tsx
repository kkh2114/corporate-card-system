import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  SwapOutlined,
  TeamOutlined,
  SafetyOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { ROUTES } from '@/constants/routes';

const { Sider } = Layout;

const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  SwapOutlined: <SwapOutlined />,
  TeamOutlined: <TeamOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  SettingOutlined: <SettingOutlined />,
};

const menuItems = [
  { key: ROUTES.DASHBOARD, label: '대시보드', icon: 'DashboardOutlined' },
  { key: ROUTES.TRANSACTIONS, label: '거래 내역', icon: 'SwapOutlined' },
  { key: ROUTES.EMPLOYEES, label: '직원 관리', icon: 'TeamOutlined' },
  { key: ROUTES.POLICIES, label: '정책 관리', icon: 'SafetyOutlined' },
  { key: ROUTES.STATISTICS, label: '통계/리포트', icon: 'BarChartOutlined' },
  { key: ROUTES.SETTINGS, label: '설정', icon: 'SettingOutlined' },
];

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = menuItems.map((item) => ({
    key: item.key,
    icon: iconMap[item.icon],
    label: item.label,
  }));

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="min-h-screen"
      theme="dark"
    >
      <div className="h-16 flex items-center justify-center text-white font-bold text-lg">
        {collapsed ? 'CC' : '법인카드 관리'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};
