<template>
  <div class="grid-layer absolute-full pointer-events-none">
    <div v-for="(group, gIndex) in groups" :key="gIndex" 
         class="grid-row border-bottom"
         :style="getRowStyle(gIndex)">
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  groups: Array,
  trackHeight: Number,
  dayWidth: Number
});

const getRowStyle = (idx) => ({
  height: `${props.trackHeight}px`,
  backgroundImage: `
    linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
    linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
  `,
  backgroundSize: `
    ${props.dayWidth}px 100%, 
    ${props.dayWidth / 24}px 100%
  `,
  backgroundPosition: '0 0, 0 0'
});
</script>
<style scoped lang="scss">
.grid-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
}
.grid-row {
  width: 100%;
  border-bottom: 1px solid #2a2a2a;
}
</style>
