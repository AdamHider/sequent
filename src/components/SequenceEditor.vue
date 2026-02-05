<template>

  <div class="sequence-editor shadow-24 rounded-borders overflow-hidden">
    <div class="editor-layout">
      <div class="corner-bg bg-grey-9 border-right border-bottom"></div>

      <div
        class="dates-bar bg-grey-9 border-bottom overflow-hidden"
        ref="headerScroll"
      >
        <div class="flex no-wrap" :style="{ width: contentWidth + 'px' }">
          <div v-for="(day, index) in dayScale" :key="day.fullDate"
              class="day-header border-right"
              :class="{ 'is-today': index === todayIndex }">
            <div class="text-caption text-uppercase" style="font-size: 0.7rem">{{ day.weekday }}</div>
            <div class="text-weight-bold">{{ day.label }}</div>
          </div>
        </div>
      </div>

      <div class="tracks-sidebar bg-grey-9 border-right overflow-hidden" ref="sidebarScroll">
        <div v-for="(group, index) in groups" :key="group.id" class="track-label border-bottom relative-position">
          <q-icon :name="group.icon" :style="{ color: group.color }" class="q-mr-xs" />
          <span class="text-caption text-grey-4 ellipsis">{{ group.name }}</span>

          <q-menu context-menu dark>
            <q-list style="min-width: 200px">
              <q-item clickable v-close-popup @click="moveGroup(index, -1)" :disable="index === 0">
                <q-item-section avatar><q-icon name="arrow_upward" /></q-item-section>
                <q-item-section>Переместить вверх</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="moveGroup(index, 1)" :disable="index === groups.length - 1">
                <q-item-section avatar><q-icon name="arrow_downward" /></q-item-section>
                <q-item-section>Переместить вниз</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="addGroup(index)">
                <q-item-section avatar><q-icon name="add" /></q-item-section>
                <q-item-section>Вставить дорожку выше</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="addGroup(index + 1)">
                <q-item-section avatar><q-icon name="add" /></q-item-section>
                <q-item-section>Вставить дорожку ниже</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup class="text-negative" @click="deleteGroup(index)">
                <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
                <q-item-section>Удалить дорожку</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>
      </div>

      <div
        class="timeline-view overflow-auto"
        @scroll="syncScrolls"
        ref="mainScroll"
      >
        <div
          class="timeline-content relative-position"
          :style="{ width: contentWidth + 'px', height: contentHeight + 'px' }"
        >
          <div
            v-for="lineX in activeGuides"
            :key="lineX"
            class="smart-guide"
            :style="{ transform: `translateX(${lineX}px)` }"
          ></div>

          <div class="grid-layer absolute-full">
            <div
              v-for="(group, gIndex) in groups"
              :key="gIndex"
              class="grid-row border-bottom row no-wrap"
            >
              <div
                v-for="n in totalDays"
                :key="n"
                class="grid-cell border-right"
              ></div>
            </div>
          </div>


          <div
            v-for="task in tasks"
            :key="task.id"
            :id="'task-' + task.id"
            class="task-block shadow-10"
            :class="{ 'is-dragging': draggingId === task.id }"
            :style="getTaskStyle(task)"
          >
            <div class="task-inner q-px-sm column justify-center no-wrap">
              <div class="row justify-between full-width no-wrap" style="font-size: 9px; opacity: 0.8">
                <span>{{ formatTime(task.startHour) }}</span>
                <span>{{ formatTime(task.startHour + task.durationHours) }}</span>
              </div>
              <div class="text-weight-bold ellipsis">{{ task.label }}</div>
              <div class="ellipsis text-caption" style="font-size: 10px; line-height: 1">{{ task.description }}</div>
            </div>
            <q-menu context-menu>
              <q-list style="min-width: 150px">
                <q-item clickable v-close-popup @click="editTask(task)">
                  <q-item-section avatar><q-icon name="edit" /></q-item-section>
                  <q-item-section>Изменить</q-item-section>
                </q-item>
                <q-item clickable v-close-popup class="text-negative" @click="deleteTask(task.id)">
                  <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
                  <q-item-section>Удалить</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed, watch, nextTick, onBeforeUnmount } from "vue";
import { draggingId, activeGuides } from "../scripts/timelineState";
import { useTimelineInteract } from "../composables/useTimelineInteract";

const props = defineProps({
  tasks: Array,
  groups: Array,
  days: Array,
  dayWidth: { type: Number, default: 150 },
  trackHeight: { type: Number, default: 60 },
});

