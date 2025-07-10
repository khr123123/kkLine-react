// AvatarUploader.tsx
import { PlusOutlined } from '@ant-design/icons'
import type { GetProp, UploadProps } from 'antd'
import { Avatar, message, Progress, Upload } from 'antd'
import React, { useEffect, useState } from 'react'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

interface AvatarUploaderProps {
  token: string
  initialUrl?: string
  onSuccess: (url: string) => void
}
const PicUploader: React.FC<AvatarUploaderProps> = ({ token, initialUrl, onSuccess }) => {
  const [imageUrl, setImageUrl] = useState<string>(initialUrl || '')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const beforeUpload = (file: FileType) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片！')
      return false
    }
    const isLt5MB = file.size / 1024 / 1024 < 5
    if (!isLt5MB) {
      message.error('图片必须小于 5MB！')
      return false
    }
    setLoading(true)
    return true
  }

  useEffect(() => {
    const handler = async (_event: any, data: any) => {
      setProgress(data.percent)
      if (data.status === 'success' && data.fileUrl) {
        setImageUrl(data.fileUrl)
        setLoading(false)
        onSuccess(data.fileUrl)
      }
      if (data.status === 'failed') {
        setLoading(false)
        message.error('头像上传失败')
      }
    }
    window.electron.ipcRenderer.on('upload-progress', handler)
    return () => {
      window.electron.ipcRenderer.removeAllListeners('upload-progress')
    }
  }, [onSuccess])

  return (
    <Upload
      name="file"
      listType="picture-card"
      className="avatar-uploader"
      showUploadList={false}
      action="http://127.0.0.1:8080/api/file/uploadFileWithProgressListener"
      headers={{ Authorization: token }}
      beforeUpload={beforeUpload}
      data={{ biz: 'picture' }}
    >
      {imageUrl ? (
        <Avatar src={imageUrl} size={100} alt="avatar" shape="square" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {loading ? (
            <Progress
              type="circle"
              trailColor="#e6f4ff"
              percent={progress}
              strokeWidth={20}
              size={36}
            />
          ) : (
            <>
              <PlusOutlined />
              <div style={{ marginTop: 4, fontSize: 12 }}>上传</div>
            </>
          )}
        </div>
      )}
    </Upload>
  )
}

export default PicUploader
