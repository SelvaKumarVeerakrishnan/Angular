import { TravelRequestStatus } from './travel-request-status.enum';

export interface TravelRequest {
  id?: number;
  userId?: number;
  destination: string;
  startDate: string; // ISO string format
  endDate: string; // ISO string format
  purpose: string;
  estimatedCost: number;
  status: TravelRequestStatus;
  createdAt: string; // ISO string format
  updatedAt?: string; // ISO string format
  approvedBy?: number;
  approvedAt?: string; // ISO string format
  rejectedBy?: number;
  rejectedAt?: string; // ISO string format
  comments?: string;
}
