import React from "react";
import { Spin } from "antd";

interface GlobalLoadingProps {
    loading: boolean;
}

const GlobalLoading: React.FC<GlobalLoadingProps> = ({ loading }) => {
    if (!loading) return null;
    const contentStyle: React.CSSProperties = {
        padding: 50,
        background: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 4,
    };
    const content = <div style={contentStyle} />;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(230,244,255,0.5)",
                zIndex: 9999,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Spin size="large" tip="加载中..." >
                {content}
            </Spin>
        </div>
    );
};

export default GlobalLoading;
