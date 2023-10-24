export const getProjectionFromParams = <TParams extends PropertyKey[]>(
  params?: TParams,
) =>
  Object.fromEntries(
    (params ?? []).map((param) => [param, 1]).concat([["_id", 1]]),
  ) as Partial<{
    [Property in TParams[number]]: 1;
  }>;
