"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import clientPromise from "../lib/mongodb";

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
    let response = db.collection("hackers").insertOne({
      username: username,
      password: password,
    });

    return (await response).insertedId;
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
    let response = await db.collection("hackers").findOne({
      username: username,
      password: password,
    });

    if (!response)
    {
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
    let response = await db.collection("hackers").deleteOne({
      username: username,
      password: password,
    });

    return response.acknowledged;
  } catch (e) {
    console.error(e);
    return false;
  }
}
