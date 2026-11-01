<template>
  <v-container class="max-width-container py-8">
    <v-card v-if="!loaded" border flat rounded="xl">
      <v-skeleton-loader type="heading, list-item@4" />
    </v-card>

    <v-row v-else-if="!draw.id" justify="center" class="mt-12">
      <v-col cols="12" sm="8" class="text-center">
        <v-icon icon="mdi-gift-off-outline" size="100" color="grey-lighten-2" />
        <h3 class="text-h5 text-grey mt-4">We couldn't find this Secret Santa</h3>
        <p class="text-body-2 text-medium-emphasis mt-2">Check the link with whoever organised it.</p>
      </v-col>
    </v-row>

    <template v-else>
      <div class="mb-6">
        <h1 class="text-h4 font-weight-bold">{{ draw.title }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ claimedCount }} of {{ draw.participants.length }} people have found out who they're buying for
        </p>
      </div>

      <v-card v-if="revealed" border flat rounded="xl" class="pa-6 mb-6 text-center">
        <v-icon icon="mdi-gift" size="64" color="primary" class="mb-2" />
        <div class="text-overline">{{ revealed.name }}, you're buying for</div>
        <div class="text-h3 font-weight-bold my-4">{{ revealed.target }}</div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          This device will remember you. If other people use it, hide your result when you're done.
        </p>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-eye-off-outline"
          text="Hide on this device"
          @click="hide" />
      </v-card>

      <v-card v-else border flat rounded="xl" class="mb-6">
        <v-card-item>
          <v-card-title>Who are you?</v-card-title>
          <v-card-subtitle class="text-wrap">
            Pick your name and choose a PIN. You'll need the PIN to see your result again on another device.
          </v-card-subtitle>
        </v-card-item>
        <v-list>
          <v-list-item
            v-for="participant in draw.participants"
            :key="participant.id"
            :title="participant.name"
            :subtitle="participant.claimed ? 'Claimed. Enter your PIN to view.' : 'Not claimed yet'"
            :prepend-icon="participant.claimed ? 'mdi-lock-outline' : 'mdi-account-outline'"
            append-icon="mdi-chevron-right"
            @click="openPin(participant)" />
        </v-list>
      </v-card>

      <v-card v-if="isOrganiser" border flat rounded="xl" class="mb-6">
        <v-card-item>
          <v-card-title>Organiser</v-card-title>
          <v-card-subtitle class="text-wrap">
            Share this link with everyone. You can see who has claimed their name, but not who they drew.
          </v-card-subtitle>
        </v-card-item>

        <v-card-text>
          <v-text-field
            :model-value="shareLink"
            label="Share link"
            readonly
            hide-details
            @focus="$event.target.select()">
            <template #append-inner>
              <v-btn
                icon="mdi-content-copy"
                variant="text"
                size="small"
                @click="copyLink" />
            </template>
          </v-text-field>
        </v-card-text>

        <v-list density="compact">
          <v-list-subheader>Claims</v-list-subheader>
          <v-list-item
            v-for="participant in draw.participants"
            :key="participant.id"
            :title="participant.name">
            <template #prepend>
              <v-icon
                :icon="participant.claimed ? 'mdi-check-circle' : 'mdi-circle-outline'"
                :color="participant.claimed ? 'success' : undefined" />
            </template>
            <template #append>
              <v-btn
                v-if="participant.claimed"
                :color="confirmingReset === participant.id ? 'error' : undefined"
                :loading="resetting === participant.id"
                :text="confirmingReset === participant.id ? 'Confirm reset' : 'Reset'"
                variant="tonal"
                size="small"
                @click="resetParticipant(participant)" />
            </template>
          </v-list-item>
        </v-list>

        <v-card-text v-if="draw.groups.length">
          <div class="text-overline">Groups</div>
          <div
            v-for="(group, gIdx) in draw.groups"
            :key="gIdx"
            class="d-flex flex-wrap ga-1 mb-2">
            <v-chip
              v-for="member in group"
              :key="member"
              :text="participantName(member)"
              variant="tonal" />
          </div>
        </v-card-text>

        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn
            v-if="confirmingDelete"
            variant="text"
            text="Cancel"
            @click="confirmingDelete = false" />
          <v-btn
            :variant="confirmingDelete ? 'flat' : 'text'"
            :loading="deleting"
            :text="confirmingDelete ? 'Delete for everyone' : 'Delete draw'"
            color="error"
            prepend-icon="mdi-delete-outline"
            @click="removeDraw" />
        </v-card-actions>
      </v-card>
    </template>

    <v-dialog v-model="pinDialog" width="420">
      <v-card v-if="selected" rounded="xl">
        <v-card-title class="pt-4 px-6">{{ dialogTitle }}</v-card-title>
        <v-card-text class="px-6">
          <p class="mb-4">{{ dialogText }}</p>
          <v-otp-input
            v-model="pin"
            :length="PIN_LENGTH"
            :error="!!pinError"
            :disabled="pinLoading"
            type="number"
            autofocus
            @finish="submitPin" />
          <v-alert
            v-if="pinError"
            :text="pinError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-2" />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" text="Cancel" @click="pinDialog = false" />
          <v-btn
            :disabled="pin.length !== PIN_LENGTH"
            :loading="pinLoading"
            :text="selected.claimed ? 'View' : 'Claim'"
            color="primary"
            variant="flat"
            @click="submitPin" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :text="snackbarText" timeout="2500" />
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { handleError } from 'shared/utils';
import { useAppStore } from 'shared/stores';

