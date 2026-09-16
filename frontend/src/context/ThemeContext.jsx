import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const AVAILABLE_SKINS = [
  {
    id: 'skin-default',
    name: 'Đen Huyền Bí',
    privilegeId: null,
    price: 0,
    icon: '🖤',
    primaryColor: '#7c6af5',
    bg: '#0c0d16',
    surface: '#181a2b',
    textColor: '#f8fafc',
    description: 'Chế độ tối sâu thẳm, sắc nét, tương phản cao, dễ nhìn',
  },
  {
    id: 'skin-light',
    name: 'Trắng Thanh Khiết',
    privilegeId: 'skin_light',
    price: 500,
    icon: '🤍',
    primaryColor: '#4f46e5',
    bg: '#f1f5f9',
    surface: '#ffffff',
    textColor: '#0f172a',
    description: 'Chế độ nền sáng ngọc ngà, chữ đen đậm siêu rõ nét và thanh nhã',
  },
  {
    id: 'skin-huyen-ao',
    name: 'Lam Ngân Thần Khí',
    privilegeId: 'skin_huyen_ao',
    price: 1000,
    icon: '🌿',
    primaryColor: '#06b6d4',
    bg: '#04121d',
    surface: '#0a2538',
    textColor: '#ecfeff',
    description: 'Sắc xanh Lam Ngân Hoàng thức tỉnh, thanh tao và dịu mắt',
  },
  {
    id: 'skin-hoang-gia',
    name: 'Hoàng Gia Hắc Kim',
    privilegeId: 'skin_hoang_gia',
    price: 1000,
    icon: '👑',
    primaryColor: '#f59e0b',
    bg: '#140f05',
    surface: '#281e0a',
    textColor: '#fffbeb',
    description: 'Khí chất hoàng tộc đế vương, ánh vàng vương giả quý phái',
  },
  {
    id: 'skin-than-thanh',
    name: 'Hải Thần Quang Diệu',
    privilegeId: 'skin_than_thanh',
    price: 1000,
    icon: '✨',
    primaryColor: '#ec4899',
    bg: '#150824',
    surface: '#2b1147',
    textColor: '#fdf2f8',
    description: 'Thần cách giáng lâm, hào quang tím hồng rực rỡ huyền thoại',
  },
]

export const ThemeProvider = ({ children }) => {
  const [activeSkin, setActiveSkin] = useState(() => {
    return localStorage.getItem('douluo_active_theme') || 'skin-default'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeSkin)
    localStorage.setItem('douluo_active_theme', activeSkin)
  }, [activeSkin])

  const setSkin = (skinId) => {
    setActiveSkin(skinId)
  }

  return (
    <ThemeContext.Provider value={{ activeSkin, setSkin, skins: AVAILABLE_SKINS }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
