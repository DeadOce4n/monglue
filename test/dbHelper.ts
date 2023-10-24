import type { MongoClient } from "mongodb";
import type { MongoMemoryServer } from "mongodb-memory-server";

export const getDbHelper = (
  client: MongoClient,
  mongod: MongoMemoryServer,
) => ({
  async clearDatabase(dbName?: string | string[]) {
    let collections: string[];
    if (Array.isArray(dbName)) {
      collections = (
        await Promise.all(
          dbName.map(async (name) => {
            const colls = await client.db(name).listCollections().toArray();
            return colls.map((coll) => coll.name);
          }),
        )
      ).flat();
    } else {
      collections = (await client.db(dbName).listCollections().toArray()).map(
        (coll) => coll.name,
      );
    }
    await Promise.all(
      collections.map(async (collection) =>
        client.db().dropCollection(collection),
      ),
    );
  },
  async closeDatabase() {
    await client.close();
    await mongod.stop();
  },
});
