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
      <div class="dates-bar bg-grey-10 border-bottom overflow-hidden" ref="headerScroll">
        <div class="flex no-wrap" :style="{ width: contentWidth + 'px'}">
          <div v-for="(day, index) in dayScale" :key="day.fullDate"
              class="day-header border-right flex column justify-center items-center no-shrink"
              :style="{ width: dayWidth + 'px', minWidth: dayWidth + 'px' }">
            <div class="text-caption text-uppercase text-grey-5" style="font-size: 0.65rem">
              {{ day.weekday }}
            </div>
            <div class="text-bold text-white">{{ day.label }}</div>
          </div>
        </div>
      </div>
      <div class="timeline-view overflow-auto" @scroll="syncScrolls" ref="mainScroll">
        <div class="timeline-content relative-position" :style="contentSizeStyle">
          <TimelineGrid :groups="groups" :track-height="trackHeight" :day-width="dayWidth" />
          <div v-for="lineX in activeGuides" :key="lineX" class="smart-guide" :style="{ transform: `translateX(${lineX}px)` }" />
          <TimelineTask
            v-for="task in tasks"
            :key="task.id"
            :id="'task-' + task.id"
            :task="task"
            :is-dragging="draggingId === task.id"
            :x="getTaskX(task)"
            :width="getTaskWidth(task)"
            :height="trackHeight - 10"
            @edit="editTask"
            @delete="deleteTask"
          />

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import TimelineTask from "./TimelineTask.vue";
import TimelineGrid from "./TimelineGrid.vue"; // Его тоже можно выделить
import TracksSidebar from "./TracksSidebar.vue"; // Его тоже можно выделить
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

const moveGroup = (index, dir) => emit('move-group', { index, dir });
const insertGroup = (atIndex) => emit('insert-group', atIndex);
const editGroup = (group) => emit('edit-group', group);
const deleteGroup = (index) => emit('request-delete-group', { index, group: props.groups[index] });

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
  headerScroll.value.scrollLeft = e.target.scrollLeft;
  sidebarScroll.value.scrollTop = e.target.scrollTop;
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

const deleteTask = (id) => {
  emit('delete-task', id);
};

const editTask = (task) => {
  emit('edit-task', task);
};

const { initInteract, destroyInteract } = useTimelineInteract(props, {
  mainScroll, getTaskX, getTaskWidth, applyPixelsToTask, updateGuides, emit
});

onMounted(initInteract);
onBeforeUnmount(destroyInteract);

</script>
<style scoped lang="scss">
.editor-layout {
  display: grid;
  grid-template-columns: 140px 1fr;
  grid-template-rows: 45px 1fr;
  height: 100%;
  width: 100%;
  user-select: none;
}

.corner-bg {
  grid-column: 1;
  grid-row: 1;
}

.dates-bar {
  grid-column: 2;
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

.border-right { border-right: 1px solid #2a2a2a; }
.border-bottom { border-bottom: 1px solid #2a2a2a; }
.dates-bar, .tracks-sidebar { &::-webkit-scrollbar { display: none; } }
</style>
