import React from 'react';
import AsyncSelect from 'react-select/async'
import { components } from "react-select";

const FormAsyncSelect = (props) => {

    // Testers previously complained about not being able to select the text content of AsyncSelect to overwrite it
    // This hides the selected option while the menu is open
    const SingleValue = (props) => {
        const { children, ...rest } = props;
        const { selectProps } = props;
        if (selectProps.menuIsOpen) return <React.Fragment></React.Fragment>;
            return <components.SingleValue {...rest}>{children}</components.SingleValue>;
    }

    return (
        <AsyncSelect components={{ SingleValue }} {...props}/>
    )
};

export default FormAsyncSelect;
