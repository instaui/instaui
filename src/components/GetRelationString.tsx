import {Item, RelationConfig} from "./types";
import React from 'react';

export const getRelationString = (relation: RelationConfig, value: Item) => {
	if (relation.render) {
		const rendered = relation.render(value);
		// Ensure we don't return an object directly
		if (typeof rendered === 'object' && rendered !== null && !React.isValidElement(rendered)) {
			// Convert object to string representation
			return JSON.stringify(rendered);
		}
		return rendered;
	}
	if (relation.keyColumns) {
		const keyValues = relation.keyColumns.map((key) => {
			const keyValue = value[key];
			// Ensure we don't use an object directly
			if (typeof keyValue === 'object' && keyValue !== null && !React.isValidElement(keyValue)) {
				// Convert object to string representation
				return JSON.stringify(keyValue);
			}
			return keyValue;
		});
		const retVal = keyValues.filter((val) => val).join(', ');
		if (retVal !== '') {
			return retVal;
		}
	}
	if (relation.displayField && value[relation.displayField]) {
		const displayValue = value[relation.displayField];
		// Ensure we don't return an object directly
		if (typeof displayValue === 'object' && displayValue !== null && !React.isValidElement(displayValue)) {
			// Convert object to string representation
			return JSON.stringify(displayValue);
		}
		return displayValue;
	}
	const fallbackValue = value.uid || value.id || value.name || value;
	// Ensure we don't return an object directly
	if (typeof fallbackValue === 'object' && fallbackValue !== null && !React.isValidElement(fallbackValue)) {
		// Convert object to string representation
		return JSON.stringify(fallbackValue);
	}
	return fallbackValue;
}