const emit = defineEmits([
  "change", "update:groups", "update:tasks",
  "request-delete-group", "request-delete-task", "edit-task"
]);

// Рефы на DOM
const mainScroll = ref(null);
const headerScroll = ref(null);
const sidebarScroll = ref(null);

// --- 1. ЛОГИКА КООРДИНАТ (Математика) ---
const HOUR_WIDTH = computed(() => props.dayWidth / 24);
const contentWidth = computed(() => props.days.length * props.dayWidth);
const contentHeight = computed(() => props.groups.length * props.trackHeight);
const totalDays = computed(() => props.days.length);

const getTaskX = (task) => task.startDay * props.dayWidth + task.startHour * HOUR_WIDTH.value;
const getTaskWidth = (task) => task.durationHours * HOUR_WIDTH.value;

// ТА САМАЯ ФУНКЦИЯ, которую потерял шаблон
const getTaskStyle = (task) => ({
  transform: `translate(${getTaskX(task)}px, ${task.trackIndex * props.trackHeight}px)`,
  width: `${getTaskWidth(task)}px`,
  backgroundColor: task.color || "#3949ab",
  position: 'absolute',
  top: 0,
  left: 0,
});

const applyPixelsToTask = (task, x, y, width) => {
  const totalHours = Math.round(x / HOUR_WIDTH.value);
  task.startDay = Math.floor(totalHours / 24);
  task.startHour = totalHours % 24;
  if(task.startDay < 0) task.startDay = 0
  if(task.startHour < 0) task.startHour = 0
  task.trackIndex = Math.max(0, Math.min(Math.round(y / props.trackHeight), props.groups.length - 1));
  if (width !== undefined) task.durationHours = Math.max(1, Math.round(width / HOUR_WIDTH.value));
  if (props.groups[task.trackIndex]) task.color = props.groups[task.trackIndex].color;
};

// --- 2. ГАЙДЫ ---
const updateGuides = (currentX, currentWidth) => {
  const currentRight = currentX + currentWidth;
  const matches = new Set();
  props.tasks.forEach((t) => {
    if (t.id === draggingId.value) return;
    const tX = getTaskX(t), tR = tX + getTaskWidth(t);
    if (Math.abs(currentX - tX) < 1) matches.add(tX);
    if (Math.abs(currentX - tR) < 1) matches.add(tR);
    if (Math.abs(currentRight - tX) < 1) matches.add(tX);
    if (Math.abs(currentRight - tR) < 1) matches.add(tR);
  });
  activeGuides.value = Array.from(matches);
};

// --- 3. ПОДКЛЮЧЕНИЕ INTERACT ---
const { initInteract, destroyInteract } = useTimelineInteract(props, {
  mainScroll,
  getTaskX,
  getTaskWidth,
  applyPixelsToTask,
  updateGuides,
  emit
});

// --- 4. ЖИЗНЕННЫЙ ЦИКЛ ---
onMounted(() => {
  initInteract();
  // Скролл к "Сегодня"
  setTimeout(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayIdx = props.days.findIndex(d => d === today);
    if (todayIdx !== -1 && mainScroll.value) {
      const targetX = todayIdx * props.dayWidth;
      mainScroll.value.scrollLeft = targetX - (mainScroll.value.clientWidth / 2) + (props.dayWidth / 2);
    }
  }, 100);
});

onBeforeUnmount(() => destroyInteract());

const syncScrolls = (e) => {
  headerScroll.value.scrollLeft = e.target.scrollLeft;
  sidebarScroll.value.scrollTop = e.target.scrollTop;
};

const dayScale = computed(() => props.days.map(d => ({
  label: new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
  weekday: new Date(d).toLocaleDateString('ru-RU', { weekday: 'short' })
})));

const todayIndex = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return props.days.findIndex(d => d === today);
});

