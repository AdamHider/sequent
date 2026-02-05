import { ref } from 'vue';

// Эти переменные станут "глобальными" для всех, кто импортирует этот файл
export const draggingId = ref(null);
export const activeGuides = ref(null);

// Можно также вынести состояние зума или выделенного клипа, если нужно
export const selectedTaskId = ref(null);