export const stringInEnum = <E extends Object>(enumObject: E, value?: string) => {
    return Object.values(enumObject).includes(value);
};
