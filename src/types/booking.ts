export enum BookingStatus {
  Active = 'active',
  Confirmed = 'confirmed',
  Canceled = 'canceled',
  Completed = 'completed',
}

export interface Booking {
  id: number;
  userid: number;
  date: string;
  visitors_count: number;
  phone: string;
  status: BookingStatus;
}
