export const stringInEnum = <E>(enumObject: E, value?: string) => {
    return Object.values(enumObject).includes(value);
};
