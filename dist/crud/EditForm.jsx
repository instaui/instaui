"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const react_1 = __importDefault(require("react"));
const antd_1 = require("antd");
const EditForm = ({ item, onSubmit, config, validators }) => {
    const [form] = antd_1.Form.useForm();
    const handleFinish = (values) => {
        onSubmit(item.id, values);
    };
    const getRules = ({ validator }) => {
        return validator && validators && validators[validator]
            ? [{ validator: (_, value) => validators[validator](value) }]
            : [];
    };
    return (<antd_1.Form form={form} onFinish={handleFinish} initialValues={item} layout="vertical">
	    <span>Hello</span>
      {config.keys.map((field) => (field.editable && (<antd_1.Form.Item key={field.key} name={field.key} label={field.label} rules={getRules(field)}>
            <antd_1.Input />
          </antd_1.Form.Item>)))}
      <antd_1.Form.Item>
        <antd_1.Button type="primary" htmlType="submit">
          Save
        </antd_1.Button>
      </antd_1.Form.Item>
    </antd_1.Form>);
};
exports.default = EditForm;
