import { create } from "zustand";
import {persist} from 'zustand/middleware'

const useUserstore = create(persist((set) => ({
    currentUser: null,

    signInSuccess: (user) => set({
        currentUser: user
    }),
    signOutSuccess: () => set({
        currentUser: null
    }),
}),
    {
        name: 'user-storage',
    }
))

export default useUserstore