export type PublicExceptionBody = {
  code?: string;
  message?: string;
  details?: unknown[];
};

export type PublicErrorDefinition = {
  code: string;
  message: string;
};

export type ValidationDetail = {
  field: string;
  message: string;
};
