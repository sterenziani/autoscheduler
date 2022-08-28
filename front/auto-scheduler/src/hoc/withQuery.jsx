import React from 'react';
import { useLocation } from 'react-router-dom';

const useQuery = () => new URLSearchParams(useLocation().search);

const withQuery = (WrappedComponent) => {
    return (props) => {
        const query = useQuery();
        return <WrappedComponent query={query} {...props} />;
    };
};

export default withQuery;
