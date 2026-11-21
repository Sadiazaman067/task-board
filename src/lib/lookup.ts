import { createContext, useContext } from 'react'
import type { Label, Member } from '../types'

// lets any card look up a member/label by id without passing props through every layer
export interface Lookup {
  members: Map<string, Member>
  labels: Map<string, Label>
}

export const LookupContext = createContext<Lookup>({ members: new Map(), labels: new Map() })
export const useLookup = () => useContext(LookupContext)
