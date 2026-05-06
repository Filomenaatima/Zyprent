export interface RentPaidEvent {

  tenantId: string
  landlordId: string
  amount: number

}

export interface MessageReceivedEvent {

  receiverId: string
  senderId: string
  message: string

}

export interface MaintenanceAssignedEvent {

  technicianId: string
  propertyId: string
  issue: string

}

export interface SharesPurchasedEvent {

  investorId: string
  propertyId: string
  shares: number

}