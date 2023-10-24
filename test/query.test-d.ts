import { describe, test, expectTypeOf } from "vitest";
import type { Collection, ObjectId } from "mongodb";
import { FindOneQuery, FindQuery } from "../src/query";
import Repository from "../src";

type User = {
  name: string;
  age: number;
  ref: ObjectId;
};

describe("test query classes", () => {
  test("find query", async () => {
    const baseQuery = new FindQuery({} as Collection<User>);
    expectTypeOf(await baseQuery.exec()).toEqualTypeOf<
      { _id: ObjectId; name: string; age: number; ref: ObjectId }[]
    >();

    const queryWithFields = await baseQuery.fields(["age", "ref"]).exec();
    expectTypeOf(queryWithFields).toEqualTypeOf<
      { _id: ObjectId; age: number; ref: ObjectId }[]
    >();

    const queryWithJoin = await baseQuery
      .joins({ ref: (id) => Promise.resolve(id.toString()) })
      .exec();
    expectTypeOf(queryWithJoin).toEqualTypeOf<
      { _id: ObjectId; name: string; age: number; ref: string }[]
    >();

    const queryWithFieldsAndJoin = await baseQuery
      .fields(["ref", "name"])
      .joins({ ref: (id) => Promise.resolve(id.toString()) })
      .exec();
    expectTypeOf(queryWithFieldsAndJoin).toEqualTypeOf<
      { _id: ObjectId; name: string; ref: string }[]
    >();
  });

  test("findOne query", async () => {
    const baseQuery = new FindOneQuery({} as Collection<User>);

    expectTypeOf(await baseQuery.exec()).toEqualTypeOf<{
      _id: ObjectId;
      name: string;
      age: number;
      ref: ObjectId;
    } | null>();

    const queryWithFields = await baseQuery.fields(["age", "ref"]).exec();
    expectTypeOf(queryWithFields).toEqualTypeOf<{
      _id: ObjectId;
      age: number;
      ref: ObjectId;
    } | null>();

    const queryWithJoin = await baseQuery
      .joins({ ref: (id) => Promise.resolve(id.toString()) })
      .exec();
    expectTypeOf(queryWithJoin).toEqualTypeOf<{
      _id: ObjectId;
      name: string;
      age: number;
      ref: string;
    } | null>();

    const queryWithFieldsAndJoin = await baseQuery
      .fields(["name", "ref"])
      .joins({ ref: (id) => Promise.resolve(id.toString()) })
      .exec();
    expectTypeOf(queryWithFieldsAndJoin).toEqualTypeOf<{
      _id: ObjectId;
      name: string;
      ref: string;
    } | null>();
  });

  test("findById repository method", async () => {
    const repository = new Repository({} as Collection<User>);

    const baseQuery = repository.findById({} as ObjectId);
    expectTypeOf(await baseQuery.exec()).toEqualTypeOf<{
      _id: ObjectId;
      name: string;
      age: number;
      ref: ObjectId;
    } | null>();

    const queryWithFields = await baseQuery.fields(["name", "ref"]).exec();
    expectTypeOf(queryWithFields).toEqualTypeOf<{
      _id: ObjectId;
      name: string;
      ref: ObjectId;
    } | null>();

    const queryWithJoin = await baseQuery
      .joins({ ref: (id) => Promise.resolve(id.toString()) })
      .exec();
    expectTypeOf(queryWithJoin).toEqualTypeOf<{
      _id: ObjectId;
      name: string;
      age: number;
      ref: string;
    } | null>();
  });
});
