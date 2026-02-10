<template>
  <div class="grid-layer absolute-full pointer-events-none">
    <div v-for="(group, gIndex) in groups" :key="gIndex"
         class="grid-row"
         :style="getRowStyle(gIndex)">
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  groups: Array,
  trackHeight: Number,
  dayWidth: Number
});

const accentStep = computed(() => {
  if (props.dayWidth > 500) return 2;
  if (props.dayWidth > 300) return 3;
  if (props.dayWidth > 100) return 6;
  return 12;
});

const getRowStyle = (idx) => {
  const hourWidth = props.dayWidth / 24;
  const accentWidth = hourWidth * accentStep.value;
  return {
    height: `${props.trackHeight}px`,
    paddingTop: '5px',
    backgroundImage: `
      linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
      linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
    `,
    backgroundSize: `
      ${props.dayWidth}px 100%,
      ${accentWidth}px 100%,
      ${hourWidth}px 100%
    `,
    backgroundPosition: '0 0, 0 0, 0 0',
    borderBottom: '1px solid #2a2a2a'
  };
};
</script>

<style scoped lang="scss">
.grid-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: hidden;
}
.grid-row {
  width: 100%;
  box-sizing: border-box;
}
</style>
