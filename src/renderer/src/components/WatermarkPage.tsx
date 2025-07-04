import React from 'react';
import { Watermark } from 'antd';
import logo from "../../../../resources/chat.png"

const WatermarkPage: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <Watermark content={"KHR"} style={{ width: '100%', height: '100%' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img src={logo} width={150} />
        </div>
      </Watermark>
    </div>
  );
};

export default WatermarkPage;
