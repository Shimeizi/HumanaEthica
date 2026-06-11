<template>
  <v-card class="table">
    <div class="text-h3">{{ activity.name }} - Shifts</div>
    <v-data-table
      :headers="headers"
      :items="shifts"
      :search="search"
      disable-pagination
      :hide-default-footer="true"
      :mobile-breakpoint="0"
      data-cy="activityShiftsTable"
    >
      <template v-slot:top>
        <v-card-title>
          <v-text-field
            v-model="search"
            append-icon="search"
            label="Search"
            class="mx-2"
          />
          <v-spacer />
          <v-btn
            color="primary"
            dark
            class="mr-2"
            :disabled="!canCreateShift"
            @click="newShift"
            data-cy="newShift"
            >New Shift</v-btn
          >
          <v-btn
            color="primary"
            dark
            @click="getActivities"
            data-cy="getActivities"
            >Activities</v-btn
          >
        </v-card-title>
      </template>
    </v-data-table>
    <shift-dialog
      v-if="activity && editShiftDialog"
      v-model="editShiftDialog"
      :activity="activity"
      v-on:save-shift="onSaveShift"
      v-on:close-shift-dialog="onCloseShiftDialog"
    />
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import RemoteServices from '@/services/RemoteServices';
import Activity from '@/models/activity/Activity';
import Shift from '@/models/shift/Shift';
import ShiftDialog from '@/views/member/ShiftDialog.vue';

@Component({
  components: {
    'shift-dialog': ShiftDialog,
  },
})
export default class InstitutionActivityShiftsView extends Vue {
  activity!: Activity;
  shifts: Shift[] = [];
  search: string = '';
  editShiftDialog: boolean = false;

  get canCreateShift(): boolean {
    return this.activity?.state === 'APPROVED';
  }

  headers: object = [
    {
      text: 'Start Time',
      value: 'formattedStartTime',
      align: 'left',
      width: '25%',
    },
    {
      text: 'End Time',
      value: 'formattedEndTime',
      align: 'left',
      width: '25%',
    },
    {
      text: 'Location',
      value: 'location',
      align: 'left',
      width: '30%',
    },
    {
      text: 'Participants Limit',
      value: 'participantsLimit',
      align: 'left',
      width: '20%',
    },
  ];

  async created() {
    this.activity = this.$store.getters.getActivity;
    if (this.activity !== null && this.activity.id !== null) {
      await this.$store.dispatch('loading');
      try {
        await this.loadShifts();
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
      await this.$store.dispatch('clearLoading');
    }
  }

  async loadShifts() {
    if (this.activity !== null && this.activity.id !== null) {
      this.shifts = await RemoteServices.getShiftsByActivity(this.activity.id);
    }
  }

  newShift() {
    if (!this.canCreateShift) return;
    this.editShiftDialog = true;
  }

  onCloseShiftDialog() {
    this.editShiftDialog = false;
  }

  async onSaveShift(shift: Shift) {
    this.shifts.unshift(shift);
    this.editShiftDialog = false;
    await this.loadShifts();
  }

  async getActivities() {
    await this.$store.dispatch('setActivity', null);
    this.$router.push({ name: 'institution-activities' }).catch(() => {});
  }
}
</script>

<style lang="scss" scoped>
</style>
