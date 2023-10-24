import type {
  Filter,
  Collection,
  Document,
  ObjectId,
  OptionalUnlessRequiredId,
} from "mongodb";

import { FindOneQuery, FindQuery } from "./query";

export class Repository<TDocument extends Document = Document> {
  constructor(private collection: Collection<TDocument>) {
    this.collection = collection;
  }

  public find() {
    return new FindQuery(this.collection);
  }

  public findOne() {
    return new FindOneQuery(this.collection);
  }

  public findById(id: ObjectId) {
    return new FindOneQuery(this.collection).filter({
      _id: id,
    } as Filter<TDocument>) as Omit<FindOneQuery<TDocument>, "filter">;
  }

  public async insertOne(document: OptionalUnlessRequiredId<TDocument>) {
    const { insertedId } = await this.collection.insertOne(document);
    const newDocument = await this.findById(insertedId).exec();

    if (!newDocument) {
      throw new Error("documentInsertError", {
        cause: `Error inserting document into collection ${this.collection.collectionName}`,
      });
    }

    return newDocument;
  }

  public async insertMany(documents: OptionalUnlessRequiredId<TDocument>[]) {
    const { insertedIds } = await this.collection.insertMany(documents);
    const query = new FindQuery(this.collection);

    return query
      .filter({
        _id: { $in: Object.values(insertedIds) },
      } as Parameters<(typeof query)["filter"]>[0])
      .exec();
  }

  public async updateOne(_id: ObjectId, values: Partial<TDocument>) {
    const updated = await this.collection.findOneAndUpdate(
      { _id } as Parameters<Collection<TDocument>["updateOne"]>[0],
      { $set: values },
      { returnDocument: "after" },
    );

    if (!updated) {
      throw new Error("documentUpdateError", {
        cause: `Error updating document ${_id.toString()} from collection ${
          this.collection.collectionName
        }`,
      });
    }

    return updated;
  }

  // TODO: make this type-safe with zod
  public aggregate(
    ...args: Parameters<Repository<TDocument>["collection"]["aggregate"]>
  ) {
    return this.collection.aggregate(...args);
  }
}
