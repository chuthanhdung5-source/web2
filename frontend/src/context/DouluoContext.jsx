import { createContext, useContext, useState, useEffect } from 'react'
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

const STORAGE_KEY = 'douluo_mode_state'

const defaultState = {
  enabled: true, // Mặc định bật chế độ vui nhộn
  level: 95, // Mặc định là Phong Hào Đấu La cho ngầu
  diamonds: 888888, // 888.888 Kim Cương
  customTitle: 'Học Hộ Đấu La',
  vipTier: 10,
}

const DouluoContext = createContext(null)

export function DouluoProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return { ...defaultState, ...JSON.parse(saved) }
    } catch {
      // fallback default
    }
    return defaultState
  })

  // Modal controls
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isRechargeOpen, setIsRechargeOpen] = useState(false)

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  const realm = getRealmInfo(state.level)

  // Bật/Tắt chế độ
  const toggleEnabled = () => {
    setState(prev => {
      const next = !prev.enabled
      toast(next ? '🔮 Đã bật Chế Độ Đấu La Đại Lục!' : '🛡️ Đã tắt Chế Độ Đấu La Đại Lục (Về chế độ thường)', {
        icon: next ? '⚡' : '🏢'
      })
      return { ...prev, enabled: next }
    })
  }

  // Tiêu hao kim cương hài hước khi thực hiện hành động
  const spendDiamonds = (amount, actionName = 'Thao tác') => {
    if (!state.enabled) return true

    let currentDiamonds = state.diamonds
    if (currentDiamonds < amount) {
      // Tự động cấp vốn Đường Môn nếu hết kim cương
      currentDiamonds += 50000
      toast.success(`🎁 Bạn hết Kim Cương! Đường Môn bí mật trợ cấp +50.000 💎 để bạn tiếp tục xưng bá!`, {
        duration: 4000
      })
    }

    const nextDiamonds = Math.max(0, currentDiamonds - amount)
    setState(prev => ({ ...prev, diamonds: nextDiamonds }))

    toast(`💎 -${amount.toLocaleString()} Kim Cương cho [${actionName}]. Chúc ${state.customTitle || realm.name} uy chấn bốn phương!`, {
      icon: '✨',
      style: {
        borderRadius: '10px',
        background: '#1e1e24',
        color: '#38bdf8',
        border: '1px solid rgba(56, 189, 248, 0.3)',
      },
      duration: 3500
    })

    return true
  }

  // Nạp VIP giả lập
  const recharge = (amount, tierName = 'VIP') => {
    setState(prev => {
      const nextDiamonds = prev.diamonds + amount
      // Nếu nạp gói siêu to thì tự thăng cấp
      let nextLevel = prev.level
      if (amount >= 100000000 && nextLevel < 100) nextLevel = 100
      else if (amount >= 10000000 && nextLevel < 95) nextLevel = 95
      else if (amount >= 1000000 && nextLevel < 85) nextLevel = 85

      return {
        ...prev,
        diamonds: nextDiamonds,
        level: nextLevel,
        vipTier: Math.min(12, prev.vipTier + 1)
      }
    })

    toast.success(`🎉 Nạp thành công [${tierName}]! +${amount.toLocaleString()} 💎 Kim Cương đã vào túi!`, {
      duration: 5000,
      icon: '💎'
    })
  }

  // Tự phong cảnh giới
  const selfPromote = ({ level, diamonds, customTitle }) => {
    const newLvl = Math.max(1, Math.min(999, Number(level) || 1))
    const newDia = Math.max(0, Number(diamonds) || 0)
    const newTitle = (customTitle || '').trim() || getRealmInfo(newLvl).name

    setState(prev => ({
      ...prev,
      level: newLvl,
      diamonds: newDia,
      customTitle: newTitle
    }))

    const newRealm = getRealmInfo(newLvl)
    toast.success(`🔱 Sắc phong thành công! Bạn hiện là [${newTitle}] - Cấp ${newLvl} (${newRealm.name})!`, {
      duration: 5000,
      icon: newRealm.icon
    })
  }

  return (
    <DouluoContext.Provider
      value={{
        ...state,
        realm,
        toggleEnabled,
        spendDiamonds,
        recharge,
        selfPromote,
        isSettingsOpen,
        setIsSettingsOpen,
        isRechargeOpen,
        setIsRechargeOpen,
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
