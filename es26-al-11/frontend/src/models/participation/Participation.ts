import { ISOtoString } from '@/services/ConvertDateService';

export default class Participation {
  id: number | null = null;
  activityId: number | null = null;
  enrollmentId: number | null = null;
  shiftId: number | null = null;
  availableShiftIds: number[] = [];
  volunteerId: number | null | undefined = null;
  memberRating!: number;
  memberReview!: string;
  volunteerRating!: number;
  volunteerReview!: string;
  acceptanceDate!: string;

  constructor(jsonObj?: Participation) {
    if (jsonObj) {
      this.id = jsonObj.id;
      this.activityId = jsonObj.activityId;
      this.enrollmentId = jsonObj.enrollmentId;
      this.shiftId = jsonObj.shiftId;
      this.availableShiftIds = jsonObj.availableShiftIds || [];
      this.volunteerId = jsonObj.volunteerId;
      this.memberRating = jsonObj.memberRating;
      this.memberReview = jsonObj.memberReview;
      this.volunteerRating = jsonObj.volunteerRating;
      this.volunteerReview = jsonObj.volunteerReview;
      this.acceptanceDate = ISOtoString(jsonObj.acceptanceDate);
    }
  }
}
