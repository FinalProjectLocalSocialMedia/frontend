import { createContext, useContext, type ReactNode } from 'react'

export interface NavBadgesValue {
  notificationUnread: number
  chatUnread: number
}

const defaultValue: NavBadgesValue = {
  notificationUnread: 0,
  chatUnread: 0,
}

const NavBadgesContext = createContext<NavBadgesValue>(defaultValue)

export function NavBadgesProvider({
  value,
  children,
}: {
  value: NavBadgesValue
  children: ReactNode
}) {
  return <NavBadgesContext.Provider value={value}>{children}</NavBadgesContext.Provider>
}

export function useNavBadges(): NavBadgesValue {
  return useContext(NavBadgesContext)
}
