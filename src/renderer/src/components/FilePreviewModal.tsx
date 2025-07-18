import React, { useEffect, useState } from 'react';
import { Button, Modal, Spin } from 'antd';
import { FilePreview } from 'react-file-viewer-ts';
import 'react-file-viewer-ts/styles.css';
import { FileType } from 'react-file-viewer-ts/dist/types/types';
import ReactMarkdown from 'react-markdown';
import { DownloadOutlined } from '@ant-design/icons';

interface FilePreviewModalProps {
    open: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
}

function getFileType(fileName?: string): string {
    if (!fileName) return '';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ext;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ open, onClose, fileUrl, fileName }) => {
    const ext = getFileType(fileName);
    const fileType = ext as FileType;

    const isVideo = /\.(mp4|webm|ogg)$/i.test(fileName || '');
    const isAudio = /\.(mp3|wav|ogg)$/i.test(fileName || '');
    const isMarkdown = /\.md$/i.test(fileName || '');
    const isPpt = /\.(ppt|pptx)$/i.test(fileName || '');
    const isTxt = /\.txt$/i.test(fileName || '');
    const [mdContent, setMdContent] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if ((isMarkdown || isTxt) && open) {
            setLoading(true);
            fetch(fileUrl)
                .then(res => res.arrayBuffer())
                .then(buffer => {
                    const decoder = new TextDecoder('utf-8');
                    const text = decoder.decode(buffer);
                    setMdContent(text);
                    setLoading(false);
                })
                .catch(() => {
                    setMdContent(`加载 ${isMarkdown ? 'Markdown' : '文本'} 文件失败。`);
                    setLoading(false);
                });
        }
    }, [fileUrl, fileName, isMarkdown, isTxt, open]);

    const handleDownload = (url: string) => {
        const suffix = url.slice(url.lastIndexOf('.'));
        const filename = Date.now() + suffix;
        fetch(url)
            .then((response) => response.blob())
            .then((blob) => {
                const blobUrl = URL.createObjectURL(new Blob([blob]));
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                URL.revokeObjectURL(blobUrl);
                link.remove();
            });
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={fileName || '文件预览'}
            width={900}
            height={400}
            centered
            style={{ marginTop: -160 }}
        >
            <div style={{ position: 'absolute', top: 12, right: 60, zIndex: 10, }}>
                <Button style={{ fontSize: 16 }} type="primary" icon={<DownloadOutlined />} onClick={() => handleDownload(fileUrl)}>
                    下载
                </Button>
            </div>

            <div style={{ height: '80vh', overflowY: 'auto' }}>
                {isVideo ? (
                    <video key={fileUrl} controls width="100%" style={{ maxHeight: '80vh' }}>
                        <source src={fileUrl} type={`video/${ext}`} />
                        您的浏览器不支持 video 标签。
                    </video>
                ) : isAudio ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <audio key={fileUrl} controls style={{ width: '100%', maxWidth: '600px' }}>
                            <source src={fileUrl} type={`audio/${ext}`} />
                            您的浏览器不支持 audio 标签。
                        </audio>
                    </div>
                ) : isMarkdown || isTxt ? (
                    loading ? (
                        <Spin />
                    ) : (
                        <ReactMarkdown>{mdContent}</ReactMarkdown>
                    )
                ) : isPpt ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        PPT 文件暂不支持预览。请点击右上角下载查看。
                    </div>
                ) : (
                    <FilePreview type={fileType} file={fileUrl} />
                )}
            </div>
        </Modal>
    );
};

export default FilePreviewModal;
