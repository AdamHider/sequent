<template>
  <div
    :id="'task-' + task.id"
    class="task-block shadow-10 rounded-borders"
    :class="{ 'is-dragging': isDragging }"
    :style="taskStyle"
  >
    <div class="resizer-left"></div>

    <div class="task-inner q-px-sm column justify-center full-height no-pointer-events overflow-hidden">
      <div class="row justify-between full-width no-wrap text-grey-4" style="font-size: 9px; line-height: 1">
        <span>{{ timeRange.start }}</span>
        <span>{{ timeRange.end }}</span>
      </div>
      <div class="text-bold ellipsis q-mt-xs" style="font-size: 11px; line-height: 1.1">{{ task.label }}</div>
      <div class="ellipsis text-grey-5" style="font-size: 9px">{{ task.description }}</div>
    </div>

    <div class="resizer-right"></div>

    <q-menu context-menu dark>
      <q-list dense style="min-width: 120px">
        <q-item clickable v-close-popup @click="$emit('edit', task)">
          <q-item-section avatar><q-icon name="edit" size="xs"/></q-item-section>
          <q-item-section>Изменить</q-item-section>
        </q-item>
        <q-item clickable v-close-popup class="text-negative" @click="$emit('delete', task.id)">
          <q-item-section avatar><q-icon name="delete" size="xs" color="negative"/></q-item-section>
          <q-item-section>Удалить</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  task: Object,
  isDragging: Boolean,
  x: Number,
  width: Number,
  height: Number
});

const taskStyle = computed(() => ({
  transform: `translate(${props.x}px, ${props.task.trackIndex * (props.height + 10)}px)`,
  width: `${props.width}px`,
  height: `${props.height}px`,
  backgroundColor: props.task.color || "#3949ab",
  position: 'absolute',
  marginTop: '5px'
}));

const formatTime = (h) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const timeRange = computed(() => ({
  start: formatTime(props.task.startHour),
  end: formatTime(props.task.startHour + props.task.durationHours)
}));
</script>
