<template>
<q-drawer v-model="drawerOpen" side="right" bordered :width="300" class="bg-grey-10 text-white q-pa-md">
  <div class="text-h6 q-mb-md">Редактирование клипа</div>
  <div v-if="editingTask">
    <q-input v-model="editingTask.label" label="Заголовок" dark stack-label class="q-mb-sm" />
    <q-input v-model="editingTask.description" label="Описание" type="textarea" dark stack-label class="q-mb-sm" />
    <q-input v-model.number="editingTask.durationHours" type="number" label="Длительность (ч)" dark stack-label />
    <q-btn label="Закрыть" color="primary" class="full-width q-mt-md" @click="drawerOpen = false" />
  </div>
</q-drawer>
  <q-page class="sequence-page q-pa-lg">

    <div class="row q-gutter-md q-mb-md items-center">


      <q-separator vertical dark inset />

      <div class="row items-center q-gutter-sm bg-grey-9 q-px-md q-py-xs rounded-borders">
        <span class="text-caption text-grey-5">Дни:</span>
        <q-btn flat dense color="white" icon="remove" @click="totalDays = Math.max(1, totalDays - 1)" />
        <span class="text-weight-bold text-white">{{ totalDays }}</span>
        <q-btn flat dense color="white" icon="add" @click="totalDays++" />
      </div>

      <div class=" bg-grey-9 q-px-md q-py-xs rounded-borders" style="min-width: 250px">
        <span class="text-caption text-grey-5">Зум:</span>
        <q-slider
          v-model="dayWidth"
          :min="100"
          :max="400"
          :step="10"
          color="indigo-4"
          dark
        />
      </div>

    </div>

    <div class="editor-container shadow-24">
      <q-toolbar>
        <q-btn color="primary" icon="add" label="Клип" @click="addNewClip" />
        <q-btn outline color="deep-orange-5" icon="layers" label="Дорожка" @click="addTrack" />
      </q-toolbar>
      <SequenceEditor
        v-model:tasks="myTasks"
        v-model:groups="myGroups"
        :groups="myGroups"
        :days="dateRange"
        :day-width="dayWidth"
        @request-delete-task="confirmDeleteTask"
        @edit-task="openEditDrawer"
        @change="onEditorChange"
      />
    </div>

    <div class="q-mt-lg">
      <div class="text-caption text-grey-6 q-mb-xs uppercase">Текущее состояние (Debug):</div>
      <pre class="text-indigo-2">{{ myTasks }}</pre>
    </div>

  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import SequenceEditor from '../components/SequenceEditor.vue'

const drawerOpen = ref(false);
const editingTask = ref(null);
// Параметры сетки
const totalDays = ref(15)
const dayWidth = ref(150)

const myGroups = ref([
  { id: 0, name: 'Video 1', icon: 'movie', color: '#3949ab' },
  { id: 1, name: 'Audio 1', icon: 'mic', color: '#43a047' }
])

// В родительском компоненте App.vue
const generateDateRange = () => {
  const dates = [];
  const today = new Date();

  // Генерируем от -7 до +7 (итого 15 дней)
  for (let i = -7; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // Сохраняем как ISO строку для стабильности пропсов
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const dateRange = ref(generateDateRange());
const myTasks = ref([
  {
    id: 1,
    label: 'Intro Clip',
    trackIndex: 0, // Первая дорожка
    startDay: 0,   // Первый день
    startHour: 4,  // 4 часа утра
    durationHours: 12, // Длительность 12 часов
    color: '#3949ab'
  }
])

const addNewClip = () => {
  const newId = Date.now()
  // Добавляем новый клип в начало таймлайна на первую дорожку
  myTasks.value.push({
    id: newId,
    label: 'Clip_' + newId.toString().slice(-4),
    trackIndex: 0, // Первая дорожка
    startDay: 0,   // Первый день
    startHour: 4,  // 4 часа утра
    durationHours: 12, // Длительность 12 часов
    color: myGroups.value[0].color
  })
}
// --- Редактирование ---
const openEditDrawer = (task) => {
  editingTask.value = task; // Ссылка на объект (реактивно обновится в редакторе)
  drawerOpen.value = true;
};
const onEditorChange = (updatedTasks) => {
  console.log('Данные синхронизированы:', updatedTasks)
}
</script>

<style scoped lang="scss">
.sequence-page {
  background-color: #0a0a0a;
  min-height: 100vh;
}

.editor-container {
  height: 60vh; // Теперь редактор занимает 60% высоты экрана
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
