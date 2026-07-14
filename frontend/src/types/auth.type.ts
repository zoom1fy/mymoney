export interface IAuthForm {
  email: string
  password: string
}

export interface IUser {
  id: string
  email: string
  name: string
}

export interface IAuthResponse {
  accessToken: string
  user: IUser
}