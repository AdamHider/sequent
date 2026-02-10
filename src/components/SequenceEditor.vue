<template>
  <div class="sequence-editor shadow-24 rounded-borders overflow-hidden bg-dark text-white full-height no-select">
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

      <div class="timeline-view" @scroll="syncScrolls" ref="mainScroll">
        <div class="timeline-content relative-position" :style="contentSizeStyle">
          <TimelineGrid
            :groups="groups"
            :track-height="trackHeight"
            :day-width="dayWidth"
          />

          <div
            v-for="lineX in activeGuides"
            :key="lineX"
            class="smart-guide"
            :style="{ transform: `translateX(${lineX}px)` }"
          />

          <TimelineTask
            v-for="task in tasks"
            :key="task.id"
            :id="`task-${task.id}`"
            v-model:tasks="localTasks"
            :task="task"
            :is-dragging="draggingId === task.id"
            :x="getTaskX(task)"
            :width="getTaskWidth(task)"
            :height="trackHeight - 10"
            class="task-block"
          />
        </div>
      </div>

      <div class="vertical-scrollbar-zone">
        <TimelineVerticalScrollbar
          :trackHeight="trackHeight"
          :scrollTop="verticalScrollState.top"
          :scrollHeight="verticalScrollState.height"
          :clientHeight="verticalScrollState.client"
          @update:trackHeight="handleVerticalZoom"
          @update:scrollTop="applyVerticalScroll"
        />
      </div>

      <div class="scrollbar-zone bg-grey-10 border-top flex items-center">
        <TimelineScrollbar
          :scrollLeft="scrollState.left"
          :scrollWidth="scrollState.width"
          :clientWidth="scrollState.client"
          :dayWidth="dayWidth"
          @update:scrollLeft="applyScroll"
          @update:dayWidth="handleZoom"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onBeforeUnmount, nextTick, watch } from "vue";
import TimelineTask from "./TimelineTask.vue";
import TimelineGrid from "./TimelineGrid.vue";
import TracksSidebar from "./TracksSidebar.vue";
import TimelineDatesBar from "./TimelineDatesBar.vue";
import TimelineScrollbar from "./TimelineScrollbar.vue";
import TimelineVerticalScrollbar from "./TimelineVerticalScrollbar.vue";
import { useTimelineCoords } from "../composables/useTimelineCoords";
import { useTimelineInteract } from "../composables/useTimelineInteract";
import { useTimelineScroll } from "../composables/useTimelineScroll";
import { draggingId, activeGuides } from "../scripts/timelineState";

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  days: { type: Array, required: true },
});

const emit = defineEmits(['update:groups', 'update:tasks', 'edit-track', 'edit-task']);

const dayWidth = ref(200);
const trackHeight = ref(60);

const mainScroll = ref(null);
const headerScroll = ref(null);
const sidebarScroll = ref(null);

const timelineParams = reactive({
  ...props,
  dayWidth,
  trackHeight
});

watch(() => props.tasks, (val) => timelineParams.tasks = val);
watch(() => props.groups, (val) => timelineParams.groups = val);

const {
  contentWidth, contentHeight, getTaskX, getTaskWidth, applyPixelsToTask
} = useTimelineCoords(timelineParams);

const {
  scrollState, verticalScrollState, syncScrolls,
  applyScroll, applyVerticalScroll, handleZoom,
  handleVerticalZoom, updateScrollDimensions
} = useTimelineScroll(
  { mainScroll, headerScroll, sidebarScroll },
  { dayWidth, trackHeight }
);

const { initInteract, destroyInteract } = useTimelineInteract(timelineParams, {
  mainScroll, getTaskX, getTaskWidth, applyPixelsToTask, updateGuides: handleUpdateGuides, emit
});

const contentSizeStyle = computed(() => ({
  width: `${contentWidth.value}px`,
  height: `${contentHeight.value}px`
}));

const localGroups = computed({
  get: () => props.groups || [],
  set: (v) => emit('update:groups', v)
});

const localTasks = computed({
  get: () => props.tasks || [],
  set: (v) => emit('update:tasks', v)
});

function handleUpdateGuides(currentX, currentWidth) {
  const matches = new Set();
  const threshold = 3;
  const currentRight = currentX + currentWidth;

  (props.tasks || []).forEach(t => {
    if (t.id === draggingId.value) return;
    const tX = getTaskX(t);
    const tR = tX + getTaskWidth(t);

    if (Math.abs(currentX - tX) < threshold) matches.add(tX);
    if (Math.abs(currentX - tR) < threshold) matches.add(tR);
    if (Math.abs(currentRight - tR) < threshold) matches.add(tR);
    if (Math.abs(currentRight - tX) < threshold) matches.add(tX);
  });
  activeGuides.value = Array.from(matches);
}

onMounted(async () => {
  initInteract();
  await nextTick();
  updateScrollDimensions();
});

onBeforeUnmount(destroyInteract);

watch(() => props.groups, async () => {
  await nextTick();
  updateScrollDimensions();
}, { deep: true });

const getTimelineCenter = () => {
  const el = mainScroll.value;
  if (!el || !props.days.length) return { day: 0, hour: 0, trackIndex: 0 };
  const centerPx = el.scrollLeft + (el.clientWidth / 2);

  let totalDays = centerPx / dayWidth.value;
  const maxDays = props.days.length - 1;
  if (totalDays > maxDays) totalDays = maxDays;
  if (totalDays < 0) totalDays = 0;
  const day = Math.floor(totalDays);
  const hour = (totalDays - day) * 24;
  const trackIndex = Math.floor((el.scrollTop + el.clientHeight / 2) / trackHeight.value);
  return {
    day,
    hour: Math.round(hour * 100) / 100,
    trackIndex: Math.max(0, Math.min(trackIndex, props.groups.length - 1))
  };
};

defineExpose({
  getTimelineCenter
});

</script>
<style scoped lang="scss">
.editor-layout {
  display: grid;
  grid-template-columns: 140px 1fr 17px;
  grid-template-rows: 45px 1fr 17px;
  height: calc(100% - 67px);
  width: 100%;
}

.timeline-view {
  background: #151515;
  overflow: auto !important;
  position: relative;
  grid-column: 2;
  grid-row: 2;
  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;
}

.tracks-sidebar {
  grid-column: 1;
  grid-row: 2;
  z-index: 10;
}

.vertical-scrollbar-zone {
  grid-column: 3;
  grid-row: 2;
  background: #111;
  border-left: 1px solid #222;
}

.scrollbar-zone {
  grid-column: 2;
  grid-row: 3;
  z-index: 10;
}

.smart-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #00e5ff;
  z-index: 50;
  pointer-events: none;
}
</style>
