import { defineStore } from 'pinia'

export const useCounterStore = defineStore({
  id: 'counter',
  state: () => ({
    counter: 0,
    title: ''
  }),
  getters: {
    doubleCount: (state) => state.counter * 2
    // title: (state) => state.title
  },
  actions: {
    increment() {
      this.counter++
    },
    setTitle(title: string) {
      this.title = title
    }
  }
})
