import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useWebSocket } from '@/hooks/useWebSocket';

const { Content } = Layout;

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  useWebSocket();

  return (
    <Layout className="min-h-screen">
      <Sidebar collapsed={collapsed} />
      <Layout>
        <Header
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        <Content className="m-4 p-6 bg-white rounded-lg min-h-[280px]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