import {
  PIN_LENGTH,
  forgetClaim,
  getSavedClaim,
  saveClaim,
} from '@/utils';
import { useSantaStore } from '../stores';

const route = useRoute();
const router = useRouter();

const { userId } = storeToRefs(useAppStore());

const santaStore = useSantaStore();
const { item: getDraw } = storeToRefs(santaStore);

const drawId = computed(() => route.params.id);
const draw = computed(() => getDraw.value(drawId.value));
const loaded = ref(false);

const claimedCount = computed(() => draw.value.participants.filter(({ claimed }) => claimed).length);
const isOrganiser = computed(() => !!userId.value && draw.value.creator === userId.value);
const participantName = (id) => draw.value.participants.find(participant => participant.id === id)?.name || '';

const snackbar = ref(false);
const snackbarText = ref('');
const notify = (text) => {
  snackbarText.value = text;
  snackbar.value = true;
};

// Revealing

const revealed = ref(null);

const showTarget = (participant, pin, target) => {
  saveClaim(drawId.value, { participant: participant.id, pin });
  revealed.value = { name: participant.name, target };
};

const hide = () => {
  forgetClaim(drawId.value);
  revealed.value = null;
};

const pinDialog = ref(false);
const selected = ref(null);
const pin = ref('');
const pinError = ref('');
const pinLoading = ref(false);

const dialogTitle = computed(() => selected.value.claimed ? `Welcome back, ${selected.value.name}` : `Are you ${selected.value.name}?`);
const dialogText = computed(() => selected.value.claimed
  ? 'Enter your PIN to see who you\'re buying for.'
  : `Choose a ${PIN_LENGTH} digit PIN. Once you claim this name nobody else can, so make sure it's you!`);

const pinErrors = {
  403: 'That PIN is incorrect.',
  404: 'The organiser has reset this name. Close this and claim it again.',
  409: 'Someone has just claimed this name. If that wasn\'t you, ask the organiser to reset it.',
  429: 'Too many incorrect attempts. Please wait a while before trying again.',
};

const openPin = (participant) => {
  selected.value = participant;
  pin.value = '';
  pinError.value = '';
  pinDialog.value = true;
};

const submitPin = async () => {
  if (pinLoading.value || pin.value.length !== PIN_LENGTH) return;

  const participant = selected.value;
  pinLoading.value = true;
  pinError.value = '';

  try {
    const target = participant.claimed
      ? await santaStore.reveal(drawId.value, participant.id, pin.value)
      : await santaStore.claim(drawId.value, participant.id, pin.value);

    showTarget(participant, pin.value, target);
    pinDialog.value = false;
  } catch (err) {
    pinError.value = pinErrors[err?.status] || 'Something went wrong, please try again.';
    pin.value = '';

    if ([404, 409].includes(err?.status)) {
      // The claim changed under us, so refresh who has claimed what
      await santaStore.getDetail(drawId.value);
    } else if (!(err?.status in pinErrors)) {
      handleError(`Failed to view Secret Santa ${drawId.value}`, err);
    }
  } finally {
    pinLoading.value = false;
  }
};

// Organiser tools

const shareLink = computed(() => `${window.location.origin}${router.resolve({ name: 'secret-santa-draw', params: { id: drawId.value } }).href}`);

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    notify('Link copied');
  } catch (err) {
    handleError('Failed to copy Secret Santa link', err);
  }
};

const confirmingReset = ref(null);
const resetting = ref(null);

const resetParticipant = async (participant) => {
  if (confirmingReset.value !== participant.id) {
    confirmingReset.value = participant.id;
    return;
  }

  resetting.value = participant.id;
  try {
    await santaStore.resetClaim(drawId.value, participant.id);
    if (getSavedClaim(drawId.value)?.participant === participant.id) hide();
    notify(`${participant.name} can claim their name again`);
  } catch (err) {
    handleError(`Failed to reset claim on Secret Santa ${drawId.value}`, err);
    notify('Could not reset that claim');
  } finally {
    confirmingReset.value = null;
    resetting.value = null;
  }
};

const confirmingDelete = ref(false);
const deleting = ref(false);

const removeDraw = async () => {
  if (!confirmingDelete.value) {
    confirmingDelete.value = true;
    return;
  }

  deleting.value = true;
  try {
    forgetClaim(drawId.value);
    await santaStore.deleteDraw(drawId.value);
    router.push({ name: 'secret-santa' });
  } catch (err) {
    handleError(`Failed to delete Secret Santa ${drawId.value}`, err);
    notify('Could not delete the draw');
  } finally {
    deleting.value = false;
    confirmingDelete.value = false;
  }
};

onMounted(async () => {
  await santaStore.getDetail(drawId.value);
  loaded.value = true;

  const saved = getSavedClaim(drawId.value);
  if (!saved || !draw.value.id) return;

  const participant = draw.value.participants.find(({ id }) => id === saved.participant);
  if (!participant || !participant.claimed) {
    forgetClaim(drawId.value);
    return;
  }

  try {
    showTarget(participant, saved.pin, await santaStore.reveal(drawId.value, participant.id, saved.pin));
  } catch (err) {
    // A wrong saved PIN or a lockout means the claim was reset, so start fresh
    if (err?.status !== 429) forgetClaim(drawId.value);
  }
});
</script>

<style scoped>
.max-width-container {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
