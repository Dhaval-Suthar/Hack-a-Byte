"use server";

import { z } from "zod";
import clientPromise from "../lib/mongodb";
import { ObjectId, PushOperator } from "mongodb";

const TransferSchema = z.object({
  sender: z.string(),
  username: z.string(),
  amount: z.number(),
});

const HackerSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const AdminSchema = z.object({
  username: z.string(),
  password: z.string(),
  secretCode: z.string(),
});

const Admin = AdminSchema;
const SignUp = HackerSchema;
const LogIn = HackerSchema;
const Delete = HackerSchema;
const Transfer = TransferSchema;

export async function admin(data: {
  username: string;
  password: string;
  secretCode: string;
}) {
  try {
    const { username, password, secretCode } = Admin.parse(data);

    if (secretCode !== "charger") return false;

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

    return response.acknowledged;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function signup(data: { username: string; password: string }) {
  try {
    const { username, password } = SignUp.parse(data);

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
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

    db.collection("websites").insertOne({
      owner: username,
      type: "money",
      malwareId: 0,
    });

    return response.insertedId.toJSON();
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function login(data: { username: string; password: string }) {
  try {
    const { username, password } = LogIn.parse(data);

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db.collection("hackers").findOne({
      username,
      password,
    });

    if (!response) {
      return {
        id: "0",
        lastLogin: "never",
      };
    }

    let returnData = {
      id: response?._id.toJSON(),
      lastLogin: response?.lastLogin,
    };

    return returnData;
  } catch (e) {
    console.error(e);
    return {
      id: "0",
      lastLogin: "never",
    };
  }
}

export async function deleteUser(data: { username: string; password: string }) {
  try {
    const { username, password } = Delete.parse(data);

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db.collection("hackers").deleteOne({
      username,
      password,
    });

    return response.deletedCount;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function search() {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db
      .collection("hackers")
      .aggregate([
        { $addFields: { randomField: { $rand: {} } } },
        { $sort: { randomField: 1 } },
        { $limit: 1 },
      ])
      .toArray();

    if (!response[0]) {
      return false;
    }

    return response[0].username;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function balance(id: string) {
  try {
    if (id == "0") return false;

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db
      .collection("hackers")
      .findOne({ _id: new ObjectId(id) });

    if (!response) {
      return false;
    }

    return response.balance.toString();
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function storage(id: string) {
  try {
    if (id == "0") return false;

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db
      .collection("hackers")
      .findOne({ _id: new ObjectId(id) });

    if (!response) {
      return false;
    }

    return response.storage;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function transfer(data: {
  sender: string;
  username: string;
  amount: number;
}) {
  try {
    const { sender, username, amount } = Transfer.parse(data);

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db
      .collection("hackers")
      .findOne({ username: sender });

    if (!response || response.balance < amount) {
      return false;
    }

    // Start a Client Session
    const session = client.startSession();

    const transactionId = new ObjectId();

    try {
      await session.withTransaction(async () => {
        const collection = db.collection("hackers");

        if (!sender) return false;

        db.collection("transactions").insertOne({
          _id: transactionId,
          from: sender,
          to: username,
          amount,
          date: new Date(),
        });

        await collection.findOneAndUpdate(
          { username: sender },
          {
            $inc: { balance: -amount },
            $push: {
              transactions: transactionId,
            } as unknown as PushOperator<Document>,
          },
          { session }
        );

        await collection.findOneAndUpdate(
          { username },
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

    return transactionId;
  } catch (e) {
    console.error(e);
    return false;
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

    if (!response[0]) {
      return "";
    }

    return JSON.stringify(response);
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function transactions(data: { name: string }) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db
      .collection("transactions")
      .find({ $or: [{ from: data.name }, { to: data.name }] })
      .sort({ date: -1 })
      .limit(10)
      .toArray();

    if (!response[0]) {
      return "";
    }

    return JSON.stringify(response);
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function browser(data: {
  name: string;
  process: string;
  link: string;
}) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    if (data.link === "none" || data.link === "") return "No link is provided!";

    if (data.link.length <= 31) return "Invalid link!";

    let link = data.link.slice(31); // Removes "https://hack-a-byte.vercel.app/"

    switch (data.process) {
      case "hack":
        const response = await db
          .collection("websites")
          .findOne({ _id: new ObjectId(link) });

        if (response?._id) {
          if (response.owner === data.name)
            return "You can't hack your own website!";

          switch (response?.type) {
            case "money":
              await db
                .collection("websites")
                .updateOne(response, { $set: { owner: data.name } });
              return "The website have been hacked";
            case "virus":
              await db
                .collection("hackers")
                .updateOne({ username: data.name }, { $set: { balance: 0 } });
              return "You have been hacked";

            default:
              return `Can't Hack ${response.owner}'s website!`;
          }
        }

        return "Invalid link!";

      default:
        return "Invalid process!";
    }
  } catch (e) {
    console.error(e);
    return "";
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

    if (!response[0]) return "";

    return JSON.stringify(response);
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function ham(data: { user: string; process: string }) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    switch (data.process) {
      case "virus":
        // Start a Client Session
        const session = client.startSession();

        const user = await db
          .collection("hackers")
          .findOne({ username: data.user });

        if (!user) return "User not found!";

        if (user.balance < 1000) return "Not enough balance!";

        const virusId = new ObjectId();

        try {
          await session.withTransaction(async () => {
            db.collection("malwares").insertOne({
              _id: virusId,
              owner: data.user,
              type: "virus",
            });

            await db
              .collection("hackers")
              .updateOne(user, { $inc: { balance: -1000 } }, { session });

          });
        } finally {
          await session.endSession();
        }

        return "Your Virus id is " + virusId.toJSON();
      default:
        return "Invalid process!";
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function deploy(data: { user: string, websiteLink: string, softwareId: string }) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const user = await db
      .collection("hackers")
      .findOne({ username: data.user });

    if (!user) return "User not found!";

    if (data.websiteLink === "") return "No link is provided!";

    if (data.websiteLink.length <= 31) return "Invalid link!";

    let link = data.websiteLink.slice(31); // Removes "https://hack-a-byte.vercel.app/"

    const website = await db
      .collection("websites")
      .findOne({ _id: new ObjectId(link) });

    if (!website?._id) return "Invalid website link!";
    if (website?.owner !== data.user) return "Not your website!";

    const software = await db
      .collection("malwares")
      .findOne({ _id: new ObjectId(data.softwareId) });

    if (!software?._id) return "Invalid software id!";


    await db.collection("websites").updateOne(website, {
      $set: { type: "virus", malwareId: data.softwareId },
    });

    setTimeout(async () => {
      const client = await clientPromise;
      const db = client.db("Hack-a-Byte");
      await db.collection("websites").updateOne(website, {
        $set: { type: "money", malwareId: 0 },
      });
      await db.collection("malwares").deleteOne({ _id: new ObjectId(data.softwareId) });
    }, 24 * 60 * 60 * 1000);

    return "Deployed Successfully!";
  } catch (e) {
    console.error(e);
    return "Some Error Occured!";
  }
}
