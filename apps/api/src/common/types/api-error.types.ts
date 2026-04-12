export type ApiErrorDetail = {
  field?: string;
  reason: string;
};

export type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
};
