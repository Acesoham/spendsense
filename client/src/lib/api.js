import axios from 'axios'

const instance = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })

export const api = {
  setToken(token) {
    instance.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : ''
  },
  async get(url, params) {
    const { data } = await instance.get(url, { params })
    return data
  },
  async post(url, body) {
    const { data } = await instance.post(url, body)
    return data
  },
  async patch(url, body) {
    const { data } = await instance.patch(url, body)
    return data
  },
  async del(url) {
    const { data } = await instance.delete(url)
    return data
  }
}
