"use server";

import { z } from "zod";
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
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

export async function balance(user: string) {
  try {
    if (user == "0.0.0.0") return false;

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const response = await db.collection("hackers").findOne({ username: user });

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
  sender: string;
  username: string;
  amount: number;
}) {
  try {
    const { sender, username, amount } = Transfer.parse({
      sender: data.sender,
      username: data.username,
      amount: data.amount,
    });

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
          amount: amount,
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
          { username: username },
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
