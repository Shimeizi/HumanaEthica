<template>
  <v-dialog v-model="dialog" persistent width="800">
    <v-card>
      <v-card-title>
        <span class="headline">
          {{
            editEnrollment && editEnrollment.id === null
              ? 'New Application'
              : 'Edit Application'
          }}
        </span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" lazy-validation>
          <v-row>
            <v-col cols="12">
              <v-textarea
                label="*Motivation"
                :rules="[(v) => !!v || 'Motivation is required']"
                required
                v-model="editEnrollment.motivation"
                data-cy="motivationInput"
                auto-grow
                rows="1"
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row v-if="editEnrollment.id === null">
            <v-col cols="12">
              <v-select
                v-model="editEnrollment.shiftIds"
                :items="availableShifts"
                item-text="title"
                item-value="value"
                label="*Select Shifts"
                :rules="shiftSelectionRules"
                multiple
                chips
                deletable-chips
                data-cy="shiftsSelect"
              ></v-select>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="blue-darken-1"
          variant="text"
          @click="$emit('close-enrollment-dialog')"
        >
          Close
        </v-btn>
        <v-btn
          v-if="canSave"
          color="blue-darken-1"
          variant="text"
          @click="updateEnrollment"
          data-cy="saveEnrollment"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model } from 'vue-property-decorator';
import RemoteServices from '@/services/RemoteServices';
import { ISOtoString } from '@/services/ConvertDateService';
import Enrollment from '@/models/enrollment/Enrollment';
import Shift from '@/models/shift/Shift';

@Component({
  methods: { ISOtoString },
})
export default class EnrollmentDialog extends Vue {
  @Model('dialog', Boolean) dialog!: boolean;
  @Prop({ type: Enrollment, required: true }) readonly enrollment!: Enrollment;

  editEnrollment: Enrollment = new Enrollment();
  availableShifts: { value: number; title: string }[] = [];
  shiftMap: Map<number, Shift> = new Map();

  async created() {
    this.editEnrollment = new Enrollment(this.enrollment);
    if (this.editEnrollment.activityId !== null && this.editEnrollment.id === null) {
      await this.loadShifts();
    }
  }

  async loadShifts() {
    try {
      const shifts = await RemoteServices.getShiftsByActivity(
        this.editEnrollment.activityId!,
      );
      this.shiftMap = new Map(shifts.map((shift: Shift) => [shift.id!, shift]));
      this.availableShifts = shifts.map((shift: Shift) => ({
        value: shift.id!,
        title: `${shift.formattedStartTime} - ${shift.formattedEndTime} (${shift.location})`,
      }));
    } catch (error) {
      await this.$store.dispatch('error', error);
    }
  }

  get shiftSelectionRules(): ((v: number[]) => true | string)[] {
    return [
      (v: number[]) => v.length > 0 || 'At least one shift is required',
      (v: number[]) =>
        !this.hasOverlappingShiftPeriods(v) ||
        'Selected shifts cannot have overlapping periods',
    ];
  }

  hasOverlappingShiftPeriods(selectedShiftIds: number[]): boolean {
    if (!selectedShiftIds || selectedShiftIds.length < 2) {
      return false;
    }

    const selectedIntervals = selectedShiftIds
      .map((shiftId) => this.shiftMap.get(shiftId))
      .filter((shift): shift is Shift => !!shift)
      .map((shift) => ({
        start: new Date(shift.startTime).getTime(),
        end: new Date(shift.endTime).getTime(),
      }))
      .sort((a, b) => a.start - b.start);

    for (let index = 1; index < selectedIntervals.length; index++) {
      if (selectedIntervals[index].start < selectedIntervals[index - 1].end) {
        return true;
      }
    }

    return false;
  }

  get canSave(): boolean {
    const hasMotivation =
      !!this.editEnrollment.motivation &&
      this.editEnrollment.motivation.length >= 10;

    // For new enrollments, require at least one shift
    if (this.editEnrollment.id === null) {
      return (
        hasMotivation &&
        this.editEnrollment.shiftIds.length > 0 &&
        !this.hasOverlappingShiftPeriods(this.editEnrollment.shiftIds)
      );
    }
    // For editing, only motivation is required
    return hasMotivation;
  }

  async updateEnrollment() {
    //editar
    if (
      this.editEnrollment.id !== null &&
      (this.$refs.form as Vue & { validate: () => boolean }).validate()
    ) {
      try {
        const result = await RemoteServices.editEnrollment(
          this.editEnrollment.id,
          this.editEnrollment,
        );
        this.$emit('update-enrollment', result);
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
    }
    //criar
    else if (
      this.editEnrollment.activityId !== null &&
      (this.$refs.form as Vue & { validate: () => boolean }).validate()
    ) {
      try {
        const result = await RemoteServices.createEnrollment(
          this.editEnrollment,
        );
        this.$emit('save-enrollment', result);
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
    }
  }
}
</script>

<style scoped lang="scss"></style>
