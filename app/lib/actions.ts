"use server";

import clientPromise from "../lib/mongodb";
import { ObjectId } from "mongodb";
import { DEFAULT_USERNAME, DEFAULT_USER_ID, ERRORS, MODELS, SOFTWARES } from "./constants";
import { INVALID, z } from "zod";
import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getHint } from "./utils";
import { COMMANDS } from "./commands";
import { isRedirectError } from "next/dist/client/components/redirect";
import { generateFromEmail, generateUsername } from "unique-username-generator";

const DATABASE_NAME = process.env.DATABASE_NAME;

const UserSchema = z.object({
  username: z
    .string({ invalid_type_error: "Username has Invalid Type" })
    .min(3, { message: "Username should contain atleast 3 characters" })
    .max(20, { message: "Username should contain atmost 20 characters" }),
  password: z
    .string({ invalid_type_error: "Password has Invalid Type" })
    .min(6, { message: "Password should contain atleast 6 characters" })
    .max(20, { message: "Password should contain atmost 20 characters" }),
  email: z.string({ invalid_type_error: "Email has Invalid Type" }).email({ message: "Invalid Email" }),
  confirmPassword: z.string({ invalid_type_error: "Confirm Password has Invalid Type" }),
});

const loginSchema = UserSchema.omit({ email: true, confirmPassword: true });

