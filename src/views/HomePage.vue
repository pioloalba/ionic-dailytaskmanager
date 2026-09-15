<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="app-toolbar">
        <ion-title>Daily Task Manager</ion-title>
        <ion-buttons slot="end">
          <ion-button class="add-task-button" @click="openAddForm">
            <ion-icon :icon="addOutline" slot="start" />
            Add Task
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="page-content">
        <ion-card class="welcome-card">
          <ion-card-header>
            <ion-card-title>Stay on top of your day</ion-card-title>
            <ion-card-subtitle>{{ filteredTasks.length }} task(s) shown</ion-card-subtitle>
          </ion-card-header>
        </ion-card>

        <ion-searchbar v-model="searchText" placeholder="Search title or description" />

        <ion-segment v-model="statusFilter" aria-label="Filter tasks">
          <ion-segment-button value="All"><ion-label>All</ion-label></ion-segment-button>
          <ion-segment-button value="Pending"><ion-label>Pending</ion-label></ion-segment-button>
          <ion-segment-button value="Completed"><ion-label>Completed</ion-label></ion-segment-button>
        </ion-segment>

        <ion-item lines="none">
          <ion-select v-model="sortBy" label="Sort by" label-placement="stacked">
            <ion-select-option value="dueDate">Due Date</ion-select-option>
            <ion-select-option value="priority">Priority</ion-select-option>
          </ion-select>
        </ion-item>

        <div v-if="isLoading" class="loading-state">
          <ion-spinner name="crescent" />
          <p>Loading tasks...</p>
        </div>
        <ion-list v-else-if="filteredTasks.length">
          <task-card
            v-for="task in filteredTasks"
            :key="task.id"
            :task="task"
            @edit="openEditForm"
            @delete="confirmDelete"
            @complete="markCompleted"
          />
        </ion-list>
        <div v-else class="empty-state">
          <ion-icon :icon="checkmarkDoneOutline" />
          <h2>No tasks yet. Add your first task!</h2>
          <ion-button @click="openAddForm">+ Add Task</ion-button>
        </div>
      </main>

      <ion-modal :is-open="isFormOpen" @didDismiss="closeForm">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingTask ? 'Edit Task' : 'Add Task' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeForm">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <task-form :task="editingTask" @save="saveTask" />
        </ion-content>
      </ion-modal>

      <ion-alert
        :is-open="alertState.isOpen"
        :header="alertState.header"
        :message="alertState.message"
        :buttons="alertState.buttons"
        @didDismiss="alertState.isOpen = false"
      />
      <ion-toast
        :is-open="toastState.isOpen"
        :message="toastState.message"
        :color="toastState.color"
        :duration="2500"
        @didDismiss="toastState.isOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewDidEnter
} from '@ionic/vue'
import { addOutline, checkmarkDoneOutline } from 'ionicons/icons'
import { computed, onUnmounted, reactive, ref } from 'vue'
import { onValue, push, ref as databaseRef, remove, set, update } from 'firebase/database'
import TaskCard from '../components/TaskCard.vue'
import TaskForm from '../components/TaskForm.vue'
import { authenticateAnonymously, db } from '../firebase/firebase'
import type { Task, TaskPriority, TaskStatus } from '../types/task'

const tasks = ref<Task[]>([])
const isLoading = ref(true)
const searchText = ref('')
const statusFilter = ref<'All' | TaskStatus>('All')
const sortBy = ref<'dueDate' | 'priority'>('dueDate')
const isFormOpen = ref(false)
const editingTask = ref<Task | null>(null)
let stopListening: (() => void) | undefined

const alertState = reactive<{
  isOpen: boolean
  header: string
  message: string
  buttons: Array<string | { text: string; role?: string; handler?: () => void }>
}>({ isOpen: false, header: '', message: '', buttons: ['OK'] })

const toastState = reactive<{ isOpen: boolean; message: string; color: string }>({
  isOpen: false,
  message: '',
  color: 'success'
})

const filteredTasks = computed(() => {
  const search = searchText.value.trim().toLowerCase()
  const priorityOrder: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 }

  return [...tasks.value]
    .filter((task) => statusFilter.value === 'All' || task.status === statusFilter.value)
    .filter((task) => !search || `${task.title} ${task.description}`.toLowerCase().includes(search))
    .sort((first, second) =>
      sortBy.value === 'dueDate'
        ? first.dueDate.localeCompare(second.dueDate)
        : priorityOrder[first.priority] - priorityOrder[second.priority]
    )
})

