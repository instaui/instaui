// @ts-nocheck
import React from 'react';
import { Form, Input, Button } from 'antd';

interface FieldConfig {
  key: string;
  label: string;
  type: 'Text';
  validator?: string;
  editable?: boolean;
}

interface ValidatorFunction {
  (value: string): [boolean, string];
}

interface EditFormProps {
  item: { [key: string]: any };
  onSubmit: (id: string, values: any) => void;
  config: { keys: FieldConfig[] };
  validators: { [key: string]: ValidatorFunction };
}

const EditForm: React.FC<EditFormProps> = ({ item, onSubmit, config, validators }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onSubmit(item.id, values);
  };

  const getRules = ({validator}) => {
    return validator && validators && validators[validator]
      ? [{ validator: (_, value) => validators[validator](value) }]
      : [];
  };

  return (
    <Form form={form} onFinish={handleFinish} initialValues={item} layout="vertical">
	    <span>Hello</span>
      {config.keys.map((field) => (
        field.editable && (
          <Form.Item
            key={field.key}
            name={field.key}
            label={field.label}
            rules={getRules(field)}
          >
            <Input />
          </Form.Item>
        )
      ))}
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form.Item>
    </Form>
  );
};

export default EditForm;
