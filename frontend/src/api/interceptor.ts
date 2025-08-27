import {
  getAccessToken,
  removeTokenStorage
} from '../services/auth-token.service'
import { authService } from '../services/auth.service'
import { errorCatch } from './error'
import axios, { CreateAxiosDefaults } from 'axios'

const options: CreateAxiosDefaults = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
}

const axiosClassic = axios.create(options)
const axiosWithAuth = axios.create(options)

axiosClassic.interceptors.request.use(config => {
  console.log('➡️ Sending request to:', (config.baseURL || '') + config.url)
  return config
})

axiosClassic.interceptors.response.use(
  response => {
    console.log('✅ Response:', response.status, response.data)
    return response
  },
  error => {
    if (error.response) {
      // Сервер ответил с ошибкой (4xx/5xx)
      console.error(
        '❌ Server Error:',
        error.response.status,
        error.response.data
      )
    } else if (error.request) {
      // Запрос был отправлен, ответа нет
      console.error('❌ No response received:', error.request)
    } else {
      // Ошибка в настройке запроса
      console.error('❌ Axios Error:', error.message)
    }
    throw error
  }
)

axiosWithAuth.interceptors.request.use(config => {
  const accessToken = getAccessToken()

  console.log('➡️ Sending request to:', (config.baseURL || '') + config.url)
  console.log('➡️ Data:', config.data)

  if (config?.headers && accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

axiosWithAuth.interceptors.response.use(
  config => config,
  async error => {
    const originalRequest = error.config

    if (
      (error.response.status === 401 ||
        errorCatch(error) === 'jwt expired' ||
        errorCatch(error) === 'jwt must be provided') &&
      error.config &&
      !error.config._isRetry
    ) {
      originalRequest._isRetry = true
      try {
        await authService.getNewTokens()
        return axiosWithAuth.request(originalRequest)
      } catch (error) {
        if (errorCatch(error) === 'jwt expired') removeTokenStorage()
      }
    }

    throw error
  }
)

export { axiosClassic, axiosWithAuth }
