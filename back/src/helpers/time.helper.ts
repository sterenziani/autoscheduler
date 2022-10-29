export const isValidTime = (time: string): boolean => {
    // hh:mm format
    const timeRegex = /^([0-1]?\d|2[0-3]):([0-5]?\d)$/;
    return !!time.match(timeRegex);
};
