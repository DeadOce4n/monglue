/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Collection, Document, Filter, WithId, ObjectId } from "mongodb";
import type { ConditionalExcept, Simplify } from "type-fest";

import { getProjectionFromParams } from "./func";

export type JoinFn<TReturn> = (id: ObjectId) => Promise<TReturn>;

export type Joins<
  TDocument extends Document,
  TJoinFn extends JoinFn<any> = JoinFn<any>,
> = Partial<
  ConditionalExcept<
    {
      [Prop in keyof Required<TDocument>]: TDocument[Prop] extends ObjectId
        ? TJoinFn
        : never;
    },
    never
  >
>;

export class FindQuery<
  TDocument extends Document,
  TFields extends (keyof TDocument)[] = (keyof TDocument)[],
  TJoins extends Joins<Pick<TDocument, TFields[number]>> = Joins<
    Pick<TDocument, TFields[number]>
  >,
> {
  private _filter?: Filter<TDocument>;
  private _fields?: TFields;
  private _joins?: TJoins;
  private collection: Collection<TDocument>;

  constructor(collection: Collection<TDocument>) {
    this.collection = collection;
  }

  public filter(filter: Filter<TDocument>) {
    this._filter = filter;
    return this;
  }

  public fields<T extends TFields>(fields?: T) {
    this._fields = fields;
    return this as FindQuery<TDocument, T extends undefined ? TFields : T>;
  }

  public joins<T extends TJoins>(joins: T) {
    this._joins = joins;
    return this as Omit<FindQuery<TDocument, TFields, T>, "fields">;
  }

  public async exec(): Promise<
    Simplify<
      WithId<
        Pick<
          {
            [Prop in keyof TDocument]: Prop extends keyof TJoins
              ? TJoins[Prop] extends (...args: any[]) => any
                ? Awaited<ReturnType<NonNullable<TJoins[Prop]>>>
                : TDocument[Prop]
              : TDocument[Prop];
          },
          TFields[number]
        >
      >
    >[]
  > {
    const findArgs: Parameters<
      FindQuery<TDocument, TFields, TJoins>["collection"]["find"]
    > = [{}, {}];
    if (this._filter) {
      findArgs[0] = this._filter;
    }

    if (this._fields) {
      findArgs[1] = {
        projection: getProjectionFromParams(this._fields),
      };
    }

    const results = await this.collection.find(...findArgs).toArray();

    if (this._joins) {
      return Promise.all(
        results.map(async (result) =>
          Object.fromEntries(
            await Promise.all(
              Object.entries(result).map(async (entry) => {
                if (
                  Object.keys(this._joins!).includes(entry[0]) &&
                  typeof this._joins?.[entry[0] as keyof TJoins] === "function"
                ) {
                  return [
                    entry[0],
                    await this._joins[entry[0] as keyof TJoins]!(
                      result[entry[0]],
                    ),
                  ];
                }
                return entry;
              }),
            ),
          ),
        ),
      );
    }
    return results;
  }
}

export class FindOneQuery<
  TDocument extends Document,
  TFields extends (keyof TDocument)[] = (keyof TDocument)[],
  TJoins extends Joins<Pick<TDocument, TFields[number]>> = Joins<
    Pick<TDocument, TFields[number]>
  >,
> {
  private _filter?: Filter<TDocument>;
  private _fields?: TFields;
  private _joins?: TJoins;
  private collection: Collection<TDocument>;

  constructor(collection: Collection<TDocument>) {
    this.collection = collection;
  }

  public filter(filter: Filter<TDocument>) {
    this._filter = filter;
    return this;
  }

  public fields<T extends TFields>(fields?: T) {
    this._fields = fields;
    return this as FindOneQuery<TDocument, T extends undefined ? TFields : T>;
  }

  public joins<T extends TJoins>(joins: T) {
    this._joins = joins;
    return this as Omit<FindOneQuery<TDocument, TFields, T>, "fields">;
  }

  public async exec(): Promise<Simplify<
    WithId<
      Pick<
        {
          [Prop in keyof TDocument]: Prop extends keyof TJoins
            ? TJoins[Prop] extends (...args: any[]) => any
              ? Awaited<ReturnType<NonNullable<TJoins[Prop]>>>
              : TDocument[Prop]
            : TDocument[Prop];
        },
        TFields[number]
      >
    >
  > | null> {
    const findArgs: Parameters<
      FindOneQuery<TDocument, TFields, TJoins>["collection"]["findOne"]
    > = [{}, {}];
    if (this._filter) {
      findArgs[0] = this._filter;
    }

    if (this._fields) {
      findArgs[1] = {
        projection: getProjectionFromParams(this._fields),
      };
    }

    const result = await this.collection.findOne(...findArgs);

    if (result && this._joins) {
      return Object.fromEntries(
        await Promise.all(
          Object.entries(result).map(async (entry) => {
            if (Object.keys(this._joins!).includes(entry[0])) {
              return [entry[0], await entry[1](result[entry[0]])];
            }
            return entry;
          }),
        ),
      );
    }
    return result as any; // this is fine!
  }
}
