export function useTracks(groups, tasks) {
  const addTrack = (atIndex = null) => {
    const newTrack = {
      id: Date.now(),
      name: `New Track ${groups.value.length + 1}`,
      icon: 'layers',
      color: '#5c6bc0'
    };

    if (atIndex !== null && atIndex >= 0) {
      // Вставка в середину
      groups.value.splice(atIndex, 0, newTrack);
      // Сдвигаем клипы
      tasks.value = tasks.value.map(t => ({
        ...t,
        trackIndex: t.trackIndex >= atIndex ? t.trackIndex + 1 : t.trackIndex
      }));
    } else {
      // Добавление в конец
      groups.value.push(newTrack);
    }
  };

  const removeTrack = (index) => {
    // Удаляем клипы на дорожке
    tasks.value = tasks.value.filter(t => t.trackIndex !== index);
    // Сдвигаем индексы остальных клипов
    tasks.value = tasks.value.map(t => ({
      ...t,
      trackIndex: t.trackIndex > index ? t.trackIndex - 1 : t.trackIndex
    }));
    // Удаляем саму дорожку
    groups.value.splice(index, 1);
  };

  const moveTrack = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= groups.value.length) return;

    // Меняем местами в массиве групп
    const tempGroups = [...groups.value];
    const [movedGroup] = tempGroups.splice(index, 1);
    tempGroups.splice(newIndex, 0, movedGroup);
    groups.value = tempGroups;

    // Обновляем trackIndex у клипов
    tasks.value = tasks.value.map(t => {
      if (t.trackIndex === index) return { ...t, trackIndex: newIndex };
      if (t.trackIndex === newIndex) return { ...t, trackIndex: index };
      return t;
    });
  };

  return { addTrack, removeTrack, moveTrack };
}
