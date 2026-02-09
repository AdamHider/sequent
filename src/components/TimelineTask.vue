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
      <div class="text-bold ellipsis q-mt-xs" style="font-size: 11px; line-height: 1.1">
        {{ task.label }}
      </div>
    </div>

    <div class="resizer-right"></div>
    <q-menu context-menu dark>
      <q-list dense style="min-width: 150px">
        <q-item clickable v-close-popup @click="openEditDialog">
          <q-item-section avatar><q-icon name="edit" size="xs"></q-icon></q-item-section>
          <q-item-section>Изменить</q-item-section>
        </q-item>

        <q-item clickable v-close-popup @click="onDuplicate">
          <q-item-section avatar><q-icon name="content_copy" size="xs"></q-icon></q-item-section>
          <q-item-section>Дублировать</q-item-section>
        </q-item>

        <q-separator dark />

        <q-item clickable v-close-popup @click="onRemove" class="text-negative">
          <q-item-section avatar><q-icon name="delete" color="negative" size="xs"></q-icon></q-item-section>
          <q-item-section>Удалить</q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 400px" dark class="bg-grey-10">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Редактировать клип</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-input v-model="editForm.label" label="Название" dark filled class="q-mb-md" />
          <q-input v-model="editForm.description" label="Описание" dark filled type="textarea" rows="2" class="q-mb-md" />

          <div class="row q-col-gutter-sm">
            <div class="col-12">
              <div class="text-caption text-grey-5 q-mb-xs">Цвет клипа:</div>
              <q-color v-model="editForm.color" no-header dark class="full-width" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn unelevated label="Сохранить" color="primary" @click="saveTask" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue';
import { useTasks } from '../composables/useTasks'; // Путь к файлу

const props = defineProps({
  task: Object,
  tasks: Array,
  isDragging: Boolean,
  x: Number,
  width: Number,
  height: Number
});

const emit = defineEmits(['update:tasks', 'edit', 'change']);

const tasksRef = computed({
  get: () => props.tasks,
  set: (val) => emit('update:tasks', val)
});

const { duplicateTask, removeTask: deleteTask } = useTasks(tasksRef, ref([]));

// --- ЛОКАЛЬНАЯ ЛОГИКА (Диалог) ---
const showEditDialog = ref(false);
const editForm = reactive({ label: '', description: '', color: '' });

const openEditDialog = () => {
  editForm.label = props.task.label;
  editForm.description = props.task.description || '';
  editForm.color = props.task.color || '#3949ab';
  showEditDialog.value = true;
};

const saveTask = () => {
  const newTasks = props.tasks.map(t =>
    t.id === props.task.id ? { ...t, ...editForm } : t
  );
  emit('update:tasks', newTasks);
};

// --- МЕТОДЫ-ОБЕРТКИ ДЛЯ ШАБЛОНА ---
const onDuplicate = () => {
  duplicateTask(props.task);
};

const onRemove = () => {
  deleteTask(props.task.id); // Вызываем общую логику из useTasks
};

// --- ВЫЧИСЛЕНИЯ (Стили и Время) ---
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