const formatTime = (totalHours) => {
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Вычисление времени конца задачи
const getEndTime = (task) => {
  return task.startHour + task.durationHours;
};
const moveGroup = (index, direction) => {
  const newGroups = [...props.groups];
  const element = newGroups.splice(index, 1)[0];
  newGroups.splice(index + direction, 0, element);
  emit('update:groups', newGroups);
};
const deleteGroup = (index) => {
  emit('request-delete-group', {index,group: props.groups[index]});
};

const editTask = (task) => {
  emit('edit-task', task);
};

const deleteTask = (taskId) => {
  emit('request-delete-task', taskId);
};

watch(() => props.dayWidth, (newW, oldW) => {
  if (!mainScroll.value || !oldW) return;
  const scrollEl = mainScroll.value;
  const progress = (scrollEl.scrollLeft + scrollEl.clientWidth / 2) / (totalDays.value * oldW);

  nextTick(() => {
    const newTotalWidth = totalDays.value * newW;
    scrollEl.scrollLeft = (newTotalWidth * progress) - (scrollEl.clientWidth / 2);
  });
});
</script>

<style scoped lang="scss">
/* Используй стили из предыдущего сообщения, добавив .smart-guide и ресайзеры */
.editor-layout {
  display: grid;
  grid-template-columns: 140px 1fr;
  grid-template-rows: 35px 1fr;
  height: 100%;
}
.smart-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #3fa1ff;
  box-shadow: 0 0 4px #3fa1ff;
  z-index: 45;
  pointer-events: none;
}
/* ... остальные стили ... */
</style>
<style scoped lang="scss">
// Запрещаем выделение текста, чтобы не мешало при драге
.no-user-select {
  user-select: none;
}

.sequence-editor {
  display: flex;
  flex-direction: column;
  background: #121212;
  border: 1px solid #333;
  width: 100%;
  height: 100%; // Регулируется родителем
}

.editor-layout {
  display: grid;
  // Фиксированная левая колонка 140px и гибкий контент
  grid-template-columns: 140px 1fr;
  // Фиксированная шапка 35px и гибкий контент
  grid-template-rows: 35px 1fr;
  flex-grow: 1;
  overflow: hidden;
}

// Вспомогательные элементы позиционирования
.corner-bg {
  z-index: 40;
}
.dates-bar {
  z-index: 35;
}
.tracks-sidebar {
  z-index: 35;
}

.day-header.is-today {
  background: rgba(var(--q-primary-rgb), 0.2);
  color: #fff;
  border-bottom: 2px solid var(--q-primary);
  position: relative;
  &::after {
    content: 'СЕГОДНЯ';
    position: absolute;
    bottom: 2px;
    font-size: 8px;
    opacity: 0.7;
  }
}
.grid-cell.bg-today {
  background-color: rgba(255, 255, 255, 0.03); // Тонкая подсветка всей колонки
}
.timeline-view {
  z-index: 30;
  background: #1a1a1a;
  scroll-behavior: auto; // Для зума лучше авто, иначе будет дергаться
  position: relative;

  // Кастомный скроллбар в стиле редактора
  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  &::-webkit-scrollbar-track {
    background: #121212;
  }
  &::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 5px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #444;
  }
}

.timeline-content {
  background-color: #1a1a1a;
  user-select: none;
}

// Шапки дней
.day-header {
  flex: 1;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  border-right: 1px solid #222;
}

// Лейблы дорожек (Video 1, Audio 1...)
.track-label {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  border-bottom: 1px solid #222;
}

// Сетка (Фон)
.grid-row {
  height: 60px;
}
.grid-cell {
  flex: 1;
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.03);
  // Микро-сетка часов
  background-image: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.01) 1px,
    transparent 1px
  );
  background-size: 6.25px 100%;
}

// Задачи (Клипы)
.task-block {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 4px;
  touch-action: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
  height: 50px;
  margin-top: 5px;
  cursor: grab;
  transition: background-color 0.3s ease, box-shadow 0.2s ease;

  &.is-dragging {
    cursor: grabbing;
    opacity: 0.85;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
    z-index: 1000 !important;
    transition: none; // Отключаем transition при драге для мгновенного отклика
  }
}

.task-inner {
  height: 100%;
  color: white;
  position: relative;
  display: flex;
  align-items: center;
}

// Ручки ресайза
.resizer-left,
.resizer-right {
  position: absolute;
  top: 0;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 5;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}
.resizer-left {
  left: 0;
}
.resizer-right {
  right: 0;
}

// Умные направляющие
.smart-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #3fa1ff;
  box-shadow: 0 0 6px #3fa1ff;
  z-index: 45;
  pointer-events: none;
  will-change: transform;
}

// Скрытие скроллбаров для синхронизируемых панелей
.dates-bar::-webkit-scrollbar,
.tracks-sidebar::-webkit-scrollbar {
  display: none;
}

.border-bottom {
  border-bottom: 1px solid #333;
}
.border-right {
  border-right: 1px solid #333;
}
</style>
