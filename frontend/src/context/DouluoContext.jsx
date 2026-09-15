import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { douluoAPI } from '../api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

// 12 Cảnh giới Hồn Sư chuẩn Đấu La Đại Lục
export const DOULUO_REALMS = [
  { minLevel: 1, maxLevel: 10, name: 'Hồn Sĩ', ring: 'ring-white', badge: 'badge-douluo-white', icon: '🥋', ringName: 'Hồn Hoàn 10 năm (Trắng)' },
  { minLevel: 11, maxLevel: 20, name: 'Hồn Sư', ring: 'ring-yellow', badge: 'badge-douluo-yellow', icon: '⚡', ringName: 'Hồn Hoàn 100 năm (Vàng)' },
  { minLevel: 21, maxLevel: 30, name: 'Đại Hồn Sư', ring: 'ring-yellow', badge: 'badge-douluo-yellow', icon: '⚔️', ringName: 'Hồn Hoàn 100 năm (Vàng)' },
  { minLevel: 31, maxLevel: 40, name: 'Hồn Tôn', ring: 'ring-purple', badge: 'badge-douluo-purple', icon: '🛡️', ringName: 'Hồn Hoàn 1.000 năm (Tím)' },
  { minLevel: 41, maxLevel: 50, name: 'Hồn Tông', ring: 'ring-purple', badge: 'badge-douluo-purple', icon: '🔮', ringName: 'Hồn Hoàn 1.000 năm (Tím)' },
  { minLevel: 51, maxLevel: 60, name: 'Hồn Vương', ring: 'ring-black', badge: 'badge-douluo-black', icon: '👑', ringName: 'Hồn Hoàn 10.000 năm (Đen)' },
  { minLevel: 61, maxLevel: 70, name: 'Hồn Đế', ring: 'ring-black', badge: 'badge-douluo-black', icon: '🐉', ringName: 'Hồn Hoàn 10.000 năm (Đen)' },
  { minLevel: 71, maxLevel: 80, name: 'Hồn Thánh', ring: 'ring-black', badge: 'badge-douluo-black', icon: '🌟', ringName: 'Hồn Hoàn 10.000 năm (Đen)' },
  { minLevel: 81, maxLevel: 90, name: 'Hồn Đấu La', ring: 'ring-black', badge: 'badge-douluo-black', icon: '🌪️', ringName: 'Hồn Hoàn 10.000 năm (Đen)' },
  { minLevel: 91, maxLevel: 98, name: 'Phong Hào Đấu La', ring: 'ring-red', badge: 'badge-douluo-red', icon: '🌌', ringName: 'Hồn Hoàn 100.000 năm (Đỏ)' },
  { minLevel: 99, maxLevel: 99, name: 'Cực Hạn Đấu La', ring: 'ring-red', badge: 'badge-douluo-red', icon: '🪐', ringName: 'Hồn Hoàn Thần Khí (Đỏ Kim)' },
  { minLevel: 100, maxLevel: 999, name: 'Tu La Thần Vương', ring: 'ring-gold', badge: 'badge-douluo-gold', icon: '🔱', ringName: 'Hồn Hoàn Triệu Năm (Hoàng Kim)' },
]

export const getRealmInfo = (level) => {
  const lvl = Math.max(1, Number(level) || 1)
  const found = DOULUO_REALMS.find(r => lvl >= r.minLevel && lvl <= r.maxLevel)
  return found || DOULUO_REALMS[DOULUO_REALMS.length - 1]
}

