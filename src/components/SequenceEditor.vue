<template>
  <div class="sequence-editor shadow-24 rounded-borders overflow-hidden bg-dark text-white full-height">
    <div class="editor-layout">
      <TracksSidebar
        v-model:groups="localGroups"
        v-model:tasks="localTasks"
        :track-height="trackHeight"
        :content-height="contentHeight"
        @edit-track="$emit('edit-track', $event)"
        ref="sidebarScroll"
      />
      <TimelineDatesBar
        :days="days"
        :day-width="dayWidth"
        :content-width="contentWidth"
        ref="headerScroll"
      />
      <div class="timeline-view overflow-auto" @scroll="syncScrolls" ref="mainScroll">
        <div class="timeline-content relative-position" :style="contentSizeStyle">
          <TimelineGrid :groups="groups" :track-height="trackHeight" :day-width="dayWidth" />
          <div v-for="lineX in activeGuides" :key="lineX" class="smart-guide" :style="{ transform: `translateX(${lineX}px)` }" />
          <TimelineTask
            v-for="task in tasks"
            :key="task.id"
            v-model:tasks="localTasks"
            :task="task"
            :tasks="tasks"
            :is-dragging="draggingId === task.id"
            :x="getTaskX(task)"
            :width="getTaskWidth(task)"
            :height="trackHeight - 10"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, nextTick , watch } from "vue";
import TimelineTask from "./TimelineTask.vue";
import TimelineGrid from "./TimelineGrid.vue";
import TracksSidebar from "./TracksSidebar.vue";
import TimelineDatesBar from "./TimelineDatesBar.vue";

import { useTimelineCoords } from "../composables/useTimelineCoords";
import { draggingId, activeGuides } from "../scripts/timelineState";
import { useTimelineInteract } from "../composables/useTimelineInteract";

const props = defineProps({
  tasks: {
    type: Array,
    required: true,
    default: () => []
  },
  groups: {
    type: Array,
    required: true,
    default: () => []
  },
  days: {
    type: Array,
    required: true
  },
  dayWidth: {
    type: Number,
    default: 150
  },
  trackHeight: {
    type: Number,
    default: 60
  }
});
const emit = defineEmits([
  'update:groups',
  'update:tasks',
  'edit-track',
  'edit-task'
]);

const localGroups = computed({
  get: () => props.groups,
  set: (val) => emit('update:groups', val)
});

const localTasks = computed({
  get: () => props.tasks,
  set: (val) => emit('update:tasks', val)
});

const { contentWidth, contentHeight, getTaskX, getTaskWidth, applyPixelsToTask } = useTimelineCoords(props);

const contentSizeStyle = computed(() => ({
  width: `${contentWidth.value}px`,
  height: `${contentHeight.value}px`,
  position: 'relative'
}));

const mainScroll = ref(null)
const headerScroll = ref(null)
const sidebarScroll = ref(null)


const syncScrolls = (e) => {
  // Достаем нативный элемент через экспортированный ref
  if (headerScroll.value?.$el) {
    headerScroll.value.$el.scrollLeft = e.target.scrollLeft;
  }
  if (sidebarScroll.value?.$el) {
    sidebarScroll.value.$el.scrollTop = e.target.scrollTop;
  }
};
const updateGuides = (currentX, currentWidth) => {
  const currentRight = currentX + currentWidth;
  const matches = new Set();
  const threshold = 3;

  props.tasks.forEach(t => {
    if (t.id === draggingId.value) return;

    const tX = getTaskX(t);
    const tR = tX + getTaskWidth(t);

    if (Math.abs(currentX - tX) < threshold) matches.add(tX);
    if (Math.abs(currentX - tR) < threshold) matches.add(tR);
    if (Math.abs(currentRight - tR) < threshold) matches.add(tR);
    if (Math.abs(currentRight - tX) < threshold) matches.add(tX);
  });

  activeGuides.value = Array.from(matches);
};
const dayScale = computed(() => {
  if (!props.days || props.days.length === 0) return [];
  return props.days.map(d => ({
    label: new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
    weekday: new Date(d).toLocaleDateString('ru-RU', { weekday: 'short' }),
    fullDate: d
  }));
});

const { initInteract, destroyInteract } = useTimelineInteract(props, {
  mainScroll, getTaskX, getTaskWidth, applyPixelsToTask, updateGuides, emit
});

onMounted(initInteract);
onBeforeUnmount(destroyInteract);
// Следим за изменением зума
watch(() => props.dayWidth, (newWidth, oldWidth) => {
  if (!mainScroll.value || !oldWidth) return;

  const scrollElement = mainScroll.value;
  const currentScroll = scrollElement.scrollLeft;
  const viewportWidth = scrollElement.clientWidth;

  const focalPoint = currentScroll + (viewportWidth / 2);

  const ratio = newWidth / oldWidth;

  nextTick(() => {
    const newScroll = (focalPoint * ratio) - (viewportWidth / 2);
    scrollElement.scrollLeft = newScroll;
  });
});
</script>
<style scoped lang="scss">
.editor-layout {
  display: grid;
  grid-template-columns: 140px 1fr;
  grid-template-rows: 45px 1fr 50px;
  height: 100%;
  width: 100%;
  user-select: none;
}

.corner-bg {
  grid-column: 1;
  grid-row: 1;
}

.tracks-sidebar {
  grid-column: 1;
  grid-row: 2;
}

.timeline-view {
  background: #151515;
  overflow: auto !important;
  position: relative;

  &::-webkit-scrollbar { width: 10px; height: 10px; }
  &::-webkit-scrollbar-track { background: #121212; }
  &::-webkit-scrollbar-thumb {
    background: #333; border-radius: 5px; border: 2px solid #121212;
  }
  grid-column: 2;
  grid-row: 2;
}

.smart-guide {
  position: absolute; top: 0; bottom: 0; width: 1px;
  background: #00e5ff; box-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
  z-index: 50; pointer-events: none;
}
</style>
