import React from 'react';
import { Carousel } from 'antd';

interface Banner {
  bannerId: number;
  bannerUrl: string;
}

interface BannerCarouselProps {
  banners: Banner[];
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners = [] }) => {
  if (banners.length === 0) return null;

  return (
    <div className="mb-8">
      <Carousel autoplay>
        {banners.map((item) => (
          <div key={item.bannerId}>
            <img
              src={item.bannerUrl}
              alt="banner"
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
};
