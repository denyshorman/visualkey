interface CauseError {
  cause?: unknown;
}

function isErrorWithCause(e: unknown): e is CauseError {
  return typeof e === 'object' && e !== null && 'cause' in e;
}

export function getRootCause(error: unknown): unknown {
  let currentError = error;

  while (isErrorWithCause(currentError) && currentError.cause) {
    currentError = currentError.cause;
  }

  return currentError;
}
