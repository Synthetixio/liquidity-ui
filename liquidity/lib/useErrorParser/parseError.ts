/* eslint-disable no-console */
import { importAllErrors } from '@snx-v3/contracts';
import { ethers } from 'ethers';
import { decodeBuiltinErrors } from './decodeBuiltinErrors';
import { decodePythErrors } from './decodePythErrors';

export async function parseError({
  error,
  chainId,
  preset,
}: {
  error: Error | any;
  chainId: number;
  preset: string;
}) {
  const errorData =
    error?.error?.error?.error?.data ||
    error?.error?.error?.data ||
    error?.error?.data?.data ||
    error?.error?.data ||
    error?.data?.data ||
    error?.data;

  if (typeof errorData !== 'string') {
    console.log('Error data missing', { error });
    throw error;
  }
  const AllErrorsContract = await importAllErrors(chainId, preset);
  const errorParsed = (() => {
    try {
      const panic = decodeBuiltinErrors(errorData);
      if (panic) {
        return panic;
      }
      const pythError = decodePythErrors(errorData);
      if (pythError) {
        return pythError;
      }
      const AllErrorsInterface = new ethers.utils.Interface(AllErrorsContract.abi);
      const data = AllErrorsInterface.parseError(errorData);
      console.log({ decodedError: data });

      if (
        data?.name === 'OracleDataRequired' &&
        data?.args?.oracleContract &&
        data?.args?.oracleQuery
      ) {
        const oracleAddress = data?.args?.oracleContract;
        const oracleQueryRaw = data?.args?.oracleQuery;

        let updateType, publishTime, stalenessTolerance, feedIds, priceId;
        // eslint-disable-next-line prefer-const
        [updateType, publishTime, priceId] = ethers.utils.defaultAbiCoder.decode(
          ['uint8', 'uint64', 'bytes32'],
          oracleQueryRaw
        );

        if (updateType === 1) {
          [updateType, stalenessTolerance, feedIds] = ethers.utils.defaultAbiCoder.decode(
            ['uint8', 'uint64', 'bytes32[]'],
            oracleQueryRaw
          );
          publishTime = undefined;
        } else {
          feedIds = [priceId];
        }
        Object.assign(error, {
          name: data.name,
          error,
          args: {
            oracleAddress,
            oracleQuery: {
              updateType,
              publishTime: Number(publishTime),
              stalenessTolerance: Number(stalenessTolerance),
              feedIds,
            },
            oracleQueryRaw,
          },
          signature: data.signature,
          sighash: data.sighash,
          errorFragment: data.errorFragment,
        });
        return error;
      }
      return data;
    } catch (e) {
      console.log(e);
    }
    return error;
  })();
  if (!errorParsed.name) {
    throw error;
  }
  const args = errorParsed?.args
    ? Object.fromEntries(
        Object.entries(errorParsed.args).filter(([key]) => `${parseInt(key)}` !== key)
      )
    : {};
  error.message = `${errorParsed?.name}, ${errorParsed?.sighash} (${JSON.stringify(args)})`;
  throw error;
}