export const SHOP_ITEMS = [
  {
    id: 'remember_me',
    name: 'Ghi Nhớ Tâm Pháp (Lưu Mật Khẩu)',
    price: 500,
    icon: '🔐',
    description: 'Tự động ghi nhớ tài khoản và mật khẩu tại Tiên Giới Cổng, không cần gõ lại mỗi lần đăng nhập.',
    category: 'convenience',
    permanent: true,
  },
  {
    id: 'skin_huyen_ao',
    name: 'Giao Diện Lam Ngân Thần Khí',
    price: 2000,
    icon: '🌿',
    description: 'Khai mở skin giao diện Lam Ngân Thảo sắc xanh ngọc huyền ảo, dịu mát.',
    category: 'skin',
    permanent: true,
    skinId: 'skin-huyen-ao',
  },
  {
    id: 'skin_hoang_gia',
    name: 'Giao Diện Hoàng Gia Hắc Kim',
    price: 2000,
    icon: '👑',
    description: 'Khai mở skin Vũ Hồn Điện dát vàng hoàng kim vương giả quyền uy.',
    category: 'skin',
    permanent: true,
    skinId: 'skin-hoang-gia',
  },
  {
    id: 'skin_than_thanh',
    name: 'Giao Diện Hải Thần Quang Diệu',
    price: 2000,
    icon: '✨',
    description: 'Khai mở skin Thần Thánh Tím Tinh Hà rực sáng huyền thoại.',
    category: 'skin',
    permanent: true,
    skinId: 'skin-than-thanh',
  },
  {
    id: 'session_extend_2h',
    name: 'Gia Hạn 120 Phút Phiên Tu Luyện',
    price: 1000,
    icon: '⏳',
    description: 'Cộng thêm 2 giờ làm việc tập trung mà không lo hết phiên khảo thí.',
    category: 'session',
    permanent: false,
  },
  {
    id: 'vip_badge',
    name: 'Huy Hiệu Chí Tôn Đấu La (VIP)',
    price: 3000,
    icon: '🔱',
    description: 'Khai mở danh hiệu Đấu La Chí Tôn, viền hào quang vàng kim và tăng tốc độ tu vi.',
    category: 'vip',
    permanent: true,
  },
]

const DouluoContext = createContext(null)

