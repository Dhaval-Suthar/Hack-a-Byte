"use server";

import { z } from "zod";
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
import clientPromise from "../lib/mongodb";
import { ObjectId } from "mongodb";

const TransferSchema = z.object({
  id: z.string(),
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

export async function admin(data: { username: string; password: string, secretCode: string }) {
  try {
    const { username, password, secretCode } = Admin.parse({
      username: data.username,
      password: data.password,
      secretCode: data.secretCode,
    });

    if (secretCode !== "charger") return false;

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db.collection("hackers").insertOne({
      username: username,
      password: password,
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
    const { username, password } = SignUp.parse({
      username: data.username,
      password: data.password,
    });

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db.collection("hackers").insertOne({
      username: username,
      password: password,
      balance: 0,
      transactions: [],
      storage: 0,
      computerModel: "HackBook-L",
      lastLogin: new Date(),
    });

    return response.insertedId.toJSON();
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function login(data: { username: string; password: string }) {
  try {
    const { username, password } = LogIn.parse({
      username: data.username,
      password: data.password,
    });

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db.collection("hackers").findOne({
      username: username,
      password: password,
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
    const { username, password } = Delete.parse({
      username: data.username,
      password: data.password,
    });

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db.collection("hackers").deleteOne({
      username: username,
      password: password,
    });

    return response.deletedCount;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function access() {
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

export async function transfer(data: {
  id: string;
  username: string;
  amount: number;
}) {
  try {
    const { id, username, amount } = Transfer.parse({
      id: data.id,
      username: data.username,
      amount: data.amount,
    });

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db
      .collection("hackers")
      .findOne({ _id: new ObjectId(id) });

    if (!response || response.balance < amount) {
      return false;
    }

    // Start a Client Session
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const collection = db.collection("hackers");
        // Important:: You must pass the session to the operations
        await collection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $inc: { balance: -amount } },
          { session }
        );
        await collection.findOneAndUpdate(
          { username: username },
          { $inc: { balance: amount } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return true;
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
      .project({ _id:0, username: 1, balance: 1 })
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
