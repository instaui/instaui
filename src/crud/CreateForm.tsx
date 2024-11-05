// @ts-nocheck
import React from 'react';
import { Form, Input, Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface FieldConfig {
  key: string;
  label: string;
  type: 'Text' | 'File';
  validator?: string;
  creatable?: boolean;
}

interface ValidatorFunction {
  (value: string): [boolean, string];
}

interface CreateFormProps {
  config: { keys: FieldConfig[] };
  onSubmit: (values: any) => void;
  validators: { [key: string]: ValidatorFunction };
}

const CreateForm: React.FC<CreateFormProps> = ({ config, onSubmit, validators }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onSubmit(values);
  };

  const getRules = (validator?: string) => {
    return validator && validators && validators[validator]
      ? [{ validator: (_, value) => validators[validator](value) }]
      : [];
  };

  return (
    <Form form={form} onFinish={handleFinish} layout="vertical">
      {config.keys.map((field) => (
        field.creatable && (
          <Form.Item
            key={field.key}
            name={field.key}
            label={field.label}
            rules={getRules(field.validator)}
          >
            {field.type === 'Text' ? (
              <Input />
            ) : field.type === 'File' ? (
              <Upload>
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
            ) : null}
          </Form.Item>
        )
      ))}
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CreateForm;
