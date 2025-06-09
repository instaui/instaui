# Configuration

instaui is highly configurable, allowing you to customize the behavior and appearance of your CRUD interfaces. This page
documents the configuration options available.

## Endpoint Configuration

Each endpoint in the `endpoints` array can have the following properties:

| Property          | Type                  | Description                                                                           |
|-------------------|-----------------------|---------------------------------------------------------------------------------------|
| `key`             | `string`              | Unique identifier for the endpoint. Used in routing.                                  |
| `label`           | `string`              | Display name for the endpoint. Shown in UI elements.                                  |
| `url`             | `string`              | API URL for the endpoint. Used for making requests.                                   |
| `idField`         | `string`              | (Optional) Field to use as the ID. Default: 'id'.                                     |
| `fields`          | `FieldConfig[]`       | Array of field configurations.                                                        |
| `validator`       | `function`            | Form validation function. Should return an object with field keys and error messages. |
| `customComponent` | `React.ComponentType` | (Optional) Custom component to render instead of the default CRUD UI.                 |
| `header`          | `React.ReactNode`     | (Optional) Custom header component.                                                   |
| `footer`          | `React.ReactNode`     | (Optional) Custom footer component.                                                   |
| `actionButtons`   | `ActionButtonConfig`  | (Optional) Configuration for action buttons.                                          |

### Example

```jsx
{
    key: 'users',
        label
:
    'Users',
        url
:
    '/users',
        idField
:
    'uid',
        header
:
    <CustomHeader/>,
        footer
:
    <CustomFooter/>,
        actionButtons
:
    {
        edit: {
            text: 'Modify User',
        }
    ,
        delete
    :
        {
            text: 'Remove User',
        }
    ,
    }
,
    fields: [
        // Field configurations...
    ],
        validator
:
    (values) => {
        const errors = {};
        if (!values.name) errors.name = 'Name is required';
        return errors;
    },
}
```

## Field Configuration

Each field in the `fields` array can have the following properties:

| Property         | Type                                 | Description                                                                                                                    |
|------------------|--------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `key`            | `string`                             | Field key in the API data.                                                                                                     |
| `label`          | `string`                             | Display label for the field.                                                                                                   |
| `type`           | `string`                             | Field type. One of: 'text', 'textarea', 'number', 'boolean', 'date', 'datetime', 'time', 'select', 'relation', 'url', 'email'. |
| `required`       | `boolean`                            | (Optional) Whether the field is required.                                                                                      |
| `readOnly`       | `boolean`                            | (Optional) Whether the field is read-only.                                                                                     |
| `placeHolder`    | `string`                             | (Optional) Placeholder text.                                                                                                   |
| `options`        | `{ label: string; value: string }[]` | (Optional) Options for select fields.                                                                                          |
| `relation`       | `RelationConfig`                     | (Optional) Configuration for relation fields.                                                                                  |
| `showInList`     | `boolean`                            | (Optional) Whether to show the field in the list view.                                                                         |
| `sortable`       | `boolean`                            | (Optional) Whether the field can be sorted.                                                                                    |
| `filterable`     | `boolean`                            | (Optional) Whether the field can be filtered.                                                                                  |
| `filterType`     | `'eq' \| 'range' \| 'boolean'`       | (Optional) Type of filter to use.                                                                                              |
| `renderInList`   | `function`                           | (Optional) Custom renderer for list view.                                                                                      |
| `renderInDetail` | `function`                           | (Optional) Custom renderer for detail view.                                                                                    |
| `isFile`         | `boolean`                            | (Optional) Whether the field is a file upload.                                                                                 |
| `isImage`        | `boolean`                            | (Optional) Whether the field is an image upload.                                                                               |
| `accept`         | `string \| string[]`                 | (Optional) Accepted file types.                                                                                                |
| `maxSize`        | `number`                             | (Optional) Maximum file size in MB.                                                                                            |
| `postable`       | `boolean`                            | (Optional) Whether the field can be included in POST requests.                                                                 |
| `patchable`      | `boolean`                            | (Optional) Whether the field can be included in PATCH requests.                                                                |
| `dateFormat`     | `string`                             | (Optional) Format for date fields.                                                                                             |
| `keepLocalTime`  | `boolean`                            | (Optional) Whether to keep local time for date fields.                                                                         |

### Example

```jsx
{
    key: 'name',
        label
:
    'Name',
        type
:
    'text',
        required
:
    true,
        showInList
:
    true,
        patchable
:
    true,
        postable
:
    true,
        filterable
:
    true,
        filterType
:
    'eq',
}
```

### Field Types

instaui supports the following field types:

#### Text

A single-line text input.

```jsx
{
    key: 'name',
        label
:
    'Name',
        type
:
    'text',
        required
:
    true,
}
```

#### Textarea

