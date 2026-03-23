'use client'

import { cn } from '@/lib/utils'

interface CategoryCardsProps {
  onCategorySelect: (category: string) => void
}

export function CategoryCards({ onCategorySelect }: CategoryCardsProps) {
  const categories = [
    {
      id: 'iphone',
      name: 'iPhone',
      icon: '📱',
      color: 'from-blue-500 to-cyan-400',
      lessons: 12,
    },
    {
      id: 'mac',
      name: 'Mac',
      icon: '💻',
      color: 'from-gray-600 to-gray-400',
      lessons: 8,
    },
    {
      id: 'ipad',
      name: 'iPad',
      icon: '📟',
      color: 'from-indigo-500 to-blue-400',
      lessons: 6,
    },
    {
      id: 'watch',
      name: 'Apple Watch',
      icon: '⌚',
      color: 'from-red-500 to-pink-400',
      lessons: 5,
    },
    {
      id: 'airpods',
      name: 'AirPods',
      icon: '🎧',
      color: 'from-primary to-orange-400',
      lessons: 4,
    },
    {
      id: 'sales',
      name: 'Sales Skills',
      icon: '🎯',
      color: 'from-accent to-pink-400',
      lessons: 10,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category.id)}
          className={cn(
            'relative overflow-hidden rounded-2xl p-4 text-left transition-transform hover:scale-[1.02] active:scale-[0.98]',
            `bg-gradient-to-br ${category.color}`
          )}
        >
          <span className="text-4xl mb-2 block">{category.icon}</span>
          <h3 className="text-white font-bold text-lg">{category.name}</h3>
          <p className="text-white/70 text-sm">{category.lessons} lessons</p>
        </button>
      ))}
    </div>
  )
}
