<template>
  <ion-card>
    <ion-card-header>
      <div class="card-heading">
        <ion-card-title>{{ task.title }}</ion-card-title>
        <ion-badge class="task-badge" :class="`priority-${task.priority.toLowerCase()}`">
          {{ task.priority }}
        </ion-badge>
      </div>
      <ion-card-subtitle>Due {{ task.dueDate }}</ion-card-subtitle>
    </ion-card-header>

    <ion-card-content>
      <p class="description">{{ task.description || 'No description provided.' }}</p>
      <ion-badge
        class="task-badge"
        :class="task.status === 'Completed' ? 'status-completed' : 'status-pending'"
      >
        {{ task.status }}
      </ion-badge>

      <div class="actions">
        <ion-button class="action-button edit-action" fill="clear" size="small" @click="$emit('edit', task)">
          <ion-icon :icon="createOutline" slot="start" />
          Edit
        </ion-button>
        <ion-button
          v-if="task.status === 'Pending'"
          class="action-button complete-action"
          fill="clear"
          size="small"
          @click="$emit('complete', task)"
        >
          <ion-icon :icon="checkmarkOutline" slot="start" />
          Mark Completed
        </ion-button>
        <ion-button class="action-button delete-action" fill="clear" size="small" @click="$emit('delete', task)">
          <ion-icon :icon="trashOutline" slot="start" />
          Delete
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon
} from '@ionic/vue'
import { checkmarkOutline, createOutline, trashOutline } from 'ionicons/icons'
import type { Task } from '../types/task'

defineProps<{ task: Task }>()
defineEmits<{
  edit: [task: Task]
  delete: [task: Task]
  complete: [task: Task]
}>()
</script>

<style scoped>
ion-card {
  --background: #1d2638;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  margin: 12px 8px;
}

.card-heading {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.description {
  color: #cbd5e1;
  margin: 0 0 12px;
  white-space: pre-wrap;
}

.task-badge {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  min-height: 26px;
  padding: 6px 10px;
}

.priority-high,
.status-pending {
  --background: rgba(248, 113, 113, 0.16);
  --color: #fca5a5;
}

.priority-medium {
  --background: rgba(251, 191, 36, 0.16);
  --color: #fcd34d;
}

.priority-low,
.status-completed {
  --background: rgba(52, 211, 153, 0.16);
  --color: #6ee7b7;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.action-button {
  --border-radius: 9px;
  --padding-start: 11px;
  --padding-end: 11px;

  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 650;
  margin: 0;
}

.edit-action {
  --background: rgba(129, 140, 248, 0.14);
  --background-hover: rgba(129, 140, 248, 0.24);
  --color: #a5b4fc;
}

.complete-action {
  --background: rgba(52, 211, 153, 0.14);
  --background-hover: rgba(52, 211, 153, 0.24);
  --color: #6ee7b7;
}

.delete-action {
  --background: rgba(248, 113, 113, 0.12);
  --background-hover: rgba(248, 113, 113, 0.22);
  --color: #fca5a5;
}

@media (max-width: 520px) {
  .action-button {
    flex: 1 1 auto;
  }
}
</style>
