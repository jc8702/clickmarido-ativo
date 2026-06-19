export interface CreateWarrantyDto {
  serviceOrderId: string;
  durationMonths?: number;
}

export interface ClaimWarrantyDto {
  description: string;
}

export interface SubmitFeedbackDto {
  rating: number; // 1-5
  nps: number;    // 0-10
  feedbackText: string;
}
