import React, { useEffect, useState, useRef } from "react";
import { Avatar, Tooltip, message } from "antd";
import { UserOutlined } from "@ant-design/icons";

interface GroupMember {
    name: string;
    avatar?: string;
    isOwner?: boolean;
}

const AVATAR_SIZE = 48;
const GAP = 10;
const ROWS = 2;

const MembersGrid: React.FC<{ members: GroupMember[] }> = ({ members }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(8); // 默认8列

    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const colWidth = AVATAR_SIZE + GAP;
            const cols = Math.floor(width / colWidth);
            setColumns(cols > 0 ? cols : 1);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const maxShowCount = columns * ROWS;
    const showMore = members.length > maxShowCount;

    return (
        <div
            ref={containerRef}
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, ${AVATAR_SIZE}px)`,
                gap: GAP,
                maxHeight: ROWS * AVATAR_SIZE + GAP * (ROWS - 1),
            }}
        >
            {members.slice(0, maxShowCount - (showMore ? 1 : 0)).map((member, idx) => (
                <div
                    key={idx}
                    style={{ textAlign: "center", position: "relative", height: AVATAR_SIZE }}
                >
                    {member.isOwner && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                backgroundColor: "rgba(253, 75, 15, 0.85)",
                                color: "#fff",
                                borderRadius: 4,
                                padding: "0 6px",
                                fontSize: 12,
                                fontWeight: "bold",
                                zIndex: 10,
                                pointerEvents: "none",
                                whiteSpace: "nowrap",
                            }}
                        >
                            群主
                        </div>
                    )}
                    <Tooltip title={member.name}>
                        <Avatar
                            size={AVATAR_SIZE}
                            src={member.avatar}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: "#ccc" }}
                        >
                            {!member.avatar && member.name.charAt(0)}
                        </Avatar>
                    </Tooltip>
                </div>
            ))}

            {showMore && (
                <div
                    style={{ textAlign: "center", cursor: "pointer", userSelect: "none", height: AVATAR_SIZE }}
                    onClick={() => {
                        message.info(`共${members.length}名成员，展示更多成员...`);
                    }}
                >
                    <Avatar
                        size={AVATAR_SIZE}
                        style={{ backgroundColor: "#999", color: "#fff", fontWeight: "bold" }}
                    >
                        +{members.length - (maxShowCount - 1)}
                    </Avatar>
                </div>
            )}
        </div>
    );
};

export default MembersGrid;
