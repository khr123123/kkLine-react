import React from 'react';
import { motion } from 'framer-motion';
import { Typography } from 'antd';

const { Title } = Typography;

interface AnimatedTitleProps {
  text: string;
  delay?: number;
}

const AnimatedTitle: React.FC<AnimatedTitleProps> = ({ text, delay = 0 }) => {
  const letters = text.split('');

  return (
    <Title level={2} style={{ display: 'flex', gap: 4 }}>
      {letters.map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: delay + index * 0.05,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </Title>
  );
};

export default AnimatedTitle;
