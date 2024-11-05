import React from 'react';
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
    config: {
        keys: FieldConfig[];
    };
    onSubmit: (values: any) => void;
    validators: {
        [key: string]: ValidatorFunction;
    };
}
declare const CreateForm: React.FC<CreateFormProps>;
export default CreateForm;
