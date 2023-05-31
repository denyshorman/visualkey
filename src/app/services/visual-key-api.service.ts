import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VisualKeyApiService {
  constructor(private httpClient: HttpClient) {}

  getPrice(param: { chainId: number; token: bigint; receiver: string; checkDiscount?: boolean }): Observable<Price> {
    const url = `${environment.vkApiUrl}/v1/nft/tokens/${param.token}/price`;

    const params: any = {
      chainId: param.chainId,
      receiver: param.receiver,
    };

    if (param.checkDiscount !== undefined) {
      params.checkDiscount = param.checkDiscount;
    }

    return this.httpClient.get<Price>(url, { params }).pipe(
      catchError(error => {
        throw toVKApiError(error);
      }),
    );
  }

  getMintingAuthorization(param: {
    chainId: number;
    token: bigint;
    receiver: string;
    contract: string;
    checkDiscount?: boolean;
    price: bigint;
    priceExpirationTime: number;
    priceSignature: string;
  }): Observable<MintingAuthorization> {
    const url = `${environment.vkApiUrl}/v1/nft/tokens/${param.token}/minting/authorization`;

    const params: any = {
      chainId: param.chainId,
      contract: param.contract,
      receiver: param.receiver,
      price: param.price.toString(10),
      priceExpirationTime: param.priceExpirationTime,
      priceSignature: param.priceSignature,
    };

    if (param.checkDiscount !== undefined) {
      params.checkDiscount = param.checkDiscount;
    }

    return this.httpClient.get<MintingAuthorization>(url, { params }).pipe(
      catchError(error => {
        throw toVKApiError(error);
      }),
    );
  }
}

//#region Response Models
export interface Price {
  price: bigint;
  expirationTime: number;
  signature: string;
}

export interface MintingAuthorization {
  deadline: number;
  signature: string;
}

export class VkApiError extends Error {
  constructor(
    public readonly code: string,
    public override readonly message: string,
    public readonly params?: { [key: string]: any },
  ) {
    super(message);
  }
}

export enum VkApiErrorCode {
  InvalidSignature = 'INVALID_SIGNATURE',
  PriceExpired = 'PRICE_EXPIRED',
  SignerNotFound = 'SIGNER_NOT_FOUND',
  ChainNotSupported = 'CHAIN_NOT_SUPPORTED',
  TokenAlreadyMinted = 'TOKEN_ALREADY_MINTED',
  PendingMinting = 'PENDING_MINTING',
  TokenLocked = 'TOKEN_LOCKED',
  BadRequest = 'BAD_REQUEST',
  TooManyRequests = 'TOO_MANY_REQUESTS',
  InternalError = 'INTERNAL_ERROR',
}
//#endregion

//#region Utils
function toVKApiError(error: any): any {
  if (error instanceof HttpErrorResponse) {
    const err = error.error;
    if (err.code && err.message) {
      throw new VkApiError(err.code, err.message, err.params);
    } else {
      throw error;
    }
  } else {
    throw error;
  }
}
//#endregion