export async function action(commandName: string, data: any, device: string = MODELS.L) {
  try {
    const { command, username, password, amount, receiver, link, softwareId, software, confirm, sender } = data;

    const commandData = COMMANDS[commandName as keyof typeof COMMANDS];
    if (!commandData) return { error: ERRORS.INVALID_COMMAND };
    const requirements = commandData.usage
      .slice(commandName.length + 1)
      .replaceAll("[", "")
      .replaceAll("]", "")
      .split(" ");

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const users = db.collection("users");
    const transactions = db.collection("transactions");
    const websites = db.collection("websites");
    const softwares = db.collection("softwares");
    const emails = db.collection("emails");

    // Default values
    let websiteLink = "https://hack-a-byte.vercel.app/";
    let website: any;
    let softwareObject: any;
    let receiverObject: any;
    let softwareData: any;
    let user: any;
    let loggedUser: any;
    let userPassword: any;
    let storedUsername: any;
    let loggedUserMalware: any;
    let storedPassword;
    let session: any;
    const newTransactionId = new ObjectId();
    const newSoftwareId = new ObjectId();

    if (commandData.requiresLogin) {
      // Get the token from the cookies
      const sessionToken = cookies().get(device + "-token")?.value;

      // Check if the token is present
      if (!sessionToken) return { error: ERRORS.LOGIN_REQUIRED };

      // Verify the token
      const data = jwt.verify(sessionToken, process.env.JWT_SECRET + device) as any;

      // Check the credentials of the logged in user
      if (!data.user.id) return { error: ERRORS.LOGIN_REQUIRED };

      loggedUser = await users.findOne({ _id: new ObjectId(data.user.id) });

      if (!loggedUser) return { error: ERRORS.INVALID_LOGIN };

      // Check if the owner owns the device
      if (!loggedUser.models[device]) return { error: ERRORS.DEVICE_NOT_FOUND };

      // Check for ransomware
      const loggedUserSoftwares = loggedUser.models[device].softwares.filter((s: any) => s.name === "ransomware");
      loggedUserMalware = loggedUserSoftwares[0];

      if (loggedUserMalware && !["logout", "shutdown", "transfer"].includes(commandName)) {
        return {
          error: `Your data have been encrypted by ${loggedUserMalware.hacker}. Can't perform any action other than transfer. Do not logout.`,
        };
      }
    }

    // Check if the values are provided
    if (requirements.includes("username")) {
      if (!username) return { error: ERRORS.PROVIDE_USERNAME };

      user = await db.collection("users").findOne({ username: username });

      if (!user) return { error: ERRORS.USER_NOT_FOUND };
    }

    if (requirements.includes("receiver")) {
      if (!receiver) return { error: ERRORS.PROVIDE_RECEIVER };

      receiverObject = await users.findOne({ username: receiver });

      if (!receiverObject) return { error: ERRORS.USER_NOT_FOUND };
    }

    if (requirements.includes("amount")) {
      if (amount === "0") return { error: ERRORS.ZERO_AMOUNT };

      if (!amount) return { error: ERRORS.PROVIDE_AMOUNT };

      if (!Number(amount)) return { error: ERRORS.INVALID_AMOUNT };

      if (Number(amount) < 1) return { error: ERRORS.NEGATIVE_AMOUNT };
    }

    if (requirements.includes("link")) {
      if (!link) return { error: ERRORS.PROVIDE_LINK };

      if (link.length < 32) return { error: ERRORS.INVALID_LINK };

      websiteLink = link.slice(31); // Removes "https://hack-a-byte.vercel.app/"

      website = await websites.findOne({ _id: new ObjectId(websiteLink) });
      if (!website?._id) return { error: ERRORS.INVALID_LINK };
    }

    if (requirements.includes("softwareId")) {
      softwareObject = await softwares.findOne({ _id: new ObjectId(softwareId) });
      if (!softwareObject?._id) return { error: ERRORS.INVALID_SOFTWARE_ID };
    }

    if (requirements.includes("software")) {
      if (!software) return { error: ERRORS.PROVIDE_SOFTWARE_NAME };

      softwareData = SOFTWARES[software as keyof typeof SOFTWARES];
      if (!softwareData) return { error: ERRORS.INVALID_SOFTWARE };
    }

    // Commands
    switch (commandName) {
      case "login":
        if (!user.models[device]) return { error: ERRORS.USER_NOT_FOUND };

        const userPassword = user.models[device].password;

        if (!["-", "none"].includes(userPassword)) {
          if (!password) return { requirePassword: true };

          if (userPassword !== password) return { error: ERRORS.INVALID_CREDENTIALS };
        }

        const userSoftwares = user.models[device].softwares;
        const userMalware = userSoftwares[0];

        if (userMalware) {
          switch (userMalware.name) {
            case "virus":
              if (userMalware.installedOn < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
                if (user.balance < 5000) {
                  await users.updateOne(user, {
                    $pull: { "models.Hackbook-L.softwares": userMalware } as any,
                  });
                } else {
                  if (!confirm)
                    return {
                      confirm: "repair",
                    };

                  session = client.startSession();

                  try {
                    await session.withTransaction(async () => {
                      await users.updateOne(
                        user,
                        {
                          $pull: { "models.Hackbook-L.softwares": userMalware } as any,
                          $inc: { balance: -5000 },
                        },
                        { session }
                      );
                      await transactions.insertOne(
                        {
                          from: user.username,
                          to: "hack-a-byte",
                          amount: 5000,
                          date: new Date(),
                        },
                        { session }
                      );
                    });
                  } catch (error) {
                    console.error(error);

                    throw error;
                  } finally {
                    session.endSession();
                  }
                }
              }
              break;
            case "spyware":
              if (userMalware.installedOn < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
                if (user.balance > 0) {
                  session = client.startSession();
                  try {
                    await session.withTransaction(async () => {
                      await users.updateOne(
                        user,
                        {
                          $pull: { "models.Hackbook-L.softwares": userMalware } as any,
                          $inc: { balance: -user.balance },
                        },
                        { session }
                      );
                      await users.updateOne(
                        { username: userMalware.hacker },
                        {
                          $inc: { balance: user.balance },
                        },
                        { session }
                      );

                      await transactions.insertMany(
                        [
                          {
                            from: user.username,
                            to: "hack-a-byte",
                            amount: user.balance,
                            date: new Date(),
                          },
                          {
                            from: "hack-a-byte",
                            to: userMalware.hacker,
                            amount: user.balance,
                            date: new Date(),
                          },
                        ],
                        { session }
                      );
                    });
                  } catch (error) {
                    console.error(error);

                    throw error;
                  } finally {
                    session.endSession();
                  }

                  return {
                    data: `A spyware cracked your device. You lost all your money. $${user.balance}`,
                  };
                } else {
                  await users.updateOne(
                    user,
                    {
                      $pull: { "models.Hackbook-L.softwares": userMalware } as any,
                    },
                    { session }
                  );
                }
              }
              break;
            case "ransomware":
              if (userMalware.installedOn < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) {
                await users.updateOne(user, {
                  $pull: { "models.Hackbook-L.softwares": userMalware } as any,
                });
              } else {
                return {
                  error: `Your data have been encrypted by ${userMalware.hacker}. Login after ${new Date(
                    userMalware.installedOn.getTime() + 2 * 24 * 60 * 60 * 1000
                  )}`,
                };
              }

            default:
              break;
          }
        }

        const usertoken = jwt.sign(
          {
            user: {
              id: user._id,
            },
          },
          process.env.JWT_SECRET + device
        );

        cookies().set(device + "-token", usertoken);

        return {
          data: `Welcome ${username}`,
          username: username,
        };
      case "hunt":
        const randomUser = await users
          .aggregate([{ $addFields: { randomField: { $rand: {} } } }, { $sort: { randomField: 1 } }, { $limit: 1 }])
          .toArray();

        if (!randomUser[0]) return { error: ERRORS.NO_USER_FOUND };

        const randomUsername = randomUser[0].username;

        return { data: randomUsername };
      case "leaderboard":
        const topUsers = await users
          .find({})
          .project({ _id: 0, username: 1, balance: 1 })
          .sort({ balance: -1 })
          .limit(10)
          .toArray();

        if (!topUsers[0]) return { error: ERRORS.NO_USER_FOUND };

        return { data: JSON.stringify(topUsers) };
      case "passwd":
        await db.collection("users").updateOne(loggedUser, { $set: { "models.Hackbook-L.password": password } });

        return {
          data: "Your password is changed successfully",
        };
      case "balance":
        return { data: " - $" + loggedUser.balance.toString() };
      case "storage":
        return { data: loggedUser.models[device].storage };
      case "transactions":
        const loggedUserTransactions = await transactions
          .find({ $or: [{ from: storedUsername }, { to: storedUsername }] })
          .sort({ date: -1 })
          .limit(10)
          .toArray();

        if (!loggedUserTransactions[0]) return { error: ERRORS.NO_TRANSACTIONS_FOUND };

        return { data: JSON.stringify({ data: loggedUserTransactions, username: username }) };
      case "browse":
        if (!data.flags) {
          const websitesList = await websites
            .aggregate([{ $match: { owner: { $ne: username } } }, { $sample: { size: 10 } }])
            .toArray();

          if (!websitesList[0]) return { error: ERRORS.NO_WEBSITES_FOUND };

          return { data: JSON.stringify(websitesList) };
        }

        switch (data.flags) {
          case "-o":
            const loggedUserwebsites = await websites.find({ owner: storedUsername }).toArray();

            if (!loggedUserwebsites[0]) return { error: ERRORS.NO_WEBSITES_FOUND };

            return { data: JSON.stringify(loggedUserwebsites) };
          default:
            break;
        }

        return { error: ERRORS.INVALID_FLAG };
      case "email":
        if (username === "hack-a-byte") return { error: "Can't use hack-a-byte username" };

        // if email was already sent by the user once return error
        const isEmailed = await emails.findOne({ sender: storedUsername, receiver: receiver });
        if (isEmailed) {
          return {
            error: ERRORS.EMAIL_ALREADY_SENT,
          };
        }

        const emailsResponse = await emails.insertOne({
          sender: storedUsername,
          receiver: receiver,
          username: sender,
          link: websiteLink,
        });

        if (!emailsResponse) return { error: ERRORS.SERVER_ERROR };

        return { data: "Sent Successfully!" };
      case "inbox":
        const loggedUserInboxEmails = await db.collection("emails").find({ receiver: storedUsername }).toArray();

        if (!loggedUserInboxEmails[0]) return { error: ERRORS.NO_EMAILS_FOUND };

        db.collection("emails").deleteMany({ receiver: storedUsername });

        return { data: JSON.stringify(loggedUserInboxEmails) };
      case "outbox":
        const loggedUserOutboxEmails = await emails.find({ sender: storedUsername }).toArray();

        if (!loggedUserOutboxEmails[0]) return { error: ERRORS.NO_EMAILS_FOUND };

        return { data: JSON.stringify(loggedUserOutboxEmails) };
      case "transfer":
        if (loggedUser.balance < Number(amount)) return { error: ERRORS.INSUFFICIENT_BALANCE };

        if (loggedUserMalware) {
          if (receiver !== loggedUserMalware.hacker) {
            return { error: "You can't transfer your money to anyone other than the hacker" };
          }

          if (Number(amount) < loggedUserMalware.demand) {
            return { error: "Less amount than asked by the hacker" };
          }
        }

        session = client.startSession();

        try {
          await session.withTransaction(async () => {
            await transactions.insertOne(
              {
                _id: newTransactionId,
                from: storedUsername,
                to: receiver,
                amount: Number(amount),
                date: new Date(),
              },
              { session }
            );

            if (loggedUserMalware) {
              await users.findOneAndUpdate(
                loggedUser,
                {
                  $inc: { balance: -Number(amount) },
                  $pull: { "models.Hackbook-L.softwares": loggedUserMalware } as any,
                },
                { session }
              );
            } else {
              await users.findOneAndUpdate(
                loggedUser,
                {
                  $inc: { balance: -Number(amount) },
                },
                { session }
              );
            }

            await users.findOneAndUpdate(
              receiverObject,
              {
                $inc: { balance: Number(amount) },
              },
              { session }
            );
          });
        } catch (error) {
          console.error(error);

          throw error;
        } finally {
          session.endSession();
        }

        return {
          data: { amount: Number(amount), receiver: receiver, transactionId: newTransactionId },
        };
      case "visit":
        switch (website.type) {
          case "virus":
            session = client.startSession();

            try {
              await users.updateOne(loggedUser, {
                $inc: { "models.Hackbook-L.infected": 1 },
                $push: {
                  "models.Hackbook-L.softwares": { name: "virus", type: "normal", installedOn: new Date() },
                } as any,
              });
              await users.updateOne({ username: website.owner }, { $inc: { balance: 2000 } }, { session });
            } catch (e) {
              console.error(e);

              return { error: ERRORS.SERVER_ERROR };
            } finally {
              session.endSession();
            }

            return {
              data: "Your device has been affected by a virus. Perform a scan to get rid of the virus before 24 hrs.",
            };
          case "reward":
            session = client.startSession();

            try {
              await users.updateOne(loggedUser, { $inc: { balance: 100 } }, { session });
              await transactions.insertOne(
                {
                  from: website.owner,
                  to: storedUsername,
                  amount: 100,
                  date: new Date(),
                },
                { session }
              );
              await websites.deleteOne(website);
            } catch (e) {
              console.error(e);

              return { error: ERRORS.SERVER_ERROR };
            } finally {
              session.endSession();
            }
            return { data: "Congratulations!! You won $100" };
          default:
            break;
        }
        return { data: `Welcome to ${website.owner}'s web page` };
      case "ham":
        if (loggedUser.balance < softwareData.cost) return { error: ERRORS.INSUFFICIENT_BALANCE };

        session = client.startSession();

        try {
          await session.withTransaction(async () => {
            softwares.insertOne(
              {
                _id: newSoftwareId,
                owner: username,
                type: software,
              },
              { session }
            );

            await users.updateOne(loggedUser, { $inc: { balance: -softwareData.cost } }, { session });

            await transactions.insertOne(
              {
                from: storedUsername,
                to: "hack-a-byte",
                amount: softwareData.cost,
                date: new Date(),
              },
              { session }
            );
          });
        } catch (error) {
          console.error(error);

          throw error;
        } finally {
          session.endSession();
        }

        return { data: "Your Software id is " + newSoftwareId.toJSON() };
      case "hint":
        if (loggedUser.balance < 10) return { error: ERRORS.INSUFFICIENT_BALANCE };

        session = client.startSession();

        try {
          await transactions.insertOne(
            {
              from: storedUsername,
              to: "hack-a-byte",
              amount: 10,
              date: new Date(),
            },
            { session }
          );

          await users.updateOne(loggedUser, { $inc: { balance: -10 } }, { session });
        } catch (error) {
          console.error(error);

          throw error;
        } finally {
          session.endSession();
        }

        const hint = getHint(user?.models[device].password);

        return { data: hint };
      case "deploy":
        if (website?.owner !== storedUsername) return { error: ERRORS.NOT_YOUR_WEBSITE };

        let deploySettings = {};
        if (softwareObject.type === "ransomware") {
          if (!amount) return { requireAmount: true };

          deploySettings = { type: softwareObject.type, demand: Number(amount) };
        } else {
          deploySettings = { type: softwareObject?.type };
        }

        session = client.startSession();

        try {
          await session.withTransaction(async () => {
            await websites.updateOne(
              website,
              {
                $set: deploySettings,
              },
              { session }
            );
            await softwares.deleteOne(software, { session });
          });
        } catch (error) {
          console.error(error);

          throw error;
        } finally {
          session.endSession();
        }

        return { data: "Deployed Successfully!" };
      case "help":
        return {
          data: COMMANDS[command as keyof typeof COMMANDS]
            ? COMMANDS[command as keyof typeof COMMANDS].info
            : "Unknown Command",
        };
      case "shutdown":
        return { shutdown: true };
      case "logout":
        return { logout: true };
      case "hack":
        if (website.owner === storedUsername) return { error: "You can't hack your own website!" };

        switch (website.type) {
          case "normal":
            await websites.updateOne(website, { $set: { owner: storedUsername } });
            return { success: "The website have been hacked" };
          case "virus":
            session = client.startSession();

            try {
              await users.updateOne(loggedUser, {
                $inc: { "models.Hackbook-L.infected": 1 },
                $push: {
                  "models.Hackbook-L.softwares": { name: "virus", type: "normal", installedOn: new Date() },
                } as any,
              });
            } catch (e) {
              console.error(e);

              return { error: ERRORS.SERVER_ERROR };
            } finally {
              session.endSession();
            }

            return {
              data: "Your device has been affected by a virus. Perform a scan to get rid of the virus before 24 hrs.",
            };
          case "ransomware":
            await users.updateOne(loggedUser, {
              $inc: { "models.Hackbook-L.infected": 1 },
              $push: {
                "models.Hackbook-L.softwares": {
                  name: "ransomware",
                  type: "normal",
                  installedOn: new Date(),
                  demand: website.demand,
                  hacker: website.owner,
                },
              } as any,
            });

            return {
              data: `Your data have been encrypted by ${website.owner} and the ask is $${website.demand} to decrypt it. \n Do not logout or close the tab.`,
            };
          case "spyware":
            session = client.startSession();

            try {
              await users.updateOne(loggedUser, {
                $inc: { "models.Hackbook-L.infected": 1, "models.Hackbook-L.storage.used": 1 * 1024 * 1024 },
                $push: {
                  "models.Hackbook-L.softwares": {
                    type: "normal",
                    installedOn: new Date(),
                    name: "spyware",
                    hacker: website.owner,
                  },
                } as any,
              });
              await websites.updateOne(website, { $set: { owner: storedUsername, type: "normal" } });
            } catch (e) {
              console.error(e);

              return { error: ERRORS.SERVER_ERROR };
            } finally {
              session.endSession();
            }

            return { data: "The website have been hacked" };
          case "reward":
            const randomAmount = Math.floor(Math.random() * (1000 - 100 + 1) + 100);

            session = client.startSession();

            try {
              await users.updateOne(loggedUser, { $inc: { balance: randomAmount } });
              await transactions.insertOne({
                from: website.owner,
                to: storedUsername,
                amount: randomAmount,
                date: new Date(),
              });
              await websites.deleteOne(website);
            } catch (e) {
              console.error(e);

              return { error: ERRORS.SERVER_ERROR };
            } finally {
              session.endSession();
            }

            return { data: `You have received $${randomAmount}!` };

          default:
            break;
        }

        return { error: `Can't Hack ${website.owner}'s website!` };
      case "scan":
        const loggedUsersoftwares = loggedUser.models[device].softwares.filter((s: any) => s.name !== "ransomware");

        const malware = loggedUsersoftwares[0];

        if (!malware) {
          return { data: "No malware detected!" };
        }

        const containsVirus = malware.name === "virus";
        const containsSpyware = malware.name === "spyware";

        if (containsVirus && !confirm)
          return {
            confirm: "virusDetected",
          };
        else if (containsSpyware && !confirm)
          return {
            confirm: "spywareDetected",
          };

        session = client.startSession();

        try {
          if (containsVirus) {
            await users.updateOne(
              loggedUser,
              {
                $pull: { "models.Hackbook-L.softwares": { type: "normal", name: "virus" } } as any,
                $inc: { balance: -2000 },
              },
              { session }
            );
            await transactions.insertOne(
              {
                from: storedUsername,
                to: "hack-a-byte",
                amount: 2000,
                date: new Date(),
              },
              { session }
            );
          } else if (containsSpyware) {
            await users.updateOne(
              loggedUser,
              {
                $pull: { "models.Hackbook-L.softwares": { type: "normal", name: "spyware" } } as any,
                $inc: { balance: -100 },
              },
              { session }
            );
            await transactions.insertOne(
              {
                from: storedUsername,
                to: "hack-a-byte",
                amount: 100,
                date: new Date(),
              },
              { session }
            );
          }
        } catch (e) {
          console.error(e);

          return { error: ERRORS.SERVER_ERROR };
        } finally {
          session.endSession();
        }

        return { data: "The malware have been Removed." };

      default:
        break;
    }

    return { data: "-" };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function logout() {
  await signOut();
}

export async function signUp(email: string) {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    // checking if user with same email already exists
    const emailInUse = await db.collection("users").findOne({ email: email });
    if (emailInUse) return "Email is already registered";

    // Select a random username
    let username = generateFromEmail(email, 5);

    // Check if the username is already taken
    const user = await db.collection("users").findOne({ username: username });

    if (user) username = username + Date.now().toString(16);

    const models = {
      "Hackbook-L": {
        password: "-",
        storage: {
          used: 1 * 1024 * 1024,
          system: 1 * 1024 * 1024,
          total: 10 * 1024 * 1024,
        },
        softwares: [],
        infected: 0,
      },
    };

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        await db.collection("users").insertOne({
          username: username,
          email: email,
          balance: 200,
          models: models,
        });

        await db.collection("websites").insertOne({
          owner: username,
          type: "normal",
        });
      });
    } catch (error) {
      console.error(error);
      return "Something went wrong.";
    } finally {
      session.endSession();
    }

    return models;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    } else if (error instanceof z.ZodError) {
      return error.errors[0].message;
    }

    return "Server Error";
  }
}

