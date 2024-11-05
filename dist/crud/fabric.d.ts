import React from 'react';
interface ValidatorFunction {
    (value: string): [boolean, string];
}
interface FieldConfig {
    key: string;
    label: string;
    type: 'Text' | 'File' | 'relation';
    validator?: string;
    creatable?: boolean;
    editable?: boolean;
    hideInListView?: boolean;
    target?: string;
    path?: string;
    identifier?: string;
}
interface Config {
    keys: FieldConfig[];
}
interface CrudComponentProps {
    endpoint: string;
    axiosClient: any;
    config: Config;
    validators: {
        [key: string]: ValidatorFunction;
    };
}
declare const CrudComponent: React.FC<CrudComponentProps>;
export default CrudComponent;
