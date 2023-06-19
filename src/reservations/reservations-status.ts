// using string because of tests - postgres converts it to string, but pg-mem does not
export enum ReservationsStatus {
  Created = '0',
  InProgress = '1',
  Finished = '2',
  Cancelled = '3',
}
