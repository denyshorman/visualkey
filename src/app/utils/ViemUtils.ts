import { ContractFunctionExecutionError, ContractFunctionRevertedError, decodeErrorResult } from 'viem';
import { Abi } from 'abitype';

export function getContractError(error: ContractFunctionExecutionError, abi: Abi) {
  if (error.cause instanceof ContractFunctionRevertedError) {
    return error.cause.data;
  } else {
    // workaround for Hardhat (viem bug)
    const data = (error as any).cause?.cause?.cause?.cause?.cause?.data?.data;
    if (data !== undefined) {
      return decodeErrorResult({ data, abi });
    } else {
      return undefined;
    }
  }
}
