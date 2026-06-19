export class QuotationCreatedEvent {
  constructor(
    public readonly quotationId: string,
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly total: number
  ) {}
}

export class QuotationApprovedEvent {
  constructor(
    public readonly quotationId: string,
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly items: any[],
    public readonly total: number
  ) {}
}
