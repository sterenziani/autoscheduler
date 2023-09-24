export const removeSpecialCharacters = (text: string | undefined): string => {
    if(!text)
        return ""
    let finalText: string = text
    finalText = finalText.replace("Á", "A");
    finalText = finalText.replace("É", "E");
    finalText = finalText.replace("Í", "I");
    finalText = finalText.replace("Ó", "O");
    finalText = finalText.replace("Ú", "U");

    finalText = finalText.replace("á", "a");
    finalText = finalText.replace("é", "e");
    finalText = finalText.replace("í", "i");
    finalText = finalText.replace("ó", "o");
    finalText = finalText.replace("ú", "u");

    return finalText;
};

export const cleanText = (text: string): string => {
    return removeSpecialCharacters(text.toLowerCase());
};

export const cleanMaybeText = (text?: string): string | undefined => {
    if (text === undefined) return undefined;
    return cleanText(text);
}

export const booleanToString = (maybeBoolean?: boolean): string | undefined => {
    if (maybeBoolean === undefined || maybeBoolean === null) return undefined;
    return maybeBoolean ? 'true' : 'false';
};