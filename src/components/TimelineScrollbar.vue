<template>
  <div class="scrollbar-container full-width bg-dark" ref="trackRef">
    <div
      ref="handleRef"
      class="scroll-handle"
      :style="handleStyle"
    >
      <div class="resize-edge left-edge"></div>
      <div class="handle-content"></div>
      <div class="resize-edge right-edge"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import interact from 'interactjs';

const props = defineProps({
  scrollLeft: { type: Number, default: 0 },
  scrollWidth: { type: Number, default: 0 },
  clientWidth: { type: Number, default: 0 },
  dayWidth: { type: Number, default: 200 }
});

const emit = defineEmits(['update:scrollLeft', 'update:dayWidth']);

const trackRef = ref(null);
const handleRef = ref(null);

const handleStyle = computed(() => {
  if (!props.scrollWidth || props.scrollWidth === 0) return { display: 'none' };

  const rawWidthRatio = props.clientWidth / props.scrollWidth;
  const clampedWidthPercent = Math.max(rawWidthRatio * 100, 3);

  const maxScrollLeft = props.scrollWidth - props.clientWidth;
  const leftPercent = maxScrollLeft > 0
    ? (props.scrollLeft / maxScrollLeft) * (100 - clampedWidthPercent)
    : 0;

  return {
    width: `${clampedWidthPercent}%`,
    left: `${leftPercent}%`,
    position: 'absolute'
  };
});

onMounted(() => {
  if (!handleRef.value) return;

  interact(handleRef.value)
    .draggable({
      cursorChecker: () => 'grab',
      listeners: {
        move(event) {
          const deltaX = event.dx;
          const scrollFactor = props.scrollWidth / trackRef.value.clientWidth;
          emit('update:scrollLeft', props.scrollLeft + (deltaX * scrollFactor));
        }
      }
    })
    .resizable({
      edges: { left: '.left-edge', right: '.right-edge' },
      listeners: {
        move(event) {
          const isLeft = event.edges.left;
          const deltaPx = event.deltaRect.width;

          const isFullWidth = props.scrollWidth <= props.clientWidth + 1;

          if (isFullWidth && deltaPx > 0) return;

          const trackWidth = trackRef.value.clientWidth;
          const currentHandleWidth = handleRef.value.offsetWidth;

          let newHandleWidth = currentHandleWidth + deltaPx;

          if (newHandleWidth >= trackWidth) {
            newHandleWidth = trackWidth;
            const minDayWidth = (props.clientWidth / (props.scrollWidth / props.dayWidth));
            emit('update:dayWidth', { value: minDayWidth, anchor: isLeft ? 'left' : 'right' });
            return;
          }

          const safeHandleWidth = Math.max(newHandleWidth, 15);
          const newScrollWidth = (props.clientWidth * trackWidth) / safeHandleWidth;
          const totalDays = props.scrollWidth / props.dayWidth;
          const potentialDayWidth = newScrollWidth / totalDays;

          const clampedWidth = Math.max(50, Math.min(3000, potentialDayWidth));

          emit('update:dayWidth', {
            value: clampedWidth,
            anchor: isLeft ? 'left' : 'right'
          });
        }
      }
    });
});

onBeforeUnmount(() => {
  if (handleRef.value) interact(handleRef.value).unset();
});
</script>

<style scoped lang="scss">
.scrollbar-container {
  height: 15px;
  margin: 0 10px;
  position: relative;
  background: #111;
  border-radius: 4px;
  grid-column: 2;
  overflow: hidden;
}

.scroll-handle {
  height: 100%;
  background: #444;
  border-radius: 4px;
  touch-action: none;
  display: flex;
  align-items: center;
  border: 1px solid #555;
  box-sizing: border-box;
}

.handle-content {
  flex: 1;
  height: 100%;
}

.resize-edge {
  width: 12px;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  cursor: ew-resize;
  z-index: 10;
  &:hover {
    background: rgba(0, 229, 255, 0.4);
  }
}

.left-edge { border-right: 1px solid rgba(0,0,0,0.2); }
.right-edge { border-left: 1px solid rgba(0,0,0,0.2); }
</style>
