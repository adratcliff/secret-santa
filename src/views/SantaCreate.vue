<template>
  <v-container class="max-width-container py-8">
    <v-form @submit.prevent="createDraw">
      <div class="d-flex align-center flex-wrap ga-4 mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold">New Secret Santa</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Names are drawn as soon as you create it. Nobody, including you, can see the results.</p>
        </div>
        <v-spacer />
        <v-btn
          :disabled="!token"
          :loading="!!santaLoaders.creation"
          color="primary"
          size="large"
          rounded="lg"
          elevation="2"
          prepend-icon="mdi-shuffle-variant"
          text="Create & Draw"
          @click="createDraw" />
      </div>

      <v-alert
        v-if="!token"
        type="info"
        variant="tonal"
        class="mb-6"
        text="Log in to create a Secret Santa." />

      <v-alert
        v-if="submitted && (problems.length || createError)"
        type="error"
        variant="tonal"
        class="mb-6">
        <div v-if="createError">{{ createError }}</div>
        <div v-for="problem in problems" :key="problem">{{ problem }}</div>
      </v-alert>

      <v-card border flat class="mb-6 rounded-xl pa-4">
        <v-card-title class="text-h6 pb-4">Details</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="title"
            :counter="MAX_TITLE_LENGTH"
            :maxlength="MAX_TITLE_LENGTH"
            label="Title"
            placeholder="e.g., Family Christmas 2026" />
        </v-card-text>
      </v-card>

      <v-card border flat class="mb-6 rounded-xl pa-4">
        <v-card-title class="text-h6">People</v-card-title>
        <v-card-subtitle>Add one at a time, or paste a list separated by commas or new lines.</v-card-subtitle>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="newNames"
            :error-messages="nameError"
            label="Name"
            placeholder="e.g., Alex"
            @keydown.enter.prevent="addNames"
            @paste="pasteNames">
            <template #append-inner>
              <v-btn
                :disabled="!newNames.trim()"
                icon="mdi-plus"
                variant="text"
                size="small"
                @click="addNames" />
            </template>
          </v-text-field>

          <div class="d-flex flex-wrap ga-2 mt-2">
            <v-chip
              v-for="participant in participants"
              :key="participant.key"
              :text="participant.name"
              size="default"
              variant="tonal"
              closable
              @click:close="removeParticipant(participant.key)" />
          </div>
          <div class="text-caption text-medium-emphasis mt-2">{{ participants.length }} {{ participants.length === 1 ? 'person' : 'people' }}</div>
        </v-card-text>
      </v-card>

      <v-card border flat class="mb-6 rounded-xl pa-4">
        <v-card-title class="text-h6">Groups</v-card-title>
        <v-card-subtitle class="text-wrap">
          People in the same group won't draw each other. Useful for couples or households.
        </v-card-subtitle>
        <v-card-text class="pt-4">
          <div
            v-for="(group, gIdx) in groups"
            :key="group.key"
            class="d-flex align-center ga-2 mb-2">
            <v-select
              v-model="group.members"
              :items="groupOptions(gIdx)"
              :label="`Group ${gIdx + 1}`"
              variant="outlined"
              density="compact"
              multiple
              chips
              closable-chips
              hide-details />
            <v-btn
              icon="mdi-delete-outline"
              color="error"
              variant="text"
              @click="groups.splice(gIdx, 1)" />
          </div>

          <v-btn
            :disabled="participants.length < 4"
            variant="tonal"
            prepend-icon="mdi-account-multiple-plus"
            text="Add Group"
            class="mt-2"
            @click="addGroup" />
        </v-card-text>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { randomHex } from 'shared/utils';
import { useAppStore } from 'shared/stores';

import { useSantaStore } from '../stores';

// Mirrors the limits enforced by the API
const MIN_PARTICIPANTS = 3;
const MAX_PARTICIPANTS = 100;
const MAX_TITLE_LENGTH = 100;
const MAX_NAME_LENGTH = 50;

const router = useRouter();

const { token } = storeToRefs(useAppStore());

const santaStore = useSantaStore();
const { loaders: santaLoaders } = storeToRefs(santaStore);

const title = ref('');
const participants = ref([]);
const groups = ref([]);

const newNames = ref('');
const nameError = ref('');

const addNames = () => {
  nameError.value = '';
  const names = newNames.value.split(/[,\n]/).map(name => name.trim()).filter(name => !!name);
  const skipped = [];

  names.forEach((name) => {
    const isDuplicate = participants.value.some(participant => participant.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate || name.length > MAX_NAME_LENGTH || participants.value.length >= MAX_PARTICIPANTS) {
      skipped.push(name);
      return;
    }
    participants.value.push({ key: randomHex(4), name });
  });

  if (skipped.length) {
    nameError.value = `Skipped ${skipped.join(', ')}: names must be unique and under ${MAX_NAME_LENGTH} characters, up to ${MAX_PARTICIPANTS} people`;
  }
  newNames.value = '';
};

const pasteNames = (event) => {
  const text = event.clipboardData?.getData('text') || '';
  if (!/[,\n]/.test(text)) return;
  event.preventDefault();
  newNames.value = text;
  addNames();
};

const removeParticipant = (key) => {
  participants.value.splice(participants.value.findIndex(participant => participant.key === key), 1);
  groups.value.forEach((group) => {
    group.members = group.members.filter(member => member !== key);
  });
};

const addGroup = () => {
  groups.value.push({ key: randomHex(4), members: [] });
};

// Each person can only be in one group
const groupOptions = (gIdx) => {
  const taken = new Set(groups.value.filter((_, idx) => idx !== gIdx).map(({ members }) => members).flat());
  return participants.value
    .filter(({ key }) => !taken.has(key))
    .map(({ key, name }) => ({ title: name, value: key }));
};

const problems = computed(() => {
  const list = [];
  if (!title.value.trim()) list.push('Give your Secret Santa a title.');
  if (participants.value.length < MIN_PARTICIPANTS) list.push(`Add at least ${MIN_PARTICIPANTS} people.`);

  groups.value.forEach(({ members }, idx) => {
    if (members.length === 1) list.push(`Group ${idx + 1} needs at least 2 people.`);
    if (members.length > participants.value.length / 2) {
      list.push(`Group ${idx + 1} has more than half of everyone in it, so they can't all draw someone outside the group.`);
    }
  });

  return list;
});

const submitted = ref(false);
const createError = ref('');

const createDraw = async () => {
  submitted.value = true;
  createError.value = '';
  if (problems.value.length || santaLoaders.value.creation) return;

  const keys = participants.value.map(({ key }) => key);

  const id = await santaStore.createDetail({
    title: title.value.trim(),
    participants: participants.value.map(({ name }) => name),
    groups: groups.value
      .filter(({ members }) => members.length)
      .map(({ members }) => members.map(member => keys.indexOf(member))),
  });

  if (!id) {
    createError.value = 'Something went wrong creating the draw, please try again.';
    return;
  }

  router.push({ name: 'secret-santa-draw', params: { id } });
};
</script>

<style scoped>
.max-width-container {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
