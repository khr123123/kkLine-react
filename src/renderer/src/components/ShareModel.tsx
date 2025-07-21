import { loadAllFriend, loadAllGroup } from '@renderer/api/contactApis'
import {
  Avatar,
  Badge,
  Checkbox,
  Divider,
  List,
  Modal,
  Spin,
  Tabs,
} from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

interface FriendItem {
  id: string
  userName: string
  userAvatar?: string
  headLetter?: string
}

interface GroupItem {
  id: string
  groupName: string
  groupAvatar?: string
}

interface ShareModalProps {
  visible: boolean
  onClose: () => void
  onShare: (selectedIds: string[]) => void
  targetInfo: any
}

const MAX_LETTER_SEGMENT = 3

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  onShare,
  targetInfo,
}) => {
  // 选中id集合（好友 + 群）
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // 好友状态
  const [friendList, setFriendList] = useState<FriendItem[]>([])
  const friendSegmentRef = useRef(1)
  const friendHasMoreRef = useRef(true)
  const friendLoadingRef = useRef(false)
  const friendScrollRef = useRef<HTMLDivElement>(null)

  // 群组状态
  const [groupList, setGroupList] = useState<GroupItem[]>([])
  const groupLoadingRef = useRef(false)
  const groupScrollRef = useRef<HTMLDivElement>(null)

  // 当前 Tab key：'friends' | 'groups'
  const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends')

  // 加载好友（分页）
  const loadFriends = async (segment: number) => {
    if (friendLoadingRef.current || segment > MAX_LETTER_SEGMENT) return
    friendLoadingRef.current = true
    try {
      const res = await loadAllFriend({ letterSegment: segment })
      let data = (res.data as API.FriendItemDTO[]).map(friend => ({
        id: friend.id,
        userName: friend.userName,
        userAvatar: friend.userAvatar,
        headLetter: friend.headLetter,
      }))

      setFriendList((prev: any) => {
        const newList = [...prev, ...data]
        newList.sort((a, b) => {
          const aH = (a.headLetter || '').toUpperCase()
          const bH = (b.headLetter || '').toUpperCase()
          const isAH = aH === '#'
          const isBH = bH === '#'
          if (isAH && !isBH) return 1
          if (!isAH && isBH) return -1
          if (aH === bH) {
            const aName = a.userName || ''
            const bName = b.userName || ''
            return aName.localeCompare(bName)
          }
          return aH.localeCompare(bH)
        })
        return newList
      })

      friendSegmentRef.current = segment + 1
      friendHasMoreRef.current = segment < MAX_LETTER_SEGMENT && data.length > 0
    } catch (error) {
      console.error('加载好友失败', error)
    } finally {
      friendLoadingRef.current = false
    }
  }

  // 加载群组（一次性加载，不分页）
  const loadGroups = async () => {
    if (groupLoadingRef.current) return
    groupLoadingRef.current = true
    try {
      const res = await loadAllGroup()
      const data = (res.data as any).map(item => ({
        id: item.groupVO.id,
        groupName: item.groupVO.groupName,
        groupAvatar: item.groupVO.groupAvatar,
      }))
      setGroupList(data)
    } catch (error) {
      console.error('加载群组失败', error)
    } finally {
      groupLoadingRef.current = false
    }
  }

  // 监听 modal 显示，初始化数据
  useEffect(() => {
    if (visible) {
      setSelectedIds([])
      setFriendList([])
      friendSegmentRef.current = 1
      friendHasMoreRef.current = true
      friendLoadingRef.current = false
      setGroupList([])
      groupLoadingRef.current = false
      if (activeTab === 'friends') {
        loadFriends(1)
      } else {
        loadGroups()
      }
    }
  }, [visible])

  // Tab切换时触发加载对应数据
  useEffect(() => {
    if (!visible) return
    if (activeTab === 'friends' && friendList.length === 0) {
      loadFriends(1)
    } else if (activeTab === 'groups' && groupList.length === 0) {
      loadGroups()
    }
  }, [activeTab])

  // 复用复选框变化
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    )
  }

  // 确认分享
  const handleOk = () => {
    onShare(selectedIds)
    setSelectedIds([])
    onClose()
  }

  // 取消关闭
  const handleCancel = () => {
    setSelectedIds([])
    onClose()
  }

  // 渲染标题栏，显示已选数量
  const renderTitle = () => {
    if (!targetInfo) return '分享给：'
    const name = targetInfo.groupName || targetInfo.userName || ''
    const avatar = targetInfo.groupAvatar || targetInfo.userAvatar || ''
    const label = targetInfo.groupName ? '群组' : '好友'

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        将{label}{' '}
        <Avatar size="small" src={avatar} style={{ margin: '0 4px' }} />
        <span style={{ color: 'gray', marginRight: 4 }}>{name}</span>
        分享给：已选&nbsp;<Badge count={selectedIds.length} showZero />
      </span>
    )
  }

  // 根据 Tab key，渲染不同列表
  const renderList = () => {
    if (activeTab === 'friends') {
      return (
        <div
          id="share-scroll-friends"
          ref={friendScrollRef}
          style={{ maxHeight: 300, overflow: 'auto' }}
        >
          <InfiniteScroll
            dataLength={friendList.length}
            next={() => loadFriends(friendSegmentRef.current)}
            hasMore={friendHasMoreRef.current}
            loader={
              <div style={{ textAlign: 'center', padding: 8 }}>
                <Spin size="small" />
              </div>
            }
            endMessage={<Divider plain>{friendList.length} 个好友</Divider>}
            scrollableTarget="share-scroll-friends"
            style={{ overflow: 'hidden' }}
          >
            <List
              dataSource={friendList}
              renderItem={item => (
                <List.Item key={item.id}>
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onChange={e =>
                      handleCheckboxChange(item.id, e.target.checked)
                    }
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Avatar src={item.userAvatar} style={{ marginRight: 8 }} />
                      {item.userName}
                    </span>
                  </Checkbox>
                </List.Item>
              )}
            />
          </InfiniteScroll>
        </div>
      )
    } else {
      return (
        <div
          id="share-scroll-groups"
          ref={groupScrollRef}
          style={{ maxHeight: 300, overflow: 'auto' }}
        >
          {/* 群组不分页，直接用 List */}
          <List
            dataSource={groupList}
            renderItem={item => (
              <List.Item key={item.id}>
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onChange={e =>
                    handleCheckboxChange(item.id, e.target.checked)
                  }
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Avatar src={item.groupAvatar} style={{ marginRight: 8 }} />
                    {item.groupName}
                  </span>
                </Checkbox>
              </List.Item>
            )}
          />
          <Divider plain>{groupList.length} 个群组</Divider>
        </div>
      )
    }
  }

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      title={renderTitle()}
      okText="分享"
      cancelText="取消"
      width={400}
      style={{ position: 'relative' }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as 'friends' | 'groups')}
        centered
        items={[
          { label: '好友', key: 'friends' },
          { label: '群组', key: 'groups' },
        ]}
      />

      {renderList()}
    </Modal>
  )
}

export default ShareModal
