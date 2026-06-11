<template>
  <v-dialog v-model="dialog" persistent width="800">
    <v-card>
      <v-card-title>
        <span class="headline">
          {{
            editParticipation && editParticipation.id === null
              ? 'Create Participation'
              : 'Your Rating'
          }}
        </span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" lazy-validation>
          <v-row>
            <v-col cols="12">
              <v-select
                label="Shift"
                :items="availableShifts"
                item-text="label"
                item-value="id"
                v-model="editParticipation.shiftId"
                :rules="shiftSelectRules"
                :disabled="editParticipation.id !== null"
                data-cy="participantsShiftSelect"
              />
            </v-col>
            <v-col cols="12" class="d-flex align-center">
              <v-text-field
                label="Rating"
                :rules="[(v) => isNumberValid(v) || 'Rating between 1 and 5']"
                v-model="editParticipation.memberRating"
                data-cy="participantsNumberInput"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea
                label="Review"
                v-model="editParticipation.memberReview"
                :rules="[(v) => !!v || 'Review is required']"
                data-cy="participantsReviewInput"
                auto-grow
                rows="1"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          dark
          variant="text"
          @click="$emit('close-participation-dialog')"
        >
          Close
        </v-btn>
        <v-btn
          v-if="isReviewValid && isRatingValid && isShiftValid && isShiftCapacityValid"
          color="primary"
          dark
          variant="text"
          @click="createUpdateParticipation"
          data-cy="createParticipation"
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
import Participation from '@/models/participation/Participation';
import Shift from '@/models/shift/Shift';

@Component({
  methods: { ISOtoString },
})
export default class ParticipationSelectionDialog extends Vue {
  @Model('dialog', Boolean) dialog!: boolean;
  @Prop({ type: Participation, required: true })
  readonly participation!: Participation;
  @Prop({ type: Array, required: true })
  readonly activityShifts!: Shift[];

  participations: Participation[] = [];
  editParticipation: Participation = new Participation();

  async created() {
    this.editParticipation = new Participation(this.participation);
    this.participations = await RemoteServices.getActivityParticipations(
      this.editParticipation.activityId,
    );

    if (
      !this.editParticipation.shiftId &&
      this.editParticipation.availableShiftIds.length === 1
    ) {
      const onlyAvailableShiftId = this.editParticipation.availableShiftIds[0];
      if (this.isShiftWithinCapacity(onlyAvailableShiftId)) {
        this.editParticipation.shiftId = onlyAvailableShiftId;
      }
    }
  }

  getShiftParticipantsCount(shiftId: number): number {
    return this.participations.filter(
      (participation) =>
        participation.shiftId === shiftId &&
        participation.id !== this.editParticipation.id,
    ).length;
  }

  isShiftWithinCapacity(shiftId: number): boolean {
    const shift = this.activityShifts.find((activityShift) => activityShift.id === shiftId);
    if (!shift) return false;
    return this.getShiftParticipantsCount(shiftId) < shift.participantsLimit;
  }

  get shiftSelectRules(): ((value: number | null | undefined) => true | string)[] {
    return [
      (value: number | null | undefined) => !!value || 'Shift is required',
      (value: number | null | undefined) =>
        !value ||
        this.isShiftWithinCapacity(value) ||
        'Shift has reached participants limit',
    ];
  }

  get availableShifts(): { id: number; label: string }[] {
    return this.editParticipation.availableShiftIds
      .map((shiftId) => {
        const shift = this.activityShifts.find((activityShift) => activityShift.id === shiftId);
        if (!shift || !shift.id) return null;
        const canSelectShift =
          shift.id === this.editParticipation.shiftId ||
          this.isShiftWithinCapacity(shift.id);
        if (!canSelectShift) return null;
        return {
          id: shift.id,
          label: `${shift.formattedStartTime} - ${shift.formattedEndTime} (${shift.location})`,
        };
      })
      .filter((option): option is { id: number; label: string } => option !== null);
  }

  get isReviewValid(): boolean {
    return (
      !this.editParticipation.memberReview ||
      (this.editParticipation.memberReview.length >= 10 &&
        this.editParticipation.memberReview.length < 100)
    );
  }

  get isRatingValid(): boolean {
    return (
      !this.editParticipation.memberRating ||
      (this.editParticipation.memberRating >= 1 &&
        this.editParticipation.memberRating <= 5)
    );
  }

  get isShiftValid(): boolean {
    return this.editParticipation.id !== null || !!this.editParticipation.shiftId;
  }

  get isShiftCapacityValid(): boolean {
    if (this.editParticipation.id !== null || !this.editParticipation.shiftId) {
      return true;
    }

    return this.isShiftWithinCapacity(this.editParticipation.shiftId);
  }

  isNumberValid(value: any) {
    if (value === null || value === undefined || value === '') return true;
    if (!/^\d+$/.test(value)) return false;
    const parsedValue = parseInt(value);
    return parsedValue >= 1 && parsedValue <= 5;
  }

  async createUpdateParticipation() {
    if ((this.$refs.form as Vue & { validate: () => boolean }).validate()) {
      try {
        const result =
          this.editParticipation.id !== null
            ? await RemoteServices.updateParticipationMember(
                this.editParticipation.id,
                this.editParticipation,
              )
            : await RemoteServices.createParticipation(
                this.editParticipation.activityId!,
                this.editParticipation,
              );
        this.$emit('save-participation', result);
        this.$emit('close-participation-dialog');
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
    }
  }
}
</script>

<style scoped lang="scss"></style>
