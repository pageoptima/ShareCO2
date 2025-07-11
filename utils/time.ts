
/**
 * Converts a local‑date‑time string (e.g. "2025‑06‑29T16:40") or a Date 
 * into a full UTC ISO string ("YYYY‑MM‑DDTHH:mm:ss.sssZ").
 */
export function localToUtcIso(input: string | Date): string {
    const date = typeof input === "string"
        ? new Date(input)
        : input;
    if (isNaN(date.getTime())) {
        throw new Error(`localToUtcIso: invalid local time "${input}"`);
    }
    return date.toISOString();
}

/**
 * Converts a UTC ISO string (or Date) into a local‑date‑time string
 * without zone info, e.g. "2025‑06‑29T16:40".
 */
export function utcIsoToLocal(input: string | Date): string {
    const date = typeof input === "string"
        ? new Date(input)
        : input;
    if (isNaN(date.getTime())) {
        throw new Error(`utcIsoToLocal: invalid UTC time "${input}"`);
    }

    const Y = date.getFullYear();
    const M = String(date.getMonth() + 1).padStart(2, "0");
    const D = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");

    return `${Y}-${M}-${D}T${h}:${m}`;
}

/**
 * Converts a UTC ISO‑8601 timestamp (e.g. "2025-06-29T10:10:00.000Z")
 * into a local-date string in "DD/MM/YYYY" format.
 *
 * @param input - UTC ISO string or Date
 * @returns date string like "24/04/2025"
 */
export function utcIsoToLocalDate(input: string | Date): string {
    // 1. Parse into a Date (string → UTC under the hood, Date stays as-is)
    const date = typeof input === "string" ? new Date(input) : input;

    if (isNaN(date.getTime())) {
        throw new Error(`utcIsoToLocalDate: invalid UTC ISO string “${input}”`);
    }

    // 2. Extract local date components
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    // 3. Return in DD/MM/YYYY
    return `${day}/${month}/${year}`;
}

/**
 * Converts a UTC ISO‑8601 timestamp (e.g. "2025-06-29T10:10:00.000Z")
 * or a Date into a local‑time string in "HH:mm" format.
 *
 * @param input - UTC ISO string or Date
 * @returns time string like "16:40"
 */
export function utcIsoToLocalTime(input: string | Date): string {
    // 1. Parse into a Date (string → UTC under the hood)
    const date = typeof input === "string" ? new Date(input) : input;

    if (isNaN(date.getTime())) {
        throw new Error(`utcIsoToLocalTime: invalid UTC ISO string “${input}”`);
    }

    // 2. Extract local time components
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    // 3. Return in HH:mm
    return `${hours}:${minutes}`;
}

/**
 * Converts a UTC ISO‑8601 timestamp (e.g. "2025-06-29T10:10:00.000Z")
 * or a Date into a local‑time string in 12‑hour format with AM/PM, e.g. "4:40 PM".
 *
 * @param input - UTC ISO string or Date
 * @returns time string like "4:40 PM"
 */
export function utcIsoToLocalTime12(input: string | Date): string {

    // 1. Parse into a Date (string → UTC under the hood)
    const date = typeof input === "string" ? new Date(input) : input;
    if (isNaN(date.getTime())) {
        throw new Error(`utcIsoToLocalTime12: invalid UTC ISO string “${input}”`);
    }

    // 2. Extract local hours and minutes
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");

    // 3. Determine AM/PM
    const ampm = hours >= 12 ? "PM" : "AM";
    // Convert to 12‑hour clock: 0 → 12, 13 → 1, etc.
    hours = hours % 12;
    if (hours === 0) hours = 12;

    // 4. Return formatted string
    return `${hours}:${minutes} ${ampm}`;
}

/**
 * Check is more then a cirten amount of minute left
 */
export function isMoreThanNMinutesLeft(startTime: Date, minutes: number): boolean {
    const now = new Date();
    const thresholdTime = new Date(startTime.getTime() - minutes * 60 * 1000);
    return now < thresholdTime;
}

/**
 * Checks if the threshold time before the ride has already passed.
 * @param rideStartTime - The Date/time when the ride is scheduled to start
 * @param thresholdMinutes - Minutes before the ride when the threshold is set
 * @returns true if current time is past the threshold, false otherwise
 */
export function hasPassedNMinutes(rideStartTime: Date, thresholdMinutes: number): boolean {
    const now = new Date();
    const thresholdTime = new Date(rideStartTime.getTime() - thresholdMinutes * 60 * 1000);
    return now >= thresholdTime;
}

