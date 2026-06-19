export interface CreateWarrantyDto {
    serviceOrderId: string;
    durationMonths?: number;
}
export interface ClaimWarrantyDto {
    description: string;
}
export interface SubmitFeedbackDto {
    rating: number;
    nps: number;
    feedbackText: string;
}
