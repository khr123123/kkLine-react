import React from 'react';
import { addImageParams } from '../../../utils/timeUtil'
interface Artist {
    artistId: number;
    artistName: string;
    avatar: string;
}

interface ArtistCardProps {
    artist: Artist;
    onClick: (id: number) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
    return (
        <div
            className="cursor-pointer group"
            onClick={() => onClick(artist.artistId)}
        >
            <div className="relative rounded-full overflow-hidden mb-2">
                <img
                    src={addImageParams(artist.avatar, 'param=230y230')}
                    alt={artist.artistName}
                    className="w-full aspect-square object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition duration-300 flex items-center justify-center">
                    <h3 className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition duration-300">
                        {artist.artistName}
                    </h3>
                </div>
            </div>
            <p className="text-center text-sm truncate">{artist.artistName}</p>
        </div>
    );
};
