<template>
  <v-dialog v-model="dialog" persistent width="900">
    <v-card>
      <v-card-title>
        <span class="headline">New Shift</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" lazy-validation>
          <v-row>
            <v-col cols="12" sm="6">
              <VueCtkDateTimePicker
                id="startTimeInput"
                v-model="editShift.startTime"
                format="YYYY-MM-DDTHH:mm:ssZ"
                label="*Start Time"
              ></VueCtkDateTimePicker>
            </v-col>
            <v-col cols="12" sm="6">
              <VueCtkDateTimePicker
                id="endTimeInput"
                v-model="editShift.endTime"
                format="YYYY-MM-DDTHH:mm:ssZ"
                label="*End Time"
              ></VueCtkDateTimePicker>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                label="*Participants Limit"
                :rules="[
                  (v) =>
                    isParticipantsLimitValid(v) ||
                    'Participants limit must be a positive number',
                ]"
                required
                v-model="editShift.participantsLimit"
                data-cy="participantsLimitInput"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                label="*Location"
                :rules="[
                  (v) =>
                    isLocationValid(v) ||
                    'Location length must be between 20 and 200 characters',
                ]"
                required
                v-model="editShift.location"
                data-cy="locationInput"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="blue-darken-1"
          variant="text"
          @click="$emit('close-shift-dialog')"
        >
          Close
        </v-btn>
        <v-btn
          :disabled="!canSave"
          color="blue-darken-1"
          variant="text"
          @click="createShift"
          data-cy="saveShift"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Vue, Component, Model, Prop } from 'vue-property-decorator';
import Shift from '@/models/shift/Shift';
import Activity from '@/models/activity/Activity';
import RemoteServices from '@/services/RemoteServices';
import VueCtkDateTimePicker from 'vue-ctk-date-time-picker';
import 'vue-ctk-date-time-picker/dist/vue-ctk-date-time-picker.css';

Vue.component('VueCtkDateTimePicker', VueCtkDateTimePicker);

@Component
export default class ShiftDialog extends Vue {
  @Model('dialog', Boolean) dialog!: boolean;
  @Prop({ type: Activity, required: true }) readonly activity!: Activity;

  editShift: Shift = new Shift();

  get canSave(): boolean {
    return (
      !!this.editShift.startTime &&
      !!this.editShift.endTime &&
      this.isParticipantsLimitValid(this.editShift.participantsLimit) &&
      this.isLocationValid(this.editShift.location)
    );
  }

  isParticipantsLimitValid(value: any) {
    if (!/^\d+$/.test(value)) return false;
    return parseInt(value) > 0;
  }

  isLocationValid(value: string) {
    if (!value) return false;
    const length = value.trim().length;
    return length >= 20 && length <= 200;
  }

  async createShift() {
    if (
      this.activity.id !== null &&
      (this.$refs.form as Vue & { validate: () => boolean }).validate()
    ) {
      try {
        const result = await RemoteServices.createShift(
          this.activity.id,
          this.editShift,
        );
        this.$emit('save-shift', result);
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
    }
  }
}
</script>

<style scoped lang="scss"></style>