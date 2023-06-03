export const queryParamsStringBuilder = (baseUrl: string, params: { [param: string]: string | undefined }): string => {
    let queryParamString = '';
    for (const param of Object.keys(params)) {
        queryParamString = `${queryParamString}${
            params[param] ? `&${param}=${encodeURIComponent(params[param] ?? '')}` : ''
        }`;
    }
    return `${baseUrl}/${queryParamString.replace('&', '?')}`;
};
