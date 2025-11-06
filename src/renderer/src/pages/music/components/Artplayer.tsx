import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';

interface ArtPlayerProps {
    src: string;
    poster?: string;
    theme?: string;
    autoSize?: boolean;
}

export const ArtPlayer: React.FC<ArtPlayerProps> = ({
    src,
    poster = '',
    theme = '#7E22CE',
    autoSize = true,
}) => {
    const artRef = useRef<HTMLDivElement | null>(null);
    const artInstance = useRef<Artplayer | null>(null);

    useEffect(() => {
        if (!artRef.current) return;

        const option = {
            container: artRef.current,
            url: src,
            poster,
            theme,
            autoSize,
            flip: true,
            setting: true,
            playbackRate: true,
            aspectRatio: true,
            screenshot: true,
            hotkey: true,
        };

        artInstance.current = new Artplayer(option);

        return () => {
            artInstance.current?.destroy();
            artInstance.current = null;
        };
    }, []);

    // ✅ 监听 src 变化，动态切换视频
    useEffect(() => {
        if (artInstance.current && src) {
            artInstance.current.url = src;
            artInstance.current.poster = poster;
        }
    }, [src, poster]);

    return <div ref={artRef} className="artplayer-app aspect-video" />;
};
