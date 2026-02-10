import { draggingId, activeGuides } from "../scripts/timelineState";
import interact from "interactjs";

export function useTimelineInteract(props, refs) {
  const { mainScroll, getTaskX, getTaskWidth, applyPixelsToTask, updateGuides, emit } = refs;

  let accumX = 0, accumY = 0, accumW = 0, lastScrollLeft = 0, lastScrollTop = 0;
  let resizeAnchorX = 0;

  const initInteract = () => {
    interact(".task-block")
      .draggable({
        autoScroll: {
          container: mainScroll.value,
          margin: 100,
          distance: 2,
          interval: 1,
        },
        listeners: {
          start(event) {
            const id = parseFloat(event.target.id.replace('task-', ''));
            const task = props.tasks.find(t => t.id === id);
            if (!task) return;

            draggingId.value = id;

            accumX = getTaskX(task);
            accumY = task.trackIndex * props.trackHeight;

            lastScrollLeft = mainScroll.value.scrollLeft;
            lastScrollTop = mainScroll.value.scrollTop;
          },
          move(event) {
            const task = props.tasks.find(t => t.id === draggingId.value);
            if (!task) return;

            const el = mainScroll.value;
            const scrollDiffX = el.scrollLeft - lastScrollLeft;
            const scrollDiffY = el.scrollTop - lastScrollTop;

            let nextX = accumX + event.dx + scrollDiffX;
            let nextY = accumY + event.dy + scrollDiffY;
            nextX = Math.max(0, nextX);

            const maxContentWidth = el.scrollWidth;
            const taskWidth = getTaskWidth(task);
            if (nextX + taskWidth > maxContentWidth) {
              nextX = maxContentWidth - taskWidth;
            }
            nextY = Math.max(0, nextY);
            accumX = nextX;
            accumY = nextY;

            applyPixelsToTask(task, accumX, accumY);
            updateGuides(getTaskX(task), getTaskWidth(task));

            lastScrollLeft = el.scrollLeft;
            lastScrollTop = el.scrollTop;
          },
          end() {
            stopAction();
          }
        }
      })
      .resizable({
        autoScroll: {
          container: mainScroll.value,
          margin: 60,
          distance: 10,
        },
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
            lastScrollLeft = mainScroll.value.scrollLeft;
          },
          move(event) {
            const task = props.tasks.find(t => t.id === draggingId.value);
            if (!task) return;

            const scrollDiffX = mainScroll.value.scrollLeft - lastScrollLeft;

            if (event.edges.left) {
              accumX += event.dx + scrollDiffX;
              const minX = 0;
              const maxX = resizeAnchorX - (props.dayWidth / 24);
              accumX = Math.max(minX, Math.min(accumX, maxX));
              accumW = resizeAnchorX - accumX;
            } else {
              accumW += event.dx + scrollDiffX;
              accumW = Math.max(props.dayWidth / 24, accumW);
            }

            applyPixelsToTask(task, accumX, task.trackIndex * props.trackHeight, accumW);
            updateGuides(getTaskX(task), getTaskWidth(task));

            lastScrollLeft = mainScroll.value.scrollLeft;
          },
          end() {
            stopAction();
          }
        }
      });
  };

  const stopAction = () => {
    draggingId.value = null;
    activeGuides.value = [];
    emit("update:tasks", [...props.tasks]);
  };

  const destroyInteract = () => {
    interact(".task-block").unset();
  };

  return { initInteract, destroyInteract };
}
