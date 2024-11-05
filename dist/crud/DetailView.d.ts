import React from 'react';
interface FieldConfig {
    key: string;
    label: string;
    hideInListView?: boolean;
}
interface DetailViewProps {
    item: {
        [key: string]: any;
    } | null;
    config: {
        keys: FieldConfig[];
    };
}
declare const DetailView: React.FC<DetailViewProps>;
export default DetailView;
