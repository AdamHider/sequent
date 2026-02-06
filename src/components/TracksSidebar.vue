<template>
  <div class="tracks-sidebar bg-grey-10 border-right overflow-hidden">
    <div :style="{ height: contentHeight + 'px', minHeight: '100%' }">
      <div v-for="(group, index) in groups" :key="group.id" 
           class="track-label border-bottom q-px-md flex items-center text-white relative-position"
           :style="{ height: trackHeight + 'px' }">
        
        <q-icon :name="group.icon || 'layers'" :style="{ color: group.color }" size="xs" class="q-mr-sm" />
        <span class="text-grey-4 ellipsis text-caption">{{ group.name }}</span>
        
        <q-menu context-menu dark>
          <q-list dense style="min-width: 180px">
            <q-item clickable v-close-popup @click="moveTrack(index, -1)" :disable="index === 0">
              <q-item-section avatar><q-icon name="arrow_upward" size="xs"/></q-item-section>
              <q-item-section>Переместить вверх</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="moveTrack(index, 1)" :disable="index === groups.length - 1">
              <q-item-section avatar><q-icon name="arrow_downward" size="xs"/></q-item-section>
              <q-item-section>Переместить вниз</q-item-section>
            </q-item>

            <q-separator dark />

            <q-item clickable v-close-popup @click="addTrack(index)">
              <q-item-section avatar><q-icon name="add" size="xs"/></q-item-section>
              <q-item-section>Вставить выше</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="addTrack(index + 1)">
              <q-item-section avatar><q-icon name="add" size="xs"/></q-item-section>
              <q-item-section>Вставить ниже</q-item-section>
            </q-item>

            <q-separator dark />

            <q-item clickable v-close-popup @click="openEditDialog(group, index)">
              <q-item-section avatar><q-icon name="edit" size="xs"/></q-item-section>
              <q-item-section>Изменить дорожку</q-item-section>
            </q-item>
            
            <q-item clickable v-close-popup @click="removeTrack(index)" class="text-negative">
              <q-item-section avatar><q-icon name="delete" color="negative" size="xs"/></q-item-section>
              <q-item-section>Удалить дорожку</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </div>
    </div>

    <q-dialog v-model="editState.show" persistent>
      <q-card style="min-width: 350px" dark class="bg-grey-10">
        <q-card-section>
          <div class="text-h6">Настройки дорожки</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input v-model="editState.form.name" label="Название" dark filled class="q-mb-md" />
          
          <div class="text-caption text-grey-5 q-mb-xs">Цвет дорожки и клипов:</div>
          <q-color v-model="editState.form.color" no-header class="my-picker" dark />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn flat label="Сохранить" color="primary" @click="saveTrackEdit" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const props = defineProps({
  groups: Array,
  tasks: Array,
  trackHeight: Number,
  contentHeight: Number
});

const emit = defineEmits(['update:groups', 'update:tasks']);

// Локальное состояние для диалога
const editState = reactive({
  show: false,
  index: -1,
  form: {
    name: '',
    color: ''
  }
});

// --- ЛОГИКА ---

const openEditDialog = (group, index) => {
  editState.index = index;
  editState.form = { ...group };
  editState.show = true;
};

const saveTrackEdit = () => {
  const newGroups = [...props.groups];
  newGroups[editState.index] = { ...newGroups[editState.index], ...editState.form };
  
  // При изменении цвета дорожки, обновляем цвет всех клипов на ней
  const newTasks = props.tasks.map(t => {
    if (t.trackIndex === editState.index) {
      return { ...t, color: editState.form.color };
    }
    return t;
  });

  emit('update:groups', newGroups);
  emit('update:tasks', newTasks);
};

const moveTrack = (index, dir) => {
  const newIndex = index + dir;
  const newGroups = [...props.groups];
  const [movedGroup] = newGroups.splice(index, 1);
  newGroups.splice(newIndex, 0, movedGroup);

  const newTasks = props.tasks.map(task => {
    if (task.trackIndex === index) return { ...task, trackIndex: newIndex };
    if (task.trackIndex === newIndex) return { ...task, trackIndex: index };
    return task;
  });

  emit('update:groups', newGroups);
  emit('update:tasks', newTasks);
};

const addTrack = (atIndex) => {
  const newGroups = [...props.groups];
  newGroups.splice(atIndex, 0, {
    id: Date.now(),
    name: `New Track ${newGroups.length + 1}`,
    color: '#777',
    icon: 'reorder'
  });

  const newTasks = props.tasks.map(task => {
    if (task.trackIndex >= atIndex) return { ...task, trackIndex: task.trackIndex + 1 };
    return task;
  });

  emit('update:groups', newGroups);
  emit('update:tasks', newTasks);
};

const removeTrack = (index) => {
  const newGroups = props.groups.filter((_, i) => i !== index);
  const newTasks = props.tasks
    .filter(t => t.trackIndex !== index)
    .map(t => {
      if (t.trackIndex > index) return { ...t, trackIndex: t.trackIndex - 1 };
      return t;
    });

  emit('update:groups', newGroups);
  emit('update:tasks', newTasks);
};
</script>