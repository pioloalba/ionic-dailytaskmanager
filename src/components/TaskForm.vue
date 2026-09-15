<template>
  <form @submit.prevent="submitForm">
    <ion-list>
      <ion-item>
        <ion-input
          v-model="form.title"
          label="Title"
          label-placement="stacked"
          placeholder="e.g. Finish assignment"
        />
      </ion-item>

      <ion-item>
        <ion-textarea
          v-model="form.description"
          label="Description"
          label-placement="stacked"
          placeholder="Add some details (optional)"
          :auto-grow="true"
        />
      </ion-item>

      <ion-item>
        <ion-label>Due Date</ion-label>
        <ion-datetime-button datetime="task-due-date" />
      </ion-item>
      <ion-modal :keep-contents-mounted="true">
        <ion-datetime
          id="task-due-date"
          v-model="form.dueDate"
          presentation="date"
          :min="minimumDate"
        />
      </ion-modal>

      <ion-item>
        <ion-select v-model="form.priority" label="Priority" label-placement="stacked">
          <ion-select-option value="Low">Low</ion-select-option>
          <ion-select-option value="Medium">Medium</ion-select-option>
          <ion-select-option value="High">High</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-select v-model="form.status" label="Status" label-placement="stacked">
          <ion-select-option value="Pending">Pending</ion-select-option>
          <ion-select-option value="Completed">Completed</ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>

    <ion-button class="save-button" expand="block" type="submit">
      {{ task ? 'Update Task' : 'Save Task' }}
    </ion-button>
  </form>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonDatetime,
  IonDatetimeButton,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTextarea
} from '@ionic/vue'
import { computed, reactive, watch } from 'vue'
import type { Task, TaskPriority, TaskStatus } from '../types/task'

const props = defineProps<{ task?: Task | null }>()
const emit = defineEmits<{
  save: [task: Omit<Task, 'id'>]
}>()

const today = new Date().toISOString().split('T')[0]
const form = reactive({
  title: '',
  description: '',
  dueDate: today,
  priority: 'Medium' as TaskPriority,
  status: 'Pending' as TaskStatus
})

const minimumDate = computed(() => new Date().toISOString().split('T')[0])

function copyTaskToForm(task: Task | null | undefined) {
  form.title = task?.title ?? ''
  form.description = task?.description ?? ''
  form.dueDate = task?.dueDate ?? today
  form.priority = task?.priority ?? 'Medium'
  form.status = task?.status ?? 'Pending'
}

watch(() => props.task, copyTaskToForm, { immediate: true })

function submitForm() {
  emit('save', {
    ...form,
    dueDate: form.dueDate ? form.dueDate.split('T')[0] : ''
  })
}
</script>

<style scoped>
.save-button {
  margin: 20px 16px 8px;
}
</style>
