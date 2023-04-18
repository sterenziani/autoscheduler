export const stringInEnum = <E extends Object>(enumObject: E, value?: string) => {
    return Object.values(enumObject).includes(value);
};

export const modelArrayToDtoArray = <M, D>(converter: (model: M) => D, models: M[]): D[] => {
    return models.map((m) => {
        return converter(m);
    });
};
