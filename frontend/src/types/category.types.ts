// category.types.ts
import { CurrencyCode } from './account.types'
import { IBase } from './root.types'
import {
  Airplay,
  Anchor,
  BarChart,
  Beer,
  Book,
  BookOpen,
  Briefcase,
  Bus,
  Calculator,
  Calendar,
  Camera,
  Car,
  Carrot,
  Circle,
  Clock,
  Cloud,
  Coffee,
  CreditCard,
  DollarSign,
  Dumbbell,
  FileText,
  Film,
  Gamepad,
  Gift,
  Globe,
  GraduationCap,
  Hamburger,
  Headphones,
  Heart,
  HeartPulse,
  Home,
  Hospital,
  Hotel,
  Key,
  Laptop,
  Leaf,
  Lightbulb,
  Lock,
  LucideIcon,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Music,
  Paintbrush,
  Phone,
  PieChart,
  PiggyBank,
  Plane,
  Printer,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Star,
  Sun,
  TrendingUp,
  Truck,
  Umbrella,
  Users,
  Utensils,
  Video,
  Wallet,
  Watch,
  Wifi,
  Zap
} from 'lucide-react'

/**
 * Интерфейс создания категории (фронт → бэк)
 */
export interface ICreateCategory {
  name: string
  currencyCode: CurrencyCode
  isExpense: boolean
  parentId?: number
  icon?: string
  color: string
}

/**
 * Полная категория (бэк → фронт)
 */
export interface ICategory extends ICreateCategory, IBase {}

/**
 * Интерфейс обновления категории (частичное обновление)
 */
export type IUpdateCategory = Partial<ICreateCategory>

/**
 * Расширенный объект с иконками категорий
 */
export const CategoryIcons: Record<string, LucideIcon> = {
  ShoppingCart, // 🛒 Покупки
  Utensils, // 🍴 Еда
  Car, // 🚗 Транспорт
  Gamepad, // 🎮 Развлечения
  Circle, // ⭕ Другое
  Heart, // ❤️ Здоровье / любовь
  Gift, // 🎁 Подарки
  Home, // 🏠 Дом
  Star, // ⭐ Разное / важное
  Coffee, // ☕ Напитки
  Beer, // 🍺 Алкоголь / бар
  Book, // 📚 Образование / книги
  Camera, // 📷 Фото / техника
  Film, // 🎬 Кино / медиа
  Music, // 🎵 Музыка
  Paintbrush, // 🎨 Искусство / хобби
  Truck, // 🚚 Логистика / доставка
  Bus, // 🚌 Транспорт
  Airplay, // 📡 Техника / гаджеты
  Anchor, // ⚓ Путешествия
  Leaf, // 🍃 Экология / природа
  Globe, // 🌍 Путешествия / глобальные расходы
  Sun, // ☀️ Отдых / лето
  Moon, // 🌙 Ночь / развлечения
  Cloud, // ☁️ Хобби / интернет
  Zap, // ⚡ Электричество / техника
  Shield, // 🛡 Страховки / безопасность
  Key, // 🔑 Личные вещи
  Lock, // 🔒 Безопасность
  Mail, // 📧 Коммуникации
  Phone, // 📱 Связь
  Wallet, // 👛 Кошелёк
  CreditCard, // 💳 Карта
  PiggyBank, // 🏦 Сбережения
  Briefcase, // 💼 Работа / бизнес
  Calendar, // 📅 Планирование / события
  DollarSign, // 💲 Финансы / доходы
  FileText, // 📄 Документы
  Headphones, // 🎧 Музыка / аудио
  Hotel, // 🏨 Проживание / отель
  Lightbulb, // 💡 Идеи / инновации
  MapPin, // 📍 Местоположение / карты
  Monitor, // 🖥 Работа / компьютеры
  PieChart, // 📊 Аналитика / отчеты
  Plane, // ✈️ Путешествия
  Printer, // 🖨 Офис / печать
  ShoppingBag, // 🛍 Шопинг
  Smartphone, // 📱 Технологии / связь
  TrendingUp, // 📈 Инвестиции / рост
  Umbrella, // ☔ Страхование / защита
  Users, // 👥 Социальные / встречи
  Video, // 📹 Видео / мультимедиа
  Watch, // ⌚ Время / часы
  Wifi, // 📶 Интернет / связь
  BarChart, // 📊 Статистика / данные
  BookOpen, // 📖 Обучение / книги
  Calculator, // 🧮 Расчеты / финансы
  Carrot, // 🥕 Питание / здоровье
  Clock, // ⏰ Время / планирование
  Dumbbell, // 🏋️‍♂️ Спорт / фитнес
  Hamburger, // 🍔 Быстрое питание
  GraduationCap, // 🎓 Образование
  HeartPulse, // 💓 Здоровье
  Hospital, // 🏥 Медицина
  Laptop // 💻 Техника / работа
}

export type CategoryIconName = keyof typeof CategoryIcons