A multi-line text input.

```jsx
{
    key: 'description',
        label
:
    'Description',
        type
:
    'textarea',
        required
:
    true,
}
```

#### Number

A numeric input.

```jsx
{
    key: 'price',
        label
:
    'Price',
        type
:
    'number',
        required
:
    true,
}
```

#### Boolean

A checkbox or toggle.

```jsx
{
    key: 'active',
        label
:
    'Active',
        type
:
    'boolean',
        required
:
    true,
}
```

#### Date

A date picker.

```jsx
{
    key: 'date',
        label
:
    'Date',
        type
:
    'date',
        required
:
    true,
        dateFormat
:
    'YYYY-MM-DD',
}
```

#### Datetime

A date and time picker.

```jsx
{
    key: 'datetime',
        label
:
    'Date and Time',
        type
:
    'datetime',
        required
:
    true,
        dateFormat
:
    'YYYY-MM-DD HH:mm:ss',
        keepLocalTime
:
    false,
}
```

#### Time

A time picker.

```jsx
{
    key: 'time',
        label
:
    'Time',
        type
:
    'time',
        required
:
    true,
}
```

#### Select

A dropdown select.

```jsx
{
    key: 'status',
        label
:
    'Status',
        type
:
    'select',
        options
:
    [
        {label: 'Active', value: 'active'},
        {label: 'Inactive', value: 'inactive'},
    ],
        required
:
    true,
}
```

#### Relation

A field that references another entity.

```jsx
{
    key: 'user',
        label
:
    'User',
        type
:
    'relation',
        required
:
    true,
        relation
:
    {
        entity: 'users',
            idField
    :
        'id',
            keyColumns
    :
        ['name', 'email'],
    }
,
}
```

#### URL

A URL input, optionally with file or image upload capabilities.

```jsx
{
    key: 'website',
        label
:
    'Website',
        type
:
    'url',
        required
:
    true,
}
```

For file uploads:

```jsx
{
    key: 'file',
        label
:
    'File',
        type
:
    'url',
        required
:
    true,
        isFile
:
    true,
        accept
:
    'pdf',
        maxSize
:
    5, // 5MB
}
```

For image uploads:

```jsx
{
    key: 'image',
        label
:
    'Image',
        type
:
    'url',
        required
:
    true,
        isImage
:
    true,
        accept
:
    ['jpg', 'png', 'gif'],
        maxSize
:
    2, // 2MB
}
```

#### Email

An email input.

```jsx
{
    key: 'email',
        label
:
    'Email',
        type
:
    'email',
        required
:
    true,
}
```

## Relation Configuration

For fields of type `relation`, you can configure how the relation works:

| Property          | Type       | Description                                            |
|-------------------|------------|--------------------------------------------------------|
| `entity`          | `string`   | The related entity key.                                |
| `idField`         | `string`   | The ID field of the related entity.                    |
| `keyColumns`      | `string[]` | (Optional) Fields to display from the related entity.  |
| `dropDownOptions` | `function` | (Optional) Custom function to format dropdown options. |

### Example

```jsx
{
    key: 'user',
        label
:
    'User',
        type
:
    'relation',
        required
:
    true,
        relation
:
    {
        entity: 'users',
            idField
    :
        'id',
            keyColumns
    :
        ['name', 'email'],
            dropDownOptions
    :
        (item) => ({
            label: `${item.name} (${item.email})`,
            value: item.id,
        }),
    }
,
}
```

## Action Button Configuration

You can customize the action buttons for each endpoint:

| Property      | Type        | Description                                       |
|---------------|-------------|---------------------------------------------------|
| `show`        | `boolean`   | (Optional) Whether to show action buttons at all. |
| `edit`        | `object`    | (Optional) Configuration for the edit button.     |
| `edit.show`   | `boolean`   | (Optional) Whether to show the edit button.       |
| `edit.text`   | `string`    | (Optional) Custom text for the edit button.       |
| `edit.icon`   | `ReactNode` | (Optional) Custom icon for the edit button.       |
| `delete`      | `object`    | (Optional) Configuration for the delete button.   |
| `delete.show` | `boolean`   | (Optional) Whether to show the delete button.     |
| `delete.text` | `string`    | (Optional) Custom text for the delete button.     |
| `delete.icon` | `ReactNode` | (Optional) Custom icon for the delete button.     |

### Example

```jsx
{
    // Hide all action buttons
    actionButtons: {
        show: false,
    }
,
}
```

```jsx
{
    // Hide only the delete button
    actionButtons: {
        delete
    :
        {
            show: false,
        }
    ,
    }
,
}
```

```jsx
{
    // Customize button text
    actionButtons: {
        edit: {
            text: 'Modify',
        }
    ,
        delete
    :
        {
            text: 'Remove',
        }
    ,
    }
,
}
```