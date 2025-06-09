export declare const UI_CONSTANTS: {
    readonly MODAL_TITLES: {
        readonly EDIT_ITEM: "Edit Item";
        readonly ADD_ITEM: "Add New Item";
        readonly ITEM_DETAILS: "Item Details";
        readonly CONFIRM_DELETION: "Confirm Deletion";
    };
    readonly BUTTON_TEXTS: {
        readonly EDIT: "Edit";
        readonly DELETE: "Delete";
        readonly CLOSE: "Close";
        readonly CANCEL: "Cancel";
        readonly UPDATE: "Update";
        readonly ADD: "Add";
        readonly APPLY_FILTERS: "Apply Filters";
        readonly VIEW_FILE: "View File";
        readonly SELECT_IMAGE: "Select Image";
        readonly SELECT_FILE: "Select File";
        readonly DOWNLOAD_FILE: "Download File";
        readonly FILTER: "Filter";
        readonly RESET: "Reset";
        readonly ACTIONS: "Actions";
    };
    readonly MODAL_MESSAGES: {
        readonly DELETE_CONFIRMATION: "Are you sure you want to delete this item?";
        readonly DELETE_WARNING: "This action cannot be undone.";
        readonly DELETE_INPUT_PLACEHOLDER: "Type DELETE to confirm";
        readonly FILE_SELECT_SUCCESS: "file selected successfully";
        readonly FILE_SELECT_FAILED: "file selection failed.";
        readonly FILE_SIZE_ERROR: "File must be smaller than";
        readonly FAILED_TO_LOAD_RELATION: "Failed to load relation options";
        readonly FILE_UPLOAD_SUCCESS: "uploaded successfully";
        readonly FILE_UPLOAD_FAILED: "upload failed";
        readonly ID_FIELD_NOT_CONFIGURED: "ID field is not configured";
        readonly ITEM_ID_MISSING: "Item ID is missing";
        readonly FAILED_TO_FETCH_ITEM: "Failed to fetch item: ";
        readonly FAILED_TO_SAVE_ITEM: "Failed to save item: ";
        readonly FAILED_TO_DELETE_ITEM: "Failed to delete item: ";
    };
    readonly FORM_MESSAGES: {
        readonly REQUIRED_FIELD: "is required";
        readonly INVALID_EMAIL: "Please enter a valid email";
        readonly INVALID_NUMBER: "Please enter a valid number";
        readonly INVALID_VALUE: "Invalid value";
    };
    readonly STATUS_TEXTS: {
        readonly YES: "Yes";
        readonly NO: "No";
    };
    readonly ERROR_MESSAGES: {
        readonly UNKNOWN_ERROR: "Unknown error occurred";
        readonly ERROR: "Error";
        readonly FAILED_TO_FETCH_ITEMS: "Failed to fetch items: ";
        readonly FAILED_TO_FETCH_ITEM: "Failed to fetch item: ";
        readonly FAILED_TO_SAVE_ITEM: "Failed to save item: ";
        readonly FAILED_TO_DELETE_ITEM: "Failed to delete item: ";
        readonly ID_FIELD_NOT_CONFIGURED: "ID field is not configured";
        readonly ITEM_ID_MISSING: "Item ID is missing";
        readonly ERROR_PLACEMENT: "topRight";
        readonly ENDPOINT_NOT_CONFIGURED: "Unknown Target";
    };
    readonly SUCCESS_MESSAGES: {
        readonly SUCCESS: "Success";
        readonly ITEM_UPDATED: "Item updated successfully";
        readonly ITEM_CREATED: "Item created successfully";
        readonly ITEM_DELETED: "Item deleted successfully";
    };
    readonly ID_FIELDS: {
        readonly POSSIBLE_FIELDS: readonly ["id", "uid", "uuid", "_id"];
    };
    readonly URL_PARAMS: {
        readonly PAGE: "page";
        readonly PAGE_SIZE: "pageSize";
        readonly SORT: "sort";
        readonly ORDER: "order";
    };
    readonly LAYOUT: {
        readonly DRAWER_WIDTH: 800;
        readonly MODAL_WIDTH: 600;
        readonly IMAGE_WIDTH_SMALL: 40;
        readonly IMAGE_WIDTH_MEDIUM: 100;
        readonly IMAGE_WIDTH_LARGE: 200;
        readonly TEXTAREA_ROWS: 4;
        readonly FILTER_INPUT_WIDTH: 100;
        readonly FILTER_SELECT_WIDTH: 120;
        readonly FILTER_TEXT_WIDTH: 150;
        readonly FILTER_BUTTON_WIDTH: 90;
        readonly FILTER_BUTTON_MARGIN: 8;
        readonly FILTER_ROW_MARGIN: 16;
        readonly FILTER_LABEL_MARGIN: 4;
        readonly FILTER_LABEL_FONT_SIZE: 12;
        readonly FILTER_LABEL_COLOR: "#666";
        readonly DETAIL_FIELD_MARGIN: "16px";
        readonly DETAIL_LABEL_MARGIN: "4px";
        readonly DETAIL_LABEL_FONT_WEIGHT: "bold";
        readonly DETAIL_ACTIONS_MARGIN: "16px";
        readonly DETAIL_ACTIONS_ALIGN: "right";
        readonly HEADER_MARGIN: 16;
        readonly HEADER_TITLE_MARGIN: 0;
        readonly TABLE_MIN_HEIGHT: 0;
        readonly COLUMN_MIN_WIDTH: 150;
    };
    readonly DEFAULTS: {
        readonly FIRST_PAGE: 1;
        readonly PAGE_SIZE: 10;
        readonly ALERT_DURATION: 5;
    };
    readonly FILE_UPLOAD: {
        readonly DEFAULT_UID: "-1";
        readonly DEFAULT_STATUS: "done";
    };
    readonly FILTER_PLACEHOLDERS: {
        readonly MIN: "Min";
        readonly MAX: "Max";
        readonly SELECT: "Select";
        readonly SEARCH: "Search";
    };
    readonly STYLES: {
        readonly FLEX: {
            readonly DISPLAY: "flex";
            readonly WRAP: "wrap";
            readonly ALIGN_CENTER: "center";
            readonly JUSTIFY_RIGHT: "right";
        };
        readonly MARGIN: {
            readonly RIGHT: 16;
            readonly BOTTOM: 8;
            readonly LEFT: 16;
            readonly TOP: 16;
        };
        readonly PADDING: 8;
        readonly BORDER_RADIUS: 4;
        readonly FONT: {
            readonly SIZE: {
                readonly SMALL: 12;
            };
            readonly WEIGHT: {
                readonly BOLD: "bold";
            };
        };
        readonly COLOR: {
            readonly GRAY: "#666";
            readonly WHITE: "#fff";
        };
    };
};
