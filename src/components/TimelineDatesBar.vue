<template>
  <div class="dates-bar bg-grey-10 border-bottom overflow-hidden" ref="headerScroll">
    <div class="flex no-wrap full-height" :style="{ width: contentWidth + 'px' }">
      
      <div v-for="day in dayScale" :key="day.fullDate"
           class="day-header border-right flex column no-shrink relative-position overflow-hidden"
           :style="{ width: dayWidth + 'px', minWidth: dayWidth + 'px' }">
        
        <div class="flex column justify-center items-center full-height full-width q-pa-xs">
          
          <template v-if="dayWidth < 100">
            <div class="text-week text-grey-6">{{ day.weekNum }}</div>
            <div class="text-bold text-white">{{ day.dayOfMonth }}</div>
          </template>

          <template v-else-if="dayWidth <= 250">
            <div class="text-caption text-uppercase text-grey-5" style="font-size: 0.6rem">
              {{ day.weekday }}
            </div>
            <div class="text-bold text-white">{{ day.label }}</div>
          </template>

          <template v-else>
            <div class="text-bold text-indigo-3 q-mb-xs" style="font-size: 0.75rem">
              {{ day.label }} {{ day.weekday }}
            </div>
            <div class="hours-row flex no-wrap full-width justify-between">
              <div v-for="h in hourTicks" :key="h" class="hour-tick">
                {{ h }}
              </div>
            </div>
          </template>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  days: { type: Array, required: true },
  dayWidth: { type: Number, required: true },
  contentWidth: { type: Number, required: true }
});

const headerScroll = ref(null);

// Динамические метки часов для режима Micro-zoom
const hourTicks = computed(() => {
  if (props.dayWidth > 500) return [0, 3, 6, 9, 12, 15, 18, 21];
  return [0, 6, 12, 18];
});

const dayScale = computed(() => {
  if (!props.days || props.days.length === 0) return [];
  return props.days.map(d => {
    const date = new Date(d);
    
    // Номер недели
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((date - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);

    return {
      label: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      dayOfMonth: date.getDate(),
      weekday: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
      weekNum: `W${weekNum}`,
      fullDate: d
    };
  });
});

defineExpose({ $el: headerScroll });
</script>

<style scoped lang="scss">
.dates-bar {
  grid-column: 2;
  grid-row: 1;
  height: 45px; // Фиксированная высота как просили
  background: #121212;
  user-select: none;
}

.day-header {
  height: 45px;
  background: #1a1a1a;
}

.text-week {
  font-size: 0.55rem;
  font-weight: 800;
  text-transform: uppercase;
}

.hours-row {
  width: 100%;
  padding: 0 2px;
}

.hour-tick {
  font-size: 9px;
  color: #666;
  position: relative;
  
  // Маленькая черточка под цифрой часа
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    width: 1px;
    height: 3px;
    background: #444;
  }
}

.border-right { border-right: 1px solid #2a2a2a; }
.border-bottom { border-bottom: 1px solid #2a2a2a; }
</style>