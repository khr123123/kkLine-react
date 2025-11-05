import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface SearchBarProps {
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    onSearch: () => void;
    style?: React.CSSProperties;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    placeholder = '搜索...',
    onChange,
    onSearch,
    style,
}) => {
    return (
        <Input
            placeholder={placeholder}
            prefix={<SearchOutlined />}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPressEnter={onSearch}
            style={style}
        />
    );
};
