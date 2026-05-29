# Планер ✦

Минималистичное и мощное приложение для планирования задач с эстетикой "True Black" и AI-подсказками.

![Preview Placeholder](https://via.placeholder.com/1200x600/0C0C0C/E8A87C?text=Planner+✦+True+Black+Interface)

## ✨ Особенности

- **True Black UI:** Идеально подходит для OLED-экранов, снижает нагрузку на глаза.
- **Интеллектуальные подсказки:** Генерация идей для задач с помощью AI.
- **Облачная синхронизация:** Надежная интеграция с Supabase (atomic upserts).
- **Оффлайн режим:** Поддержка PWA и синхронизация при восстановлении сети.
- **Гостевой режим:** Работа через localStorage без регистрации.
- **Продуктивность:** Трекинг стриксов (🔥), статистика и визуальные празднования (конфетти).
- **Безопасность:** Row Level Security (RLS) в Supabase.

## 🚀 Быстрый старт

### 1. Клонирование и установка
```bash
git clone https://github.com/rodionnebo/planner-app.git
cd planner-app
npm install
```

### 2. Настройка окружения (.env)
Создайте файл `.env` в корне проекта:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ANTHROPIC_API_KEY=optional-api-key-for-ai
```

### 3. Настройка базы данных
Выполните SQL-команды из файла `supabase_setup.sql` в SQL Editor вашей панели Supabase. Это включит RLS и создаст необходимые индексы.

### 4. Запуск
```bash
npm run dev
```

## 🧪 Тестирование
```bash
npm test          # Unit-тесты (Vitest)
npx playwright test # E2E-тесты (опционально)
```

## 🛠 CI/CD и Деплой (Netlify)
Приложение настроено для автоматического деплоя через Netlify:
1. Подключите репозиторий в панели Netlify.
2. Установите команду сборки: `npm run build`.
3. Установите каталог публикации: `dist`.
4. Добавьте переменные окружения из `.env` в настройки Netlify (Site settings > Build & deploy > Environment).

## ⌨️ Горячие клавиши
- `N` — Новая задача
- `F` — Фокус-режим
- `Esc` — Закрыть модальное окно/AI панель
- `←` / `→` — Навигация по датам

## 📄 Лицензия
MIT
