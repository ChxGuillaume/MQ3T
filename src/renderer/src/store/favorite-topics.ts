import { defineStore } from 'pinia'

type FavoriteTopic = Map<string, Map<string, boolean>>

type State = {
  favoriteTopics: FavoriteTopic
}

export const useFavoriteTopicsStore = defineStore('favorite-topics', {
  state: (): State => ({
    favoriteTopics: new Map<string, Map<string, boolean>>()
  }),
  getters: {
    isFavoriteTopic: (state) => (clientId: string, topic: string) => {
      return state.favoriteTopics.has(clientId) && state.favoriteTopics.get(clientId)?.has(topic)
    }
  },
  actions: {
    addFavoriteTopic(clientId: string, topic: string) {
      if (!this.favoriteTopics.has(clientId)) {
        this.favoriteTopics.set(clientId, new Map<string, boolean>())
      }

      this.favoriteTopics.get(clientId)?.set(topic, true)
    },
    removeFavoriteTopic(clientId: string, topic: string) {
      this.favoriteTopics.get(clientId)?.delete(topic)
    }
  }
})
