"use server";

import clientPromise from "../lib/mongodb";
import { ObjectId, PushOperator } from "mongodb";
import { DEFAULT_USER_ID, ERRORS } from "./constants";

const SECRET_PASSWORD = "charger";

export async function admin(username: string, password: string, secretCode: string) {
  try {
    if (secretCode !== SECRET_PASSWORD) return { error: ERRORS.INVALID_CREDENTIALS };

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db.collection("hackers").insertOne({
      username,
      password,
      balance: 100,
      transactions: [],
      storage: 0,
      computerModel: "HackBook-L",
      lastLogin: new Date(),
    });

    if (!response) return { error: ERRORS.SOME_ERROR };

    return { added: true };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function signup(username: string, password: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    // checking if user with same username exist and sending error
    const isUnique = await db.collection("hackers").findOne({ username: username });
    if (!isUnique) return { error: ERRORS.USER_ALREADY_EXISTS };

    const response = await db.collection("hackers").insertOne({
      username: username,
      password: password,
      balance: 0,
      transactions: [],
      storage: {
        used: 1 * 1024 * 1024,
        system: 1 * 1024 * 1024,
        total: 10 * 1024 * 1024,
      },
      computerModel: "HackBook-L",
      lastLogin: new Date(),
    });

    // Add a user website
    db.collection("websites").insertOne({
      owner: username,
      type: "money",
      malwareId: 0,
    });

    return { id: response.insertedId.toJSON() };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function login(username: string, password: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db.collection("hackers").findOne({
      username,
      password,
    });

    if (!response) return { error: ERRORS.INVALID_CREDENTIALS };

    return {
      id: response?._id.toJSON(),
      lastLogin: response?.lastLogin,
    };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function deleteUser(username: string, password: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db.collection("hackers").deleteOne({
      username,
      password,
    });

    if (!response.acknowledged) return { error: ERRORS.INVALID_CREDENTIALS };

    return { deleted: true };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function search() {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db
      .collection("hackers")
      .aggregate([{ $addFields: { randomField: { $rand: {} } } }, { $sort: { randomField: 1 } }, { $limit: 1 }])
      .toArray();

    if (!response[0]) return { error: ERRORS.NO_USER_FOUND };

    return { username: response[0].username };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function balance(id: string) {
  try {
    if (id === DEFAULT_USER_ID) return { error: ERRORS.LOGIN_REQUIRED };

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db.collection("hackers").findOne({ _id: new ObjectId(id) });

    if (!response) return { error: ERRORS.SERVER_ERROR };

    return { balance: response.balance.toString() };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function storage(id: string) {
  try {
    if (id === DEFAULT_USER_ID) return { error: ERRORS.LOGIN_REQUIRED };

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db.collection("hackers").findOne({ _id: new ObjectId(id) });

    if (!response) return { error: ERRORS.INVALID_LOGIN };

    return response.storage;
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function transfer(senderId: string, username: string, amount: number) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const sender = await db.collection("hackers").findOne({ _id: new ObjectId(senderId) });
    const receiver = await db.collection("hackers").findOne({ username: username });

    if (!sender) return { error: ERRORS.INVALID_LOGIN };

    if (!receiver) return { error: ERRORS.NO_USER_FOUND };

    if (sender.balance < amount) return { error: ERRORS.INSUFFICIENT_BALANCE };

    // Start a Client Session
    const session = client.startSession();

    const transactionId = new ObjectId();

    try {
      await session.withTransaction(async () => {
        const collection = db.collection("hackers");

        db.collection("transactions").insertOne({
          _id: transactionId,
          from: sender.username,
          to: username,
          amount,
          date: new Date(),
        });

        await collection.findOneAndUpdate(
          sender,
          {
            $inc: { balance: -amount },
            $push: {
              transactions: transactionId,
            } as unknown as PushOperator<Document>,
          },
          { session }
        );

        await collection.findOneAndUpdate(
          receiver,
          {
            $inc: { balance: amount },
            $push: {
              transactions: transactionId,
            } as unknown as PushOperator<Document>,
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return { id: transactionId };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function leaderboard() {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db
      .collection("hackers")
      .find({})
      .project({ _id: 0, username: 1, balance: 1 })
      .sort({ balance: -1 })
      .limit(5)
      .toArray();

    if (!response[0]) return { error: ERRORS.NO_USER_FOUND };

    return { data: JSON.stringify(response) };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function transactions(name: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db
      .collection("transactions")
      .find({ $or: [{ from: name }, { to: name }] })
      .sort({ date: -1 })
      .limit(10)
      .toArray();

    if (!response[0]) return { error: ERRORS.NO_TRANSACTIONS_FOUND };

    return { data: JSON.stringify(response) };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function browser(userId: string, process: string, link: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    if (link.length <= 31) return { error: ERRORS.INVALID_LINK };

    const websiteId = link.slice(31); // Removes "https://hack-a-byte.vercel.app/"

    switch (process) {
      case "hack":
        const response = await db.collection("websites").findOne({ _id: new ObjectId(websiteId) });

        const user = await db.collection("hackers").findOne({ _id: new ObjectId(userId) });

        if (!user) return { error: ERRORS.INVALID_LOGIN };

        if (response?._id) {
          if (response.owner === user.username) return { error: "You can't hack your own website!" };

          switch (response?.type) {
            case "money":
              await db.collection("websites").updateOne(response, { $set: { owner: name } });
              return { success: "The website have been hacked" };
            case "virus":
              await db.collection("hackers").updateOne({ username: name }, { $set: { balance: 0 } });
              return { success: "You have been hacked" };

            default:
              return { error: `Can't Hack ${response.owner}'s website!` };
          }
        }

        return { error: ERRORS.INVALID_LINK };

      default:
        return { error: ERRORS.INVALID_PROCESS };
    }
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function browse() {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db
      .collection("websites")
      .aggregate([{ $sample: { size: 10 } }])
      .toArray();

    if (!response[0]) return { error: ERRORS.NO_WEBSITES_FOUND };

    return { data: JSON.stringify(response) };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function ham(userId: string, process: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    switch (process) {
      case "virus":
        // Start a Client Session
        const session = client.startSession();

        const user = await db.collection("hackers").findOne({ _id: new ObjectId(userId) });

        if (!user) return { error: ERRORS.INVALID_LOGIN };

        if (user.balance < 1000) return { error: ERRORS.INSUFFICIENT_BALANCE };

        const virusId = new ObjectId();

        try {
          await session.withTransaction(async () => {
            db.collection("malwares").insertOne({
              _id: virusId,
              owner: user.username,
              type: "virus",
            });

            await db.collection("hackers").updateOne(user, { $inc: { balance: -1000 } }, { session });
          });
        } finally {
          await session.endSession();
        }

        return { success: "Your Virus id is " + virusId.toJSON() };
      default:
        return { error: ERRORS.INVALID_PROCESS };
    }
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function deploy(userId: string, websiteLink: string, softwareId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const user = await db.collection("hackers").findOne({ _id: new ObjectId(userId) });

    if (!user) return { error: ERRORS.INVALID_LOGIN };

    if (websiteLink.length <= 31) return { error: ERRORS.INVALID_LINK };

    const link = websiteLink.slice(31); // Removes "https://hack-a-byte.vercel.app/"

    const website = await db.collection("websites").findOne({ _id: new ObjectId(link) });

    if (!website?._id) return { error: ERRORS.INVALID_LINK };

    if (website?.owner !== user.username) return { error: ERRORS.NOT_YOUR_WEBSITE };

    const software = await db.collection("malwares").findOne({ _id: new ObjectId(softwareId) });

    if (!software?._id) return { error: ERRORS.INVALID_SOFTWARE_ID };

    await db.collection("websites").updateOne(website, {
      $set: { type: "virus", malwareId: softwareId },
    });

    // Remove the virus after 24 hours and also delete it
    setTimeout(
      async () => {
        const client = await clientPromise;
        const db = client.db("Hack-a-Byte");
        await db.collection("websites").updateOne(website, {
          $set: { type: "money", malwareId: 0 },
        });
        await db.collection("malwares").deleteOne({ _id: new ObjectId(softwareId) });
      },
      24 * 60 * 60 * 1000
    );

    return { success: "Deployed Successfully!" };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}
