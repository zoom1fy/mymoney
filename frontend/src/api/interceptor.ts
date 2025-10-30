import {
  getAccessToken,
  removeTokenStorage
} from '../services/auth-token.service'
import { authService } from '../services/auth.service'
import { errorCatch } from './error'
import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import axios, { CreateAxiosDefaults } from 'axios'

const options: CreateAxiosDefaults = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
}

const axiosClassic = axios.create(options)
const axiosWithAuth = axios.create(options)

// Лог запросов
axiosClassic.interceptors.request.use(config => {
  console.log('➡️ Sending request to:', (config.baseURL || '') + config.url)
  return config
})

// Лог ответов
axiosClassic.interceptors.response.use(
  response => response,
  error => {
    console.error('❌ Axios Classic Error:', error)
    throw error
  }
)

// Добавление токена в каждый запрос
axiosWithAuth.interceptors.request.use(config => {
  const accessToken = getAccessToken()
  if (config.headers && accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Обработка ошибок
axiosWithAuth.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    const shouldRetry =
      !originalRequest._isRetry &&
      (error.response?.status === 401 ||
        errorCatch(error) === 'jwt expired' ||
        errorCatch(error) === 'jwt must be provided')

    if (shouldRetry) {
      originalRequest._isRetry = true
      try {
        // Попробовать обновить токены
        await authService.getNewTokens()
        // Повторить исходный запрос с новым токеном
        return axiosWithAuth.request(originalRequest)
      } catch (refreshError) {
        // Если обновление не удалось, чистим токены и редирект
        removeTokenStorage()
        window.location.href = DASHBOARD_PAGES.AUTH
        return
      }
    }

    throw error
  }
)

export { axiosClassic, axiosWithAuth }
