import React from 'react';
import { createSearchParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

export const HomePageSchema = z.object({
  page: z.literal('home').optional(),
  accountId: z.string().optional(),
  sort: z.string().optional(),
  dir: z.string().optional(),
});
export type HomePageSchemaType = z.infer<typeof HomePageSchema>;

export const SettingsPageSchema = z.object({
  page: z.literal('settings'),
  accountId: z.string().optional(),
});
export type SettingsPageSchemaType = z.infer<typeof SettingsPageSchema>;

export const ManageActionSchema = z.union([
  z.literal('deposit'),
  z.literal('repay'),
  z.literal('claim'),
  z.literal('undelegate'),
  z.literal('withdraw'),
  z.literal('withdraw-debt'),
  z.literal('close'),
  z.literal('locked'),
]);
export type ManageActionType = z.infer<typeof ManageActionSchema>;

export const PositionPageSchema = z.object({
  page: z.literal('position'),
  collateralSymbol: z.string(),
  manageAction: ManageActionSchema,
  accountId: z.string().optional(),
});
export type PositionPageSchemaType = z.infer<typeof PositionPageSchema>;

const AllowedQueriesSchema = z.union([HomePageSchema, SettingsPageSchema, PositionPageSchema]);
type AllowedQueriesType = z.infer<typeof AllowedQueriesSchema>;

export function searchParamsToObject(searchParams: URLSearchParams) {
  const params = Object.fromEntries(Array.from(searchParams));

  for (const schema of [HomePageSchema, SettingsPageSchema, PositionPageSchema]) {
    const parsed = schema.safeParse(params);
    if (parsed.success) {
      return parsed.data;
    }
  }
  console.error('Route cannot be matched', params);
  return {}; // Go to homepage
}

export function sortObject(params: AllowedQueriesType): AllowedQueriesType {
  return Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));
}

export function cleanObject(params: AllowedQueriesType): AllowedQueriesType {
  const cleaned = Object.entries(params).filter(([, value]) => value !== undefined);
  return Object.fromEntries(cleaned);
}

export function makeParams(newParams: AllowedQueriesType) {
  return createSearchParams(sortObject(cleanObject(newParams)));
}

export function makeSearch(newParams: AllowedQueriesType) {
  return makeParams(newParams).toString();
}

export function useParams<T = AllowedQueriesType>(): [T, (newParams: AllowedQueriesType) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = React.useMemo(() => searchParamsToObject(searchParams) as T, [searchParams]);

  const setParams = React.useCallback(
    (newParams: AllowedQueriesType): void => {
      setSearchParams(makeParams(newParams));
    },
    [setSearchParams]
  );

  return [params, setParams];
}
