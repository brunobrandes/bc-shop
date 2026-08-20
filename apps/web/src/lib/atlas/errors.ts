export type AtlasErrorCode =
  "CONFIGURATION" | "NETWORK" | "TIMEOUT" | "UPSTREAM" | "INVALID_RESPONSE";

export class AtlasError extends Error {
  constructor(
    public readonly code: AtlasErrorCode,
    message: string,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AtlasError";
  }
}