function showToast(message: string, color = 'success') {
  toastState.message = message
  toastState.color = color
  toastState.isOpen = true
}

function showError(message: string) {
  alertState.header = 'Error'
  alertState.message = message
  alertState.buttons = ['OK']
  alertState.isOpen = true
}

function hasErrorCode(error: Error): error is Error & { code: string } {
  return 'code' in error && typeof error.code === 'string'
}

function validateTask(task: Omit<Task, 'id'>) {
  if (!task.title.trim() || !task.dueDate || !task.priority || !task.status) {
    showError('Please provide a title, due date, priority, and status.')
    return false
  }
  return true
}

async function saveTask(task: Omit<Task, 'id'>) {
  if (!validateTask(task)) return
  try {
    if (editingTask.value) {
      await update(databaseRef(db, `tasks/${editingTask.value.id}`), task)
      showToast('Task updated successfully')
    } else {
      const newTaskRef = push(databaseRef(db, 'tasks'))
      await set(newTaskRef, task)
      showToast('Task added successfully')
    }
    closeForm()
  } catch (error) {
    showError(`Firebase operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function openAddForm() {
  editingTask.value = null
  isFormOpen.value = true
}

function openEditForm(task: Task) {
  editingTask.value = task
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
}

function confirmDelete(task: Task) {
  alertState.header = 'Delete task?'
  alertState.message = `Delete "${task.title}" permanently?`
  alertState.buttons = [
    'Cancel',
    {
      text: 'Delete',
      role: 'destructive',
      handler: () => deleteTask(task)
    }
  ]
  alertState.isOpen = true
}

async function deleteTask(task: Task) {
  try {
    await remove(databaseRef(db, `tasks/${task.id}`))
    showToast('Task deleted successfully')
  } catch (error) {
    showError(`Firebase operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function markCompleted(task: Task) {
  try {
    await update(databaseRef(db, `tasks/${task.id}`), { status: 'Completed' })
    showToast('Task marked as completed')
  } catch (error) {
    showError(`Firebase operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function listenForTasks() {
  stopListening?.()
  stopListening = onValue(
    databaseRef(db, 'tasks'),
    (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<Task, 'id'>> | null
      tasks.value = data
        ? Object.entries(data).map(([id, task]) => ({ id, ...task }))
        : []
      isLoading.value = false
    },
    (error) => {
      isLoading.value = false
      if (hasErrorCode(error) && error.code === 'PERMISSION_DENIED') {
        showError(
          'Firebase permission denied. Your locked Realtime Database rules are blocking client access. Update the rules in the Firebase Console according to your professor’s instructions; this app will not change them automatically.'
        )
        return
      }
      showError(`Could not load tasks: ${error.message}`)
    }
  )
}

async function initializeAuthenticatedDatabase() {
  isLoading.value = true
  try {
    await authenticateAnonymously()
    listenForTasks()
  } catch (error) {
    isLoading.value = false
    showError(
      `Anonymous sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}. Enable Anonymous sign-in in Firebase Console > Authentication > Sign-in method.`
    )
  }
}

onIonViewDidEnter(() => {
  void initializeAuthenticatedDatabase()
})
onUnmounted(() => stopListening?.())
</script>

<style scoped>
.page-content {
  margin: 0 auto;
  max-width: 900px;
  padding: 12px 8px 32px;
}

.app-toolbar {
  --background: #151b2b;
  --border-color: transparent;
  --color: #f8fafc;

  border-bottom: 1px solid rgba(129, 140, 248, 0.2);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.2);
}

.app-toolbar ion-title {
  font-weight: 700;
  letter-spacing: -0.01em;
}

.add-task-button {
  --background: #6366f1;
  --background-hover: #818cf8;
  --border-radius: 10px;
  --color: #ffffff;

  font-weight: 700;
  margin-right: 8px;
}

.welcome-card {
  --background: #1d2638;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  margin: 4px 8px 14px;
}

ion-segment {
  margin: 8px;
}

.empty-state {
  color: var(--ion-color-medium);
  padding: 70px 20px;
  text-align: center;
}

.loading-state {
  color: var(--ion-color-medium);
  padding: 70px 20px;
  text-align: center;
}

.loading-state ion-spinner {
  height: 42px;
  width: 42px;
}

.empty-state ion-icon {
  font-size: 64px;
}

.empty-state h2 {
  font-size: 18px;
}
</style>
