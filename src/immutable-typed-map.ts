import { Map as IMap, List as IList } from "immutable";

export interface ImmutableTypedMap<DataType extends Object>
  extends IMap<any, AllowedType> {
  toJs(): DataType;
  get<K extends keyof DataType>(
    key: K,
    ifNotSet?: DataType[K]
  ): DataType[K] & AllowedType;
  set<K extends keyof DataType>(key: K, value: DataType[K] & AllowedType): this;
}

export const createTypedMap = <DataType extends Object>(
  data: DataType
): ImmutableTypedMap<DataType> => IMap<any, any>(data as any) as any;

type AllowedType =
  | string
  | number
  | boolean
  | AllowedMap
  | AllowedList
  | AllowedSubMap
  | undefined;

interface AllowedSubMap extends ImmutableTypedMap<any> {}

interface AllowedList extends IList<AllowedType> {}

interface AllowedMap extends IMap<AllowedType, AllowedType> {}

// This code was in the original article, but I don't think it's
// doing the same thing with modern Typescript
//
// export type MapTypeAllowedData<DataType extends Object> = {
//   [K in keyof DataType]: AllowedType;
// };
