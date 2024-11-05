"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const antd_1 = require("antd");
const DetailView = ({ item, config }) => (<antd_1.Descriptions title="Details">
    {config.keys
        .map((field) => (<antd_1.Descriptions.Item label={field.label} key={field.key}>
          {item === null || item === void 0 ? void 0 : item[field.key]}
        </antd_1.Descriptions.Item>))}
  </antd_1.Descriptions>);
exports.default = DetailView;
