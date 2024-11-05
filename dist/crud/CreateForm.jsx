"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const react_1 = __importDefault(require("react"));
const antd_1 = require("antd");
const icons_1 = require("@ant-design/icons");
const CreateForm = ({ config, onSubmit, validators }) => {
    const [form] = antd_1.Form.useForm();
    const handleFinish = (values) => {
        onSubmit(values);
    };
    const getRules = (validator) => {
        return validator && validators && validators[validator]
            ? [{ validator: (_, value) => validators[validator](value) }]
            : [];
    };
    return (<antd_1.Form form={form} onFinish={handleFinish} layout="vertical">
      {config.keys.map((field) => (field.creatable && (<antd_1.Form.Item key={field.key} name={field.key} label={field.label} rules={getRules(field.validator)}>
            {field.type === 'Text' ? (<antd_1.Input />) : field.type === 'File' ? (<antd_1.Upload>
                <antd_1.Button icon={<icons_1.UploadOutlined />}>Upload</antd_1.Button>
              </antd_1.Upload>) : null}
          </antd_1.Form.Item>)))}
      <antd_1.Form.Item>
        <antd_1.Button type="primary" htmlType="submit">
          Submit
        </antd_1.Button>
      </antd_1.Form.Item>
    </antd_1.Form>);
};
exports.default = CreateForm;
