"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateTime = exports.formatDate = void 0;
var dayjs_1 = __importDefault(require("dayjs"));
var timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
var utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
var toDayjs = function (value) {
    if (!value)
        return null;
    try {
        // Handle string dates (including ISO strings)
        if (typeof value === 'string') {
            var parsed_1 = (0, dayjs_1.default)(value);
            return parsed_1.isValid() ? parsed_1 : null;
        }
        // Handle Date objects
        if (value instanceof Date) {
            var parsed_2 = (0, dayjs_1.default)(value);
            return parsed_2.isValid() ? parsed_2 : null;
        }
        // Handle Dayjs objects
        if (dayjs_1.default.isDayjs(value)) {
            return value.isValid() ? value : null;
        }
        // Handle other types (numbers, etc.)
        var parsed = (0, dayjs_1.default)(String(value));
        return parsed.isValid() ? parsed : null;
    }
    catch (_a) {
        return null;
    }
};
var formatDate = function (value, keepLocalTime) {
    if (keepLocalTime === void 0) { keepLocalTime = false; }
    var date = toDayjs(value);
    if (!date)
        return null;
    try {
        var finalDate = keepLocalTime ? date.local() : date.utc();
        return finalDate.format('MMMM D, YYYY');
    }
    catch (_a) {
        return null;
    }
};
exports.formatDate = formatDate;
var formatDateTime = function (value, keepLocalTime) {
    if (keepLocalTime === void 0) { keepLocalTime = false; }
    var date = toDayjs(value);
    if (!date)
        return null;
    try {
        var finalDate = keepLocalTime ? date.local() : date.utc();
        return finalDate.format('MMMM D, YYYY h:mm:ss A');
    }
    catch (_a) {
        return null;
    }
};
exports.formatDateTime = formatDateTime;