export async function getModels() {
  try {
    const session = await auth();

    if (!session?.user) return "You are not logged in";

    const client = await clientPromise;

    const db = client.db(DATABASE_NAME);

    const user = await db.collection("users").findOne({ email: session.user.email });

    if (!user) {
      return await signUp(session.user.email as string);
    }

    return user?.models;
  } catch (error) {
    return "Something went wrong.";
  }
}

export async function setUp(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user) return "You are not logged in";

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const user = await db.collection("users").findOne({ email: session.user.email });

    if (!user) return "User does not exists";

    if (!user.models["Hackbook-L"]) return "You do not own Hackbook-L";

    const passwordLess = formData.get("password-less");

    const password = passwordLess ? "none" : (formData.get("password") as string);

    if (password.length < 4) return "Password should contain atleast 4 characters";

    if (password !== "none" && Number.isNaN(Number(password))) return "Password should be a number";

    await db.collection("users").updateOne(user, {
      $set: { "models.Hackbook-L.password": password, username: formData.get("username") },
    });

    revalidatePath("/devices/hackbook-L");
  } catch (error) {
    return "Something went wrong.";
  }
}

export async function sendDailyEmails() {
  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const users = db.collection("users");
  const emails = db.collection("emails");

  const usersList = await users.find({}).toArray();

  for (const user of usersList) {
    const website = await db
      .collection("websites")
      .insertOne({ owner: "hack-a-byte", type: "reward", expiresAfter: new Date(Date.now() + 24 * 60 * 60 * 1000) });

    await emails.insertOne({
      sender: "hack-a-byte",
      receiver: user.username,
      username: "hack-a-byte",
      link: `https://hack-a-byte.vercel.app/${website.insertedId}`,
    });
  }

  console.log("Emails sent successfully");

  return;
}

export async function handleGithub() {
  await signIn("github");
}

export async function handleGoogle() {
  await signIn("google");
}

export async function getUsername() {
  const session = await auth();

  if (!session?.user) return "You are not logged in";

  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);

  const user = await db.collection("users").findOne({ email: session.user.email });

  if (!user) {
    return "";
  }

  return user.username;
}
