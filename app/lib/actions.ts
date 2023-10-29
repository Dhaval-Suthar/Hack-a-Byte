"use server";

import { z } from "zod";
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
import clientPromise from "../lib/mongodb";
import { ObjectId } from "mongodb";

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

const HackerSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const SignUp = HackerSchema;
const LogIn = HackerSchema;
const Delete = HackerSchema;

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
      balance: 1000,
      transactions: [],
      storage: 0,
      computerModel: "HackBook-L",
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
      return false;
    }

    return response?._id.toJSON();
  } catch (e) {
    console.error(e);
    return false;
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
