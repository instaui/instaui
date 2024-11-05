import React from 'react';
import { Descriptions } from 'antd';

interface FieldConfig {
  key: string;
  label: string;
  hideInListView?: boolean;
}

interface DetailViewProps {
  item: { [key: string]: any } | null;
  config: { keys: FieldConfig[] };
}

const DetailView: React.FC<DetailViewProps> = ({ item, config }) => (
  <Descriptions title="Details">
    {config.keys
      .map((field) => (
        <Descriptions.Item label={field.label} key={field.key}>
          {item?.[field.key]}
        </Descriptions.Item>
      ))}
  </Descriptions>
);

export default DetailView;
