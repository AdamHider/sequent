<template>
  <div class="vertical-scrollbar-container" ref="trackRef">
    <div
      ref="handleRef"
      class="scroll-handle-vertical"
      :style="handleStyle"
    >
      <div class="resize-edge top-edge"></div>
      <div class="handle-content"></div>
      <div class="resize-edge bottom-edge"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import interact from 'interactjs';

const props = defineProps({
  scrollTop: { type: Number, default: 0 },
  scrollHeight: { type: Number, default: 0 },
  clientHeight: { type: Number, default: 0 },
  trackHeight: { type: Number, default: 60 }
});

const emit = defineEmits(['update:scrollTop', 'update:trackHeight']);

const trackRef = ref(null);
const handleRef = ref(null);

const handleStyle = computed(() => {
  if (!props.scrollHeight || props.scrollHeight === 0) return { display: 'none' };

  const heightRatio = Math.min(props.clientHeight / props.scrollHeight, 1);
  const clampedHeightPercent = Math.max(heightRatio * 100, 3);

  const maxScrollTop = props.scrollHeight - props.clientHeight;
  const topPercent = maxScrollTop > 0
    ? (props.scrollTop / maxScrollTop) * (100 - clampedHeightPercent)
    : 0;

  return {
    height: `${clampedHeightPercent}%`,
    top: `${topPercent}%`,
    width: '100%',
    position: 'absolute'
  };
});

onMounted(() => {
  interact(handleRef.value)
    .draggable({
      listeners: {
        move(event) {
          const deltaY = event.dy;
          const scrollFactor = props.scrollHeight / trackRef.value.clientHeight;
          emit('update:scrollTop', props.scrollTop + (deltaY * scrollFactor));
        }
      }
    })
    .resizable({
      edges: { top: '.top-edge', bottom: '.bottom-edge' },
      listeners: {
        move(event) {
          const isTop = event.edges.top;
          const deltaPy = event.deltaRect.height;

          if (Math.abs(deltaPy) < 0.1) return;

          const trackHeightPx = trackRef.value.clientHeight;
          const currentHandleHeight = handleRef.value.offsetHeight;

          const isFullHeight = props.scrollHeight <= props.clientHeight + 1;
          if (isFullHeight && deltaPy > 0) return;

          let newHandleHeight = currentHandleHeight + deltaPy;

          if (newHandleHeight >= trackHeightPx) {
            newHandleHeight = trackHeightPx;

            const totalTracks = props.scrollHeight / props.trackHeight;
            const minTrackHeight = props.clientHeight / totalTracks;

            emit('update:trackHeight', {
              value: minTrackHeight,
              anchor: isTop ? 'top' : 'bottom'
            });
            return;
          }
          const safeHandleHeight = Math.max(newHandleHeight, 15);

          const newScrollHeight = (props.clientHeight * trackHeightPx) / safeHandleHeight;
          const totalTracks = props.scrollHeight / props.trackHeight;
          const potentialTrackHeight = newScrollHeight / totalTracks;

          const MIN_TRACK = 30;
          const MAX_TRACK = 300;

          const clampedHeight = Math.max(MIN_TRACK, Math.min(MAX_TRACK, potentialTrackHeight));

          emit('update:trackHeight', {
            value: clampedHeight,
            anchor: isTop ? 'top' : 'bottom'
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
.vertical-scrollbar-container {
  width: 16px;
  height: 100%;
  position: relative;
  background: #111;
  border-left: 1px solid #333;
}
.scroll-handle-vertical {
  width: 100%;
  background: #444;
  border-radius: 4px;
  position: absolute;
  display: flex;
  flex-direction: column;
}
.resize-edge {
  height: 12px;
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  cursor: ns-resize;
  &:hover { background: rgba(0, 229, 255, 0.4); }
}
.handle-content { flex: 1; }
</style>
