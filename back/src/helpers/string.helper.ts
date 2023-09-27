const SUPPORTED_LOWER_LIMIT = 32;
const SUPPORTED_UPPER_LIMIT = 126;
const EXTRA_SUPPORTED = [193, 201, 205, 209, 211, 218, 220, 225, 233, 237, 241, 243, 250, 252];
const UPPER_CASE_LOWER_LIMIT = 65;
const UPPER_CASE_UPPER_LIMIT = 90;

export const booleanToString = (maybeBoolean?: boolean): string | undefined => {
    if (maybeBoolean === undefined || maybeBoolean === null) return undefined;
    return maybeBoolean ? 'true' : 'false';
};

export const isValidText = (text: string): boolean => {
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        if ((charCode < SUPPORTED_LOWER_LIMIT || charCode > SUPPORTED_UPPER_LIMIT) && !EXTRA_SUPPORTED.includes(charCode)) return false;
    }
    return true;
};

export const encodeChar = (char: string): {cleanChar: string, encoding?: number} => {
    const charCode = char.charCodeAt(0);
    const encoding = charCode;
    switch (charCode) {
        case 193:
        case 225: 
            return {cleanChar: 'a', encoding};
        case 201:
        case 233:
            return {cleanChar: 'e', encoding};
        case 205:
        case 237:
            return {cleanChar: 'i', encoding};
        case 209:
        case 241:
            return {cleanChar: 'n', encoding};
        case 211:
        case 243:
            return {cleanChar: 'o', encoding};
        case 218:
        case 220:
        case 250:
        case 252:
            return {cleanChar: 'u', encoding};
        default:
            return {cleanChar: char.toLowerCase(), encoding: (charCode >= UPPER_CASE_LOWER_LIMIT && charCode <= UPPER_CASE_UPPER_LIMIT) ? encoding : undefined};
    }
};

export const cleanText = (text: string): string => {
    const cleanText: string[] = [];
    for (let i = 0; i < text.length; i++) {
        cleanText.push(encodeChar(text.charAt(i)).cleanChar);
    }
    return cleanText.join('');
};

export const cleanMaybeText = (text?: string): string | undefined => {
    if (text === undefined) return undefined;
    return cleanText(text);
};

export const encodeText = (text: string): {cleanText: string, encoding: number[]} => {
    const cleanText: string[] = [];
    const encoding: number[] = [];
    for (let i = 0; i < text.length; i++) {
        const charInfo = encodeChar(text.charAt(i));
        cleanText.push(charInfo.cleanChar);
        if (charInfo.encoding !== undefined && charInfo.encoding >= 193) 
            encoding.push(...[i, charInfo.encoding]);
        else if (charInfo.encoding !== undefined)
            encoding.push(i);

    }
    return {
        cleanText: cleanText.join(''),
        encoding: encoding
    }
};

export const decodeText = (cleanText: string, encoding: number[]): string => {
    for (let i = 0; i < encoding.length; i++) {
        if (encoding[i + 1] !== undefined && encoding[i + 1] >= 193) {
            cleanText = cleanText.substring(0, encoding[i]) + String.fromCharCode(encoding[i+1]) + cleanText.substring(encoding[i] + 1);
            i++;
        } else {
            cleanText = cleanText.substring(0, encoding[i]) + String.fromCharCode(cleanText.charCodeAt(encoding[i]) - 32) + cleanText.substring(encoding[i] + 1);
        }
    }
    return cleanText;
};