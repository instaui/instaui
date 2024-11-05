import React from 'react';
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
    item: {
        [key: string]: any;
    };
    onSubmit: (id: string, values: any) => void;
    config: {
        keys: FieldConfig[];
    };
    validators: {
        [key: string]: ValidatorFunction;
    };
}
declare const EditForm: React.FC<EditFormProps>;
export default EditForm;
