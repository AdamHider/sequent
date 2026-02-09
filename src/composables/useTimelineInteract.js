import { draggingId, activeGuides } from "../scripts/timelineState";
import interact from "interactjs";

export function useTimelineInteract(props, refs) {
  const { mainScroll, getTaskX, getTaskWidth, applyPixelsToTask, updateGuides, emit } = refs;

  let accumX = 0, accumY = 0, accumW = 0, grabOffset = 0, resizeAnchorX = 0;

  const getTimelineRect = () => {
    if (!mainScroll.value) return { left: 0, top: 0 };
    return mainScroll.value.querySelector('.timeline-content').getBoundingClientRect();
  };

  const initInteract = () => {
    interact(".task-block")
      .draggable({
        listeners: {
          start(event) {
            // Используем Number() или parseFloat, так как id может быть дробным после Math.random()
            const id = parseFloat(event.target.id.replace('task-', ''));
            const task = props.tasks.find(t => t.id === id);
            if (!task) return;

            draggingId.value = id;
            const timelineRect = getTimelineRect();
            grabOffset = (event.clientX - timelineRect.left + mainScroll.value.scrollLeft) - getTaskX(task);
            accumY = task.trackIndex * props.trackHeight;
          },
          move(event) {
            const task = props.tasks.find(t => t.id === draggingId.value);
            if (!task) return;

            const timelineRect = getTimelineRect();
            accumX = (event.clientX - timelineRect.left + mainScroll.value.scrollLeft) - grabOffset;
            accumY += event.dy;

            applyPixelsToTask(task, accumX, accumY);
            updateGuides(getTaskX(task), getTaskWidth(task));
          },
          end() {
            stopAction();
          }
        }
      })
      .resizable({
        edges: { left: true, right: true },
        listeners: {
          start(event) {
            const id = parseFloat(event.target.id.replace('task-', ''));
            const task = props.tasks.find(t => t.id === id);
            if (!task) return;

            draggingId.value = id;
            accumX = getTaskX(task);
            accumW = getTaskWidth(task);
            resizeAnchorX = accumX + accumW;
          },
          move(event) {
            const task = props.tasks.find(t => t.id === draggingId.value);
            if (!task) return;

            if (event.edges.left) {
              accumX += event.dx;
              const minX = 0;
              const maxX = resizeAnchorX - (props.dayWidth / 24);
              accumX = Math.max(minX, Math.min(accumX, maxX));
              accumW = resizeAnchorX - accumX;
            } else {
              accumW += event.dx;
              accumW = Math.max(props.dayWidth / 24, accumW);
            }

            applyPixelsToTask(task, accumX, task.trackIndex * props.trackHeight, accumW);
            updateGuides(getTaskX(task), getTaskWidth(task));
          },
          end() {
            stopAction();
          }
        }
      });
  };

  // ОСНОВНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ
  const stopAction = () => {
    draggingId.value = null;
    activeGuides.value = [];
    
    // Вместо "change" отправляем "update:tasks", 
    // создавая копию массива для триггера реактивности
    emit("update:tasks", [...props.tasks]); 
  };

  const destroyInteract = () => {
    interact(".task-block").unset();
  };

  return { initInteract, destroyInteract };
}