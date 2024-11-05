"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const antd_1 = require("antd");
const Breadcrumbs = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const pathnames = location.pathname.split('/').filter((x) => x);
    return (<antd_1.Breadcrumb style={{ marginBottom: 16 }}>
      <antd_1.Breadcrumb.Item key="home">
        <react_router_dom_1.Link to="/">Home</react_router_dom_1.Link>
      </antd_1.Breadcrumb.Item>
      {pathnames.map((value, index) => {
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            return (<antd_1.Breadcrumb.Item key={to}>
            <react_router_dom_1.Link to={to}>{value}</react_router_dom_1.Link>
          </antd_1.Breadcrumb.Item>);
        })}
    </antd_1.Breadcrumb>);
};
const RouterWrapper = ({ routes }) => {
    return (<react_router_dom_1.BrowserRouter>
      {/*<Breadcrumbs />*/}
      <react_router_dom_1.Routes>
        {routes.map(({ path, component }) => (<react_router_dom_1.Route key={path} path={path} element={component}/>))}
      </react_router_dom_1.Routes>
    </react_router_dom_1.BrowserRouter>);
};
