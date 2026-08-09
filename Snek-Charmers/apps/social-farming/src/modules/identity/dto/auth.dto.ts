import { IsNotEmpty, IsString } from "class-validator";

export class NonceRequestDto {
  @IsString()
  @IsNotEmpty()
  address!: string;
}

/** CIP-30 data-signature produced by the wallet over the login message. */
export class VerifyDto {
  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  nonce!: string;

  /** COSE_Sign1 signature hex from wallet.signData(). */
  @IsString()
  @IsNotEmpty()
  signature!: string;

  /** COSE_Key hex from wallet.signData(). */
  @IsString()
  @IsNotEmpty()
  key!: string;
}
