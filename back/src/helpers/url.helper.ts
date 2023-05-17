export const queryParamsStringBuilder = (params: { [param: string]: string | undefined }): string => {
    let queryParamString = '';
    for (const param of Object.keys(params)) {
        queryParamString = `${queryParamString}${params[param] ? `&${param}=${params[param]}` : ''}`;
    }
    return queryParamString.replace('&', '?');
};