export function DouluoProvider({ children }) {
  const { user } = useAuth()

  const [enabled, setEnabled] = useState(true)
  const [level, setLevel] = useState(1)
  const [realmName, setRealmName] = useState('Hồn Sĩ')
  const [exp, setExp] = useState(0)
  const [expNeeded, setExpNeeded] = useState(60)
  const [diamonds, setDiamonds] = useState(88888)
  const [totalCultivateSeconds, setTotalCultivateSeconds] = useState(0)
  const [customTitle, setCustomTitle] = useState('')
  const [vipTier, setVipTier] = useState(0)
  const [purchasedItems, setPurchasedItems] = useState([])
  const [sessionExpiry, setSessionExpiry] = useState(null)
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(7200) // Mặc định 2 tiếng
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [loading, setLoading] = useState(true)

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isRechargeOpen, setIsRechargeOpen] = useState(false)
  const [isCultivationOpen, setIsCultivationOpen] = useState(false)
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false)
  const [isMineOpen, setIsMineOpen] = useState(false)
  const [isShopOpen, setIsShopOpen] = useState(false)

  // Unsynced seconds buffer for heartbeat
  const unsyncedSecondsRef = useRef(0)

  // Load status from Backend API
  const loadStatus = async () => {
    if (!user) return
    try {
      const res = await douluoAPI.getMe()
      const data = res.data
      setLevel(data.level)
      setRealmName(data.realm_name)
      setExp(data.exp)
      setExpNeeded(data.exp_needed)
      setDiamonds(data.diamonds)
      setTotalCultivateSeconds(data.total_cultivate_seconds)
      setCustomTitle(data.custom_title || '')
      setVipTier(data.vip_tier)
      setEnabled(data.is_enabled)
      
      try {
        const items = typeof data.purchased_items === 'string' ? JSON.parse(data.purchased_items || '[]') : (data.purchased_items || [])
        setPurchasedItems(items)
      } catch {
        setPurchasedItems([])
      }
      
      if (data.session_expiry) {
        setSessionExpiry(data.session_expiry)
      }
    } catch (e) {
      console.error('Lỗi tải trạng thái Đấu La:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [user])

  // Real-time cultivation timer: Cứ mỗi 1s chạy 1 tick
  useEffect(() => {
    if (!user || !enabled) return

    const interval = setInterval(() => {
      const multiplier = 1 + (vipTier * 0.5)
      const earned = Math.max(1, Math.round(1 * multiplier))

      setExp(prev => prev + earned)
      setTotalCultivateSeconds(prev => prev + 1)
      unsyncedSecondsRef.current += 1

      // Cứ 30 giây sync 1 lần lên server
      if (unsyncedSecondsRef.current >= 30) {
        const secsToSync = unsyncedSecondsRef.current
        unsyncedSecondsRef.current = 0
        douluoAPI.cultivateHeartbeat(secsToSync).catch(err => {
          console.error('Lỗi sync heartbeat tu luyện:', err)
        })
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      // Sync nốt số giây còn tồn đọng khi unmount
      if (unsyncedSecondsRef.current > 0) {
        douluoAPI.cultivateHeartbeat(unsyncedSecondsRef.current).catch(() => {})
        unsyncedSecondsRef.current = 0
      }
    }
  }, [user, enabled, vipTier])

  const realm = getRealmInfo(level)

  // Bật/Tắt chế độ
  const toggleEnabled = async () => {
    try {
      const res = await douluoAPI.toggleMode()
      const next = res.data.is_enabled
      setEnabled(next)
      toast(next ? '🔮 Đã kích hoạt Chế Độ Đấu La Đại Lục!' : '🛡️ Đã ẩn Chế Độ Đấu La Đại Lục', {
        icon: next ? '⚡' : '🏢'
      })
    } catch {
      setEnabled(prev => !prev)
    }
  }

  // Đột phá cảnh giới
  const breakthrough = async () => {
    try {
      const res = await douluoAPI.breakthrough()
      const data = res.data
      setLevel(data.new_level)
      setRealmName(data.new_realm)
      setExp(data.exp)
      setExpNeeded(data.exp_needed)
      // Cập nhật lại kim cương được thưởng
      loadStatus()
      toast.success(data.message, { duration: 5000, icon: '🎉' })
      return true
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Chưa đủ hồn lực để đột phá!')
      return false
    }
  }

  // Nạp VIP 0đ mua kim cương
  const recharge = async (tier, diamondsAmount, packName) => {
    try {
      const res = await douluoAPI.buyDiamonds(tier, diamondsAmount, packName)
      setDiamonds(res.data.diamonds)
      setVipTier(res.data.vip_tier)
      toast.success(res.data.message, { duration: 5000, icon: '💎' })
      setIsRechargeOpen(false)
      loadStatus()
    } catch (err) {
      toast.error('Có lỗi xảy ra khi nạp VIP')
    }
  }

  // Trừ kim cương khi thao tác
  const spendDiamonds = (amount, actionName = 'Thao tác') => {
    if (!enabled) return true

    // Optimistic update
    let currentDiamonds = diamonds
    if (currentDiamonds < amount) {
      currentDiamonds += 50000
      toast.success('🎁 Hết Kim Cương! Đường Môn bí mật viện trợ +50.000 💎!', { duration: 4000 })
    }
    const nextDiamonds = Math.max(0, currentDiamonds - amount)
    setDiamonds(nextDiamonds)

    toast(`💎 -${amount.toLocaleString()} 💎 cho [${actionName}]. Chúc ${customTitle || realm.name} vạn thọ vô cương!`, {
      icon: '✨',
      style: {
        borderRadius: '10px',
        background: '#1e1e24',
        color: '#38bdf8',
        border: '1px solid rgba(56, 189, 248, 0.3)',
      },
      duration: 3000
    })

    // Gọi API trừ ngầm
    douluoAPI.spendDiamonds(amount, actionName).catch(() => {})
    return true
  }

  // Khởi tạo và đếm ngược phiên làm việc (2 tiếng mặc định)
  useEffect(() => {
    if (!user) return

    let sessionEnd = Number(sessionStorage.getItem('douluo_session_end'))
    if (!sessionEnd || isNaN(sessionEnd) || sessionEnd < Date.now()) {
      sessionEnd = Date.now() + 7200 * 1000 // 2 tiếng
      sessionStorage.setItem('douluo_session_end', String(sessionEnd))
    }

    const timer = setInterval(() => {
      const now = Date.now()
      const diff = Math.max(0, Math.floor((sessionEnd - now) / 1000))
      setSessionSecondsLeft(diff)
      if (diff <= 0) {
        setIsSessionExpired(true)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [user])

  // Kiểm tra đã sở hữu đặc quyền chưa
  const hasPrivilege = (itemId) => {
    return purchasedItems.includes(itemId)
  }

  // Mua đặc quyền / Skin / VIP
  const purchasePrivilege = async (item) => {
    try {
      const res = await douluoAPI.purchasePrivilege(item.id, item.name, item.price)
      const data = res.data
      setDiamonds(data.diamonds)
      if (data.vip_tier !== undefined) setVipTier(data.vip_tier)
      if (data.custom_title) setCustomTitle(data.custom_title)

      try {
        const items = typeof data.purchased_items === 'string' ? JSON.parse(data.purchased_items) : data.purchased_items
        setPurchasedItems(items)
      } catch {
        setPurchasedItems(prev => prev.includes(item.id) ? prev : [...prev, item.id])
      }

      // Nếu mua gói gia hạn phiên làm việc
      if (item.id === 'session_extend_2h') {
        const currentEnd = Number(sessionStorage.getItem('douluo_session_end')) || Date.now()
        const newEnd = Math.max(Date.now(), currentEnd) + 7200 * 1000
        sessionStorage.setItem('douluo_session_end', String(newEnd))
        setIsSessionExpired(false)
      }

      toast.success(data.message || `🎉 Mua thành công ${item.name}!`, { icon: '💎', duration: 4000 })
      return true
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi khi giao dịch trong Cửa Hàng!')
      return false
    }
  }

  // Gia hạn phiên làm việc
  const extendSession = async (minutes = 120, price = 1000) => {
    try {
      const res = await douluoAPI.extendSession(minutes, price)
      const data = res.data
      setDiamonds(data.diamonds)

      const currentEnd = Number(sessionStorage.getItem('douluo_session_end')) || Date.now()
      const newEnd = Math.max(Date.now(), currentEnd) + minutes * 60 * 1000
      sessionStorage.setItem('douluo_session_end', String(newEnd))
      setIsSessionExpired(false)

      toast.success(data.message || `⏳ Đã gia hạn thành công thêm ${minutes} phút!`, { icon: '⌛' })
      return true
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Không thể gia hạn phiên làm việc!')
      return false
    }
  }

  const dismissSessionWarning = () => {
    setIsSessionExpired(false)
  }

  // Member gõ mỏ đào kim cương
  const mineDiamonds = (clicks = 1) => {
    const earned = clicks * 10
    setDiamonds(prev => prev + earned)
    douluoAPI.mineDiamonds(clicks).catch(err => {
      console.error('Lỗi mine diamonds:', err)
    })
    return earned
  }

  // Admin sắc phong cảnh giới (1 người hoặc ALL)
  const adminPromote = async (data) => {
    try {
      const res = await douluoAPI.adminPromote(data)
      toast.success(res.data.message, { duration: 5000, icon: '🔱' })
      loadStatus()
      return true
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi khi sắc phong')
      return false
    }
  }

  return (
    <DouluoContext.Provider
      value={{
        enabled,
        level,
        realmName,
        exp,
        expNeeded,
        diamonds,
        totalCultivateSeconds,
        customTitle,
        vipTier,
        realm,
        loading,
        purchasedItems,
        sessionExpiry,
        sessionSecondsLeft,
        isSessionExpired,
        hasPrivilege,
        purchasePrivilege,
        extendSession,
        dismissSessionWarning,
        toggleEnabled,
        breakthrough,
        recharge,
        mineDiamonds,
        spendDiamonds,
        adminPromote,
        loadStatus,
        isSettingsOpen,
        setIsSettingsOpen,
        isRechargeOpen,
        setIsRechargeOpen,
        isCultivationOpen,
        setIsCultivationOpen,
        isLeaderboardOpen,
        setIsLeaderboardOpen,
        isMineOpen,
        setIsMineOpen,
        isShopOpen,
        setIsShopOpen,
      }}
    >
      {children}
    </DouluoContext.Provider>
  )
}

export const useDouluo = () => {
  const ctx = useContext(DouluoContext)
  if (!ctx) throw new Error('useDouluo must be used within DouluoProvider')
  return ctx
}
