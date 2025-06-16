// src/params/spinner.ts

import type { ParamMatcher } from '@sveltejs/kit';

/**
 * This matcher validates that the parameter is either an empty string (for the root '/')
 * or the exact string 'spinner'.
 */
export const match: ParamMatcher = (param) => {
	return param === '' || param === 'spinner';
};
