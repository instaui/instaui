import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const toDayjs = (value: unknown): dayjs.Dayjs | null => {
	if (!value) return null;
	
	try {
		// Handle string dates (including ISO strings)
		if (typeof value === 'string') {
			const parsed = dayjs(value);
			return parsed.isValid() ? parsed : null;
		}
		
		// Handle Date objects
		if (value instanceof Date) {
			const parsed = dayjs(value);
			return parsed.isValid() ? parsed : null;
		}
		
		// Handle Dayjs objects
		if (dayjs.isDayjs(value)) {
			return value.isValid() ? value : null;
		}
		
		// Handle other types (numbers, etc.)
		const parsed = dayjs(String(value));
		return parsed.isValid() ? parsed : null;
	} catch {
		return null;
	}
};

export const formatDate = (
	value: unknown,
	keepLocalTime = false
): string | null => {
	const date = toDayjs(value);
	if (!date) return null;
	
	try {
		const finalDate = keepLocalTime ? date.local() : date.utc();
		return finalDate.format('MMMM D, YYYY');
	} catch {
		return null;
	}
};

export const formatDateTime = (
	value: unknown,
	keepLocalTime = false
): string | null => {
	const date = toDayjs(value);
	if (!date) return null;
	
	try {
		const finalDate = keepLocalTime ? date.local() : date.utc();
		return finalDate.format('MMMM D, YYYY h:mm:ss A');
	} catch {
		return null;
	}
};