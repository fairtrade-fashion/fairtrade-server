export interface PaystackVerifyTransactionResponseDto {
  status: boolean;
  data: {
    status: string;
    metadata: {
      cart_id: string;
      user_id: string;
      shipping_address_id: string;
    };
    amount: number;
  };
}
