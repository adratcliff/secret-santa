<template>
  <v-container class="max-width-container py-8">
    <div class="d-flex align-center flex-wrap ga-4 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Secret Santa</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Draws you've organised</p>
      </div>
      <v-spacer />
      <div v-if="token" class="d-flex align-center ga-3">
        <view-toggle v-model="view" />
        <v-btn
          :to="{ name: 'secret-santa-create' }"
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          rounded="lg"
          elevation="2"
          text="New Secret Santa" />
      </div>
    </div>

    <v-row v-if="!token" justify="center" class="mt-12">
      <v-col cols="12" sm="8" class="text-center">
        <v-icon icon="mdi-gift-outline" size="100" color="grey-lighten-2" />
        <h3 class="text-h5 text-grey mt-4">Log in to organise a Secret Santa</h3>
        <p class="text-body-2 text-medium-emphasis mt-2">
          Been sent a link? Open it to find out who you're buying for. No account needed.
        </p>
      </v-col>
    </v-row>

    <v-row v-else-if="santaLoaders.list && !draws.length && view === 'cards'">
      <v-col
        v-for="n in 3"
        :key="n"
        cols="12" sm="6" md="4">
        <v-skeleton-loader type="article" border rounded="xl" />
      </v-col>
    </v-row>

    <v-skeleton-loader v-else-if="santaLoaders.list && !draws.length" type="table-tbody" class="bg-transparent" />

    <v-row v-else-if="draws.length && view === 'cards'">
      <v-col
        v-for="draw in draws"
        :key="draw.id"
        cols="12" sm="6" md="4">
        <v-card
          :to="drawRoute(draw)"
          border
          flat
          rounded="xl"
          class="h-100">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon icon="mdi-gift" />
              </v-avatar>
            </template>
            <v-card-title class="font-weight-bold">{{ draw.title }}</v-card-title>
            <v-card-subtitle>{{ draw.participantCount }} people</v-card-subtitle>
          </v-card-item>
          <v-card-text class="text-caption text-medium-emphasis">
            Created {{ new Date(draw.created).toLocaleDateString() }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-table v-else-if="draws.length" hover class="bg-transparent">
      <thead>
        <tr>
          <th>Draw</th>
          <th>People</th>
          <th class="d-none d-sm-table-cell">Created</th>
          <th class="chevron-cell" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="draw in draws"
          :key="draw.id"
          class="cursor-pointer"
          @click="router.push(drawRoute(draw))">
          <td>
            <div class="d-flex align-center ga-3">
              <v-icon icon="mdi-gift" size="20" class="text-medium-emphasis" />
              <router-link :to="drawRoute(draw)" class="font-weight-medium text-high-emphasis text-decoration-none" @click.stop>
                {{ draw.title }}
              </router-link>
            </div>
          </td>
          <td class="text-medium-emphasis">{{ draw.participantCount }}</td>
          <td class="d-none d-sm-table-cell text-medium-emphasis">{{ new Date(draw.created).toLocaleDateString() }}</td>
          <td class="chevron-cell text-end">
            <v-icon icon="mdi-chevron-right" class="text-medium-emphasis" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-row v-else justify="center" class="mt-12">
      <v-col cols="auto" class="text-center">
        <v-icon icon="mdi-gift-open-outline" size="100" color="grey-lighten-2" />
        <h3 class="text-h5 text-grey mt-4">No draws yet</h3>
        <v-btn
          :to="{ name: 'secret-santa-create' }"
          variant="text"
          color="primary"
          text="Create your first one" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useAppStore } from 'shared/stores';
import { ViewToggle } from 'shared/components';

import { useSantaStore } from '../stores';

const router = useRouter();

const { token, userId } = storeToRefs(useAppStore());

const view = ref(localStorage.getItem('adratcliff-santaview') || 'cards');
watch(view, value => localStorage.setItem('adratcliff-santaview', value));

const drawRoute = draw => ({ name: 'secret-santa-draw', params: { id: draw.id } });

const santaStore = useSantaStore();
const { list: santaList, loaders: santaLoaders } = storeToRefs(santaStore);

// The store also holds draws opened from shared links, so only show the ones this user created
const draws = computed(() => santaList.value
  .filter(({ creator }) => creator === userId.value)
  .sort((a, b) => (b.created || '').localeCompare(a.created || '')));

const loadDraws = () => token.value && santaStore.getList();

// Login happens in the host app, so load the list once a token appears
watch(token, loadDraws);

onMounted(loadDraws);
</script>

<style scoped>
.max-width-container {
  max-width: 1000px;
  margin: 0 auto;
}
.chevron-cell {
  width: 48px;
}
</style>
