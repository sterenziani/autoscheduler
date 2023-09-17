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
