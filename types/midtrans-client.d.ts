/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'midtrans-client' {
  export interface MidtransClientOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface SnapTransactionParameters {
    transaction_details: TransactionDetails;
    item_details?: any[];
    customer_details?: any;
    enabled_payments?: string[];
    expiry?: any;
    custom_field1?: string;
    custom_field2?: string;
    custom_field3?: string;
    callbacks?: {
      finish?: string;
      error?: string;
      unfinish?: string;
    };
  }

  export interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
  }

  export class Transaction {
    constructor(parentObj: any);
    status(transactionId: string): Promise<any>;
    statusb2b(transactionId: string): Promise<any>;
    approve(transactionId: string): Promise<any>;
    deny(transactionId: string): Promise<any>;
    cancel(transactionId: string): Promise<any>;
    expire(transactionId: string): Promise<any>;
    refund(transactionId: string, parameter?: any): Promise<any>;
    refundDirect(transactionId: string, parameter?: any): Promise<any>;
    notification(notificationObj: any): Promise<any>;
  }

  export class Snap {
    constructor(options: MidtransClientOptions);
    apiConfig: any;
    httpClient: any;
    transaction: Transaction;
    createTransaction(parameter: SnapTransactionParameters): Promise<SnapTransactionResponse>;
    createTransactionToken(parameter: SnapTransactionParameters): Promise<string>;
    createTransactionRedirectUrl(parameter: SnapTransactionParameters): Promise<string>;
  }

  export class CoreApi {
    constructor(options: MidtransClientOptions);
    apiConfig: any;
    httpClient: any;
    transaction: Transaction;
    charge(parameter: any): Promise<any>;
    capture(parameter: any): Promise<any>;
    cardRegister(parameter: any): Promise<any>;
    cardToken(parameter: any): Promise<any>;
    cardPointInquiry(tokenId: string): Promise<any>;
  }

  export class Iris {
    constructor(options: MidtransClientOptions);
    ping(): Promise<string>;
  }

  export class SnapBi {
    constructor(options: MidtransClientOptions);
  }

  const midtransClient: {
    Snap: typeof Snap;
    CoreApi: typeof CoreApi;
    Iris: typeof Iris;
    SnapBi: typeof SnapBi;
  };

  export default midtransClient;
}
