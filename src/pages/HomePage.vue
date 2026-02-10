<template>
  <q-page class="sequence-page q-pa-lg">
    <div class="row q-gutter-md q-mb-md items-center">
      <q-separator vertical dark inset />
      
      <div class="row items-center q-gutter-sm bg-grey-9 q-px-md q-py-xs rounded-borders">
        <span class="text-caption text-grey-5">Диапазон:</span>
        
        <q-input v-model="dateFrom" type="date" dark borderless dense class="date-input" />
        
        <q-icon name="arrow_forward" color="grey-7" size="xs" />
        
        <q-input v-model="dateTo" type="date" dark borderless dense class="date-input" />
        
        <q-badge outline color="primary" class="q-ml-sm">
          {{ totalDays }} дн.
        </q-badge>
      </div>
    </div>
    <div class="editor-container shadow-24">
      <q-toolbar class="q-gutter-sm q-ma-sm">
        <q-btn color="grey-10" text-color="primary" icon="add" label="Клип" @click="addNewClip" />
        <q-btn color="grey-10"  text-color="deep-orange-5" icon="add" label="Дорожка" @click="addTrack" />
      </q-toolbar>
      <SequenceEditor
        ref="timelineRef"
        v-model:tasks="myTasks"
        v-model:groups="myGroups"
        :groups="myGroups"
        :days="dateRange"
        :day-width="dayWidth"
      />
    </div>

    <div class="q-mt-lg">
      <div class="text-caption text-grey-6 q-mb-xs uppercase">Текущее состояние (Debug):</div>
      <pre class="text-indigo-2">{{ myTasks }}</pre>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import SequenceEditor from '../components/SequenceEditor.vue'
import { useTracks } from '../composables/useTracks';
import { useTasks } from '../composables/useTasks';

// 1. Управляем датами напрямую
const dateFrom = ref('2026-02-01')
const dateTo = ref('2026-02-15')
const dayWidth = ref(150)

const timelineRef = ref(null);

const myGroups = ref([
  { id: 0, name: 'Video 1', icon: 'movie', color: '#3949ab' },
  { id: 1, name: 'Audio 1', icon: 'mic', color: '#43a047' }
])

// 2. Генерируем массив дней на лету на основе выбранных дат
const dateRange = computed(() => {
  const dates = [];
  const start = new Date(dateFrom.value);
  const end = new Date(dateTo.value);

  // Создаем копию текущей даты для итерации
  let current = new Date(start);

  // Безопасный ограничитель, чтобы не зависнуть, если даты перепутаны
  let safetyIncrement = 0;
  while (current <= end && safetyIncrement < 366) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
    safetyIncrement++;
  }
  return dates;
});

// 3. totalDays теперь вычисляется на основе длины массива
const totalDays = computed(() => dateRange.value.length);

const myTasks = ref([
  { id: 1, label: 'Intro Clip', trackIndex: 0, startDay: 0, startHour: 4, durationHours: 12, color: '#3949ab' }
])

const { addTrack } = useTracks(myGroups, myTasks);
const { addTask } = useTasks(myTasks, myGroups);

const addNewClip = () => {
  if (timelineRef.value) {
    const center = timelineRef.value.getTimelineCenter();
    addTask(center.trackIndex, center.hour, center.day);
  }
}
</script>

<style scoped lang="scss">
.sequence-page {
  background-color: #0a0a0a;
  min-height: 100vh;
}

.editor-container {
  height: 60vh;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

pre {
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 15px;
  max-height: 250px;
  overflow: auto;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.4;
}

:deep(.q-btn) {
  text-transform: none;
  font-weight: 600;
}
</style>
