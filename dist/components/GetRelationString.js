"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelationString = void 0;
var react_1 = __importDefault(require("react"));
var getRelationString = function (relation, value) {
    if (relation.render) {
        var rendered = relation.render(value);
        // Ensure we don't return an object directly
        if (typeof rendered === 'object' && rendered !== null && !react_1.default.isValidElement(rendered)) {
            // Convert object to string representation
            return JSON.stringify(rendered);
        }
        return rendered;
    }
    if (relation.keyColumns) {
        var keyValues = relation.keyColumns.map(function (key) {
            var keyValue = value[key];
            // Ensure we don't use an object directly
            if (typeof keyValue === 'object' && keyValue !== null && !react_1.default.isValidElement(keyValue)) {
                // Convert object to string representation
                return JSON.stringify(keyValue);
            }
            return keyValue;
        });
        var retVal = keyValues.filter(function (val) { return val; }).join(', ');
        if (retVal !== '') {
            return retVal;
        }
    }
    if (relation.displayField && value[relation.displayField]) {
        var displayValue = value[relation.displayField];
        // Ensure we don't return an object directly
        if (typeof displayValue === 'object' && displayValue !== null && !react_1.default.isValidElement(displayValue)) {
            // Convert object to string representation
            return JSON.stringify(displayValue);
        }
        return displayValue;
    }
    var fallbackValue = value.uid || value.id || value.name || value;
    // Ensure we don't return an object directly
    if (typeof fallbackValue === 'object' && fallbackValue !== null && !react_1.default.isValidElement(fallbackValue)) {
        // Convert object to string representation
        return JSON.stringify(fallbackValue);
    }
    return fallbackValue;
};
exports.getRelationString = getRelationString;
