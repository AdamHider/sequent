export function useTasks(tasks, groups) {
  const addTask = (trackIndex = 0, startHour = 4) => {
    const newId = Date.now() + Math.random();
    tasks.value.push({
      id: newId,
      label: 'New Clip',
      trackIndex,
      startDay: 0,
      startHour,
      durationHours: 12,
      color: groups.value[trackIndex]?.color || '#3949ab'
    });
  };

  const duplicateTask = (task) => {
    const newTask = {
      ...JSON.parse(JSON.stringify(task)),
      id: Date.now() + Math.random(),
      label: task.label + ' (copy)',
      startHour: task.startHour + task.durationHours
    };

    // Логика перехода на след. день
    if (newTask.startHour >= 24) {
      newTask.startDay += Math.floor(newTask.startHour / 24);
      newTask.startHour %= 24;
    }

    tasks.value.push(newTask);
  };

  const removeTask = (taskId) => {
    tasks.value = tasks.value.filter(t => t.id !== taskId);
  };

  return { addTask, duplicateTask, removeTask };
}