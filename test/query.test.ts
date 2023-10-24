import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { describe, test, expect, afterAll, beforeAll } from "vitest";
import { faker } from "@faker-js/faker";

import { getDbHelper } from "./dbHelper";
import { FindQuery, FindOneQuery } from "../src";

describe("test query classes", async () => {
  const mongod = await MongoMemoryServer.create();
  const mongoClient = await MongoClient.connect(mongod.getUri());
  const dbHelper = getDbHelper(mongoClient, mongod);

  type BlogPost = {
    title: string;
    content: string;
    createdAt: Date;
    author: ObjectId; // reference to User
  };

  type User = {
    name: string;
    age: number;
  };

  const db = mongoClient.db();
  const usersCollection = db.collection<User>("users");
  const postsCollection = db.collection<BlogPost>("posts");

  beforeAll(async () => {
    const insertedUsers = await usersCollection.insertMany(
      Array.from({ length: 5 }, () => ({
        name: faker.person.firstName(),
        age: faker.number.int(),
      })),
    );
    await postsCollection.insertMany(
      Array.from({ length: 5 }, (_, i) => ({
        title: faker.lorem.sentence(5),
        content: faker.lorem.paragraph(),
        createdAt: faker.date.recent(),
        author: insertedUsers.insertedIds[i]!,
      })),
    );
  });
  afterAll(async () => {
    await dbHelper.clearDatabase();
    await dbHelper.closeDatabase();
  });

  test("find query", async () => {
    const storedPosts = await postsCollection.find({}).toArray();
    const queriedPosts = await new FindQuery(postsCollection).exec();

    expect(queriedPosts.length).toEqual(storedPosts.length);
    expect(
      storedPosts.every((post) =>
        queriedPosts.map((p) => p._id.toString()).includes(post._id.toString()),
      ),
    ).toBe(true);
  });

  test("find query with fields", async () => {
    const queriedPosts = await new FindQuery(postsCollection)
      .fields(["title", "createdAt"])
      .exec();

    expect(
      queriedPosts.every((post) => {
        const keys = Object.keys(post);
        return (
          !keys.includes("content") &&
          !keys.includes("author") &&
          keys.includes("_id")
        );
      }),
    ).toBe(true);
  });

  test("find query with join", async () => {
    const storedPosts = await postsCollection.find({}).toArray();
    const queriedPosts = await new FindQuery(postsCollection)
      .joins({
        author: (_id) =>
          new FindOneQuery(usersCollection).filter({ _id }).exec(),
      })
      .exec();

    expect(
      queriedPosts
        .map((post) => post.author!._id.toString())
        .every((authorId) =>
          storedPosts.map((post) => post.author.toString()).includes(authorId),
        ),
    ).toBe(true);
  });

  test("find query with fields and join", async () => {
    const storedUsers = await usersCollection.find({}).toArray();
    const queriedPosts = await new FindQuery(postsCollection)
      .fields(["title", "author"])
      .joins({
        author: (_id) =>
          new FindOneQuery(usersCollection).filter({ _id }).exec(),
      })
      .exec();
    expect(
      queriedPosts.every((post) => {
        const keys = Object.keys(post);
        return (
          !keys.includes("content") &&
          !keys.includes("createdAt") &&
          keys.includes("_id")
        );
      }),
    );
    expect(
      queriedPosts.every(
        (post) =>
          post.author === null ||
          storedUsers
            .map((p) => p._id.toString())
            .includes(post._id.toString()),
      ),
    );
  });
});
