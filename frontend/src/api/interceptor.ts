import axios, { CreateAxiosDefaults } from 'axios'
import { toast } from 'sonner'

import {
  getAccessToken,
  removeTokenStorage
} from '../services/auth-token.service'
import { authService } from '../services/auth.service'
import { catchError } from './error'

const options: CreateAxiosDefaults = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4200/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
}

const axiosClassic = axios.create(options)
const axiosWithAuth = axios.create(options)

// Log and handle API errors globally (rate limiting, network issues)
axiosClassic.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      if (error.response.status === 429) {
        toast.error('Слишком много запросов. Пожалуйста, подождите.')
      }
      console.error(
        'Server Error:',
        error.response.status,
        error.response.data
      )
    } else if (error.request) {
      console.error('No response received:', error.request)
    } else {
      console.error('Axios Error:', error.message)
    }
    throw error
  }
)

// Attach Bearer token from cookies to every authenticated request
axiosWithAuth.interceptors.request.use(config => {
  const accessToken = getAccessToken()

  if (config?.headers && accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

// Auto-refresh access token on 401; retry the original request once
axiosWithAuth.interceptors.response.use(
  config => config,
  async error => {
    if (error?.response?.status === 429) {
      toast.error('Слишком много запросов. Пожалуйста, подождите.')
      throw error
    }

    const originalRequest = error.config

    if (
      error?.response?.status === 401 ||
      catchError(error) === 'jwt expired' ||
      (catchError(error) === 'jwt must be provided' &&
        error.config &&
        !error.config.isRetry)
    ) {
      originalRequest.isRetry = true
      try {
        await authService.getNewTokens()
        return axiosWithAuth.request(originalRequest)
      } catch (error) {
        if (catchError(error) === 'jwt expired') removeTokenStorage()
      }
    }

    throw error
  }
)

export { axiosClassic, axiosWithAuth }
