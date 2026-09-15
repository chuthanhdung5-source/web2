import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const AVAILABLE_SKINS = [
  {
    id: 'skin-default',
    name: 'Mặc Định U Tối (Vũ Trụ Thần Bí)',
    privilegeId: null, // Free
    primaryColor: '#6366f1',
    bgGradient: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
    description: 'Phong cách huyền bí nguyên bản Đấu La Tông Môn',
  },
  {
    id: 'skin-huyen-ao',
    name: 'Lam Ngân Thần Khí (Huyền Ảo Lam)',
    privilegeId: 'skin_huyen_ao',
    primaryColor: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, #031e2e, #083344)',
    description: 'Ánh sáng Lam Ngân Hoàng thức tỉnh, tươi mát thanh nhã',
  },
  {
    id: 'skin-hoang-gia',
    name: 'Hoàng Gia Hắc Kim (Vũ Hồn Điện)',
    privilegeId: 'skin_hoang_gia',
    primaryColor: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #18150c, #261b04)',
    description: 'Khí chất bậc đế vương, ánh vàng hoàng kim vương giả',
  },
  {
    id: 'skin-than-thanh',
    name: 'Hải Thần Quang Diệu (Bạch Kim)',
    privilegeId: 'skin_than_thanh',
    primaryColor: '#ec4899',
    bgGradient: 'linear-gradient(135deg, #1f1124, #3b0764)',
    description: 'Thần cách giáng lâm, hào quang tím hồng rực rỡ',
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
