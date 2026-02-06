import { computed } from 'vue';

export function useTimelineCoords(props) {
  const HOUR_WIDTH = computed(() => props.dayWidth / 24);
  const contentWidth = computed(() => props.days.length * props.dayWidth);
  const contentHeight = computed(() => props.groups.length * props.trackHeight);

  const getTaskX = (task) => 
    task.startDay * props.dayWidth + task.startHour * HOUR_WIDTH.value;
  
  const getTaskWidth = (task) => 
    task.durationHours * HOUR_WIDTH.value;

  const applyPixelsToTask = (task, x, y, width) => {
    const totalHours = Math.round(x / HOUR_WIDTH.value);
    task.startDay = Math.max(0, Math.floor(totalHours / 24));
    task.startHour = Math.max(0, totalHours % 24);
    task.trackIndex = Math.max(0, Math.min(Math.round(y / props.trackHeight), props.groups.length - 1));
    if (width !== undefined) {
      task.durationHours = Math.max(0.5, Math.round(width / HOUR_WIDTH.value));
    }
  };

  return { contentWidth, contentHeight, getTaskX, getTaskWidth, applyPixelsToTask };
}