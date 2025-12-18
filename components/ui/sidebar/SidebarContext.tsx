import * as React from "react"
import type { SidebarContextProps } from "./types"

export const SidebarContext = React.createContext<SidebarContextProps | null>(null)
