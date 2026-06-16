import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

const TAILWIND_CLASS_PREFIX = 'tw:'

const COLORS = [
  { label: 'Red', value: 'red' },
  { label: 'Orange', value: 'orange' },
  { label: 'Amber', value: 'amber' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Lime', value: 'lime' },
  { label: 'Green', value: 'green' },
  { label: 'Emerald', value: 'emerald' },
  { label: 'Teal', value: 'teal' },
  { label: 'Cyan', value: 'cyan' },
  { label: 'Sky', value: 'sky' },
  { label: 'Blue', value: 'blue' },
  { label: 'Indigo', value: 'indigo' },
  { label: 'Violet', value: 'violet' },
  { label: 'Purple', value: 'purple' },
  { label: 'Fuchsia', value: 'fuchsia' },
  { label: 'Pink', value: 'pink' },
  { label: 'Rose', value: 'rose' }
]

export function useLabelColors() {
  const customColorLabels = useLocalStorage<{ [key: string]: string }>('label-names', {})

  const getColor = (value?: string | null) => colors.value.find((o) => o.value === value)

  const getLabel = (value?: string | null) =>
    customColorLabels.value[value || ''] || getColor(value)?.label || value || ''

  const colors = computed(() =>
    COLORS.map((color) => ({
      ...color,
      label: customColorLabels.value[color.value] || color.label,
      bg: `${TAILWIND_CLASS_PREFIX}bg-${color.value}-500`,
      border: `${TAILWIND_CLASS_PREFIX}border-${color.value}-500`
    }))
  )

  const setCustomLabel = (value: string, label: string) => {
    customColorLabels.value[value] = label
  }

  const removeCustomLabel = (value: string) => {
    delete customColorLabels.value[value]
  }

  return { colors, getColor, getLabel, setCustomLabel, removeCustomLabel }
}
