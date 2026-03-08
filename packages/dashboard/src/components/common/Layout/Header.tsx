import React from 'react';
import { Layout, Badge, Dropdown, Avatar, Space, Button } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStore } from '@/store/dashboardStore';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth();
  const unreadAlertCount = useDashboardStore((s) => s.unreadAlertCount);

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.name || '관리자'} (${user?.department || ''})`,
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '설정',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      onClick: logout,
    },
  ];

  return (
    <AntHeader className="bg-white px-4 flex items-center justify-between shadow-sm">
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggleCollapse}
      />
      <Space size="middle">
        <Badge count={unreadAlertCount} size="small">
          <BellOutlined className="text-xl cursor-pointer" />
        </Badge>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space className="cursor-pointer">
            <Avatar icon={<UserOutlined />} />
            <span className="text-sm">{user?.name || '관리자'}</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};
