// @ts-ignore
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';

interface RouteConfig {
  path: string;
  breadcrumb: string;
  component: React.ReactNode;
}

interface RouterWrapperProps {
  routes: RouteConfig[];
}

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x:string) => x);

  return (
    <Breadcrumb style={{ marginBottom: 16 }}>
      <Breadcrumb.Item key="home">
        <Link to="/">Home</Link>
      </Breadcrumb.Item>
      {pathnames.map((value, index:number) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        return (
          <Breadcrumb.Item key={to}>
            <Link to={to}>{value}</Link>
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
};

const RouterWrapper: React.FC<RouterWrapperProps> = ({ routes }) => {
  return (
    <Router>
      {/*<Breadcrumbs />*/}
      <Routes>
        {routes.map(({ path, component }) => (
          <Route key={path} path={path} element={component} />
        ))}
      </Routes>
    </Router>
  );
};
