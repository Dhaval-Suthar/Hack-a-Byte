"use server";

import clientPromise from "../lib/mongodb";
import { ObjectId } from "mongodb";
import { DefaultValues, Errors, Models, Success } from "./constants";
import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { convertToMegaBytes, getHint } from "./utils";
import { COMMANDS } from "./commands";
import { generateFromEmail } from "unique-username-generator";
import { ProcessState, Software } from "./definitions";
import { SOFTWARES } from "./softwares";
import { redirect } from "next/navigation";

// Common functions
const getSessionUser = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
};

const getDatabase = async () => {
  const client = await clientPromise;
  return client.db(process.env.DATABASE_NAME);
};

const setActiveDevice = async (device: string) => {
  cookies().set("activeDevice", device);
};

// Main functions
export async function execute(prevState: ProcessState, formData: FormData) {
  try {
    // Get the command and arguments from the form data
    const command = (formData.get("command") as string) || prevState.command || "";
    const password = formData.get("password") as string;
    const amount = formData.get("amount") as string;
    const confirmation = formData.get("confirmation") as string;

    // Variables
    const commandParts = command.split(" ");
    const device = commandParts[0].split("@")[1];
    const commandName = commandParts[3]; // As the first three parts are "0.0.0.0@HackBook-L ~ % "
    const returnState = new ProcessState({ command: command }).toPlainObject() as ProcessState;
    const argumentsPassed = commandParts.slice(4);

    setActiveDevice(device);

    if (commandName === "") {
      returnState.message = "";
      return returnState;
    }

    // Check for invalid commandName
    const commandData = COMMANDS[commandName as keyof typeof COMMANDS];
    if (!commandData) {
      returnState.error = Errors.INVALID_COMMAND;
      return returnState;
    }

    // Database and collections
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);
    const users = db.collection("users");
    const transactions = db.collection("transactions");
    const websites = db.collection("websites");
    const softwares = db.collection("softwares");
    const emails = db.collection("emails");
    const authSession = await auth();

    // Default values
    let websiteLink = process.env.SITE_URL || "http://localhost:3000/";
    let website: any;
    let softwareData: any;
    let software: any;
    let user: any;
    let loggedUser: any;
    let loggedUserMalware: any = null;
    let session: any;
    const newTransactionId = new ObjectId();
    const newSoftwareId = new ObjectId();
    let argumentData: { [key: string]: any } = {};

    // Check for args
    await Promise.all(
      commandData.args.map(async (arg, index) => {
        const argValue = argumentsPassed[index];
        if (arg.required && !argValue) {
          returnState.error = `Usage: ${commandData.usage}`;
          return;
        }

        switch (arg.type) {
          case "number":
            if (argValue && isNaN(Number(argValue))) {
              returnState.error = Errors.INVALID_AMOUNT;
              return;
            } else if (Number(argValue) < 0) {
              returnState.error = Errors.NEGATIVE_AMOUNT;
              return;
            } else if (Number(argValue) === 0) {
              returnState.error = Errors.ZERO_AMOUNT;
              return;
            }
            break;

          case "url":
            if (argValue && !argValue.startsWith(websiteLink)) {
              returnState.error = Errors.INVALID_LINK;
              return;
            }

            website = await websites.findOne({ _id: new ObjectId(argValue.slice(websiteLink.length)) });

            if (!website) {
              returnState.error = Errors.INVALID_LINK;
              return;
            }
            break;

          case "user":
            user = await users.findOne({ username: argValue });

            if (!user) {
              returnState.error = Errors.USER_NOT_FOUND;
              return returnState;
            }
            break;

          case "software":
            softwareData = SOFTWARES[argValue as keyof typeof SOFTWARES];

            const softwareList = Object.values(SOFTWARES);

            if (!softwareData) {
              returnState.error =
                "List of Softwares\n - " +
                softwareList
                  .map((software) => {
                    return software.name + ": " + software.desc;
                  })
                  .join("\n - ");
              return;
            }

            break;

          case "softwareId":
            software = await softwares.findOne({ _id: new ObjectId(argValue) });

            if (!software) {
              returnState.error = Errors.SOFTWARE_NOT_FOUND;
              return;
            }

            break;

          case "command":
            if (!COMMANDS[argValue as keyof typeof COMMANDS]) {
              returnState.error = Errors.COMMAND_NOT_FOUND;
              return;
            }

            break;

          case "function":
            if (argValue !== arg.name) {
              returnState.error = `Usage: ${commandData.usage}`;
              return;
            }

            break;

          default:
            break;
        }

        argumentData[arg.name] = argValue;
      })
    );

    if (returnState.error) return returnState;

    if (commandData.requiresLogin) {
      // Get the token from the cookies
      const sessionToken = cookies().get(device + "-token")?.value;

      // Check if the token is present
      if (!sessionToken) {
        returnState.error = Errors.LOGIN_REQUIRED;
        return returnState;
      }

      // Verify the token
      const verifiedtoken = jwt.verify(sessionToken, process.env.JWT_SECRET + device) as jwt.JwtPayload;

      // Check the credentials of the logged in user
      if (!verifiedtoken.user.id) {
        returnState.error = Errors.INVALID_LOGIN;
        return returnState;
      }

      loggedUser = await users.findOne({ _id: new ObjectId(verifiedtoken.user.id as string) });

      if (!loggedUser) {
        returnState.error = Errors.INVALID_LOGIN;
        return returnState;
      }

      // Check if the owner owns the device
      if (!loggedUser.models[device]) {
        returnState.error = Errors.DEVICE_NOT_OWNED;
        return returnState;
      }
    }

    if (commandData.requiresLogin || commandName === "login") {
      if (commandName === "login") {
        if (!user.models[device]) {
          returnState.error = Errors.DEVICE_NOT_OWNED_BY_USER;
          return returnState;
        }

        const userPassword = user.models[device].password;

        if (!["-", "none"].includes(userPassword)) {
          if (!password) {
            returnState.requires = "password";
            return returnState;
          }

          if (userPassword !== password) {
            returnState.error = Errors.INVALID_CREDENTIALS;
            return returnState;
          }
        }

        loggedUser = user;
      }

      await Promise.all(
        loggedUser.models[device].malwares.map(async (malware: Software) => {
          loggedUserMalware = malware;

          switch (malware.type) {
            case "ransomware":
              if (commandName === "login") {
                if (Date.now() - loggedUserMalware.installationDate.getTime() > 2 * 24 * 60 * 60 * 1000) {
                  await users.updateOne(user, {
                    $pull: { "models.Hackbook-L.malwares": loggedUserMalware } as any,
                  });
                } else {
                  returnState.error = `Your data have been encrypted by ${malware.owner}. Login after ${new Date(
                    loggedUserMalware.installationDate.getTime() + 2 * 24 * 60 * 60 * 1000
                  )}`;
                }
                return;
              } else if (!["logout", "shutdown", "transfer"].includes(commandName)) {
                returnState.error = `Your data have been encrypted by ${malware.owner}. Can't perform any action other than transfer. Warning: Do not logout or shutdown.`;
                return;
              }
              break;

            case "virus":
              if (Date.now() - loggedUserMalware.installationDate.getTime() > 24 * 60 * 60 * 1000) {
                await users.updateOne(user, {
                  $unset: { "models.Hackbook-L": null },
                });

                await users.updateOne(
                  { username: malware.owner },
                  {
                    $inc: { balance: 5000 },
                  }
                );

                returnState.error = `Your device has been affected by a virus. Buy a new device.`;
                return;
              }
              break;

            case "spyware":
              if (Date.now() - loggedUserMalware.installationDate.getTime() > 7 * 24 * 60 * 60 * 1000) {
                session = client.startSession();
                try {
                  await session.withTransaction(async () => {
                    if (loggedUser.balance > 0) {
                      await users.updateOne(
                        loggedUser,
                        {
                          $pull: { "models.Hackbook-L.malwares": loggedUserMalware } as any,
                          $inc: { "models.Hackbook-L.storage.used": -1 * 1024 * 1024, balance: -loggedUser.balance },
                        },
                        { session }
                      );

                      await users.updateOne(
                        { username: loggedUserMalware.owner },
                        {
                          $inc: { balance: loggedUser.balance },
                        },
                        { session }
                      );

                      await transactions.insertMany(
                        [
                          {
                            from: loggedUser.username,
                            to: "hack-a-byte",
                            amount: loggedUser.balance,
                            date: new Date(),
                          },
                          {
                            from: "hack-a-byte",
                            to: loggedUserMalware.owner,
                            amount: loggedUser.balance,
                            date: new Date(),
                          },
                        ],
                        { session }
                      );
                    } else {
                      await users.updateOne(
                        loggedUser,
                        {
                          $pull: { "models.Hackbook-L.malwares": loggedUserMalware } as any,
                        },
                        { session }
                      );
                    }
                  });
                } catch (error) {
                  console.error(error);

                  throw error;
                } finally {
                  session.endSession();
                }

                returnState.error = `Your device has been affected by spyware. Your data have been sent to ${loggedUserMalware.owner}.`;
                return;
              }
              break;

            default:
              break;
          }
        })
      );

      if (returnState.error) return returnState;
    }

    if (confirmation && confirmation !== "y") {
      returnState.error = Errors.PROCESS_CANCELLED;
      return returnState;
    }

    if (password) {
      // Check if the password contains only digits
      if (!/^\d+$/.test(password)) {
        returnState.error = Errors.PASSWORD_SHOULD_BE_ONLY_DIGITS;
        return returnState;
      }

      if (password.length !== 4) {
        returnState.error = Errors.PASSWORD_SHOULD_BE_4_DIGITS;
        return returnState;
      }
    }

    // Commands
    switch (commandName) {
      case "login":
        const usertoken = jwt.sign(
          {
            user: {
              id: user._id,
            },
          },
          process.env.JWT_SECRET + device
        );

        cookies().set(device + "-token", usertoken);

        returnState.newlogin = { username: user.username };
        returnState.message = Success.LOGGED_IN;
        return returnState;

      case "hunt":
        const randomUser = await users
          .aggregate([{ $addFields: { randomField: { $rand: {} } } }, { $sort: { randomField: 1 } }, { $limit: 1 }])
          .project({ _id: 0, username: 1 })
          .toArray();

        if (randomUser.length === 0) {
          returnState.error = Errors.NO_USERS_FOUND;
          return returnState;
        }

        returnState.message = ` --> ${randomUser[0].username}`;
        return returnState;

      case "leaderboard":
        const topUsers = await users
          .find({})
          .project({ _id: 0, username: 1, balance: 1 })
          .sort({ balance: -1 })
          .limit(10)
          .toArray();

        if (topUsers.length === 0) {
          returnState.error = Errors.NO_USERS_FOUND;
          return returnState;
        }

        returnState.message = topUsers
          .map((user, index) => `${index + 1}. ${user.username} - ₹${user.balance}`)
          .join("\n");

        return returnState;

      case "passwd":
        switch (prevState.requires) {
          case "old password":
            if (password !== loggedUser.models[device].password) {
              returnState.error = Errors.PASSWORD_INCORRECT;
            } else {
              returnState.data.password = password;
              returnState.requires = "new password";
            }
            return returnState;

          case "new password":
            returnState.data.password = password;
            returnState.requires = "confirm password";
            return returnState;

          case "confirm password":
            if (password !== prevState.data.password) {
              returnState.error = Errors.PASSWORDS_DO_NOT_MATCH;
              return returnState;
            }
            break;

          default:
            if (["none", "-"].includes(loggedUser.models[device].password)) {
              returnState.data.password = password;
              returnState.requires = "new password";
              return returnState;
            }
            returnState.requires = "old password";
            return returnState;
        }

        if (!authSession?.user) {
          returnState.error = Errors.LOGIN_REQUIRED;
          return returnState;
        }

        if (authSession.user.email !== loggedUser.email) {
          returnState.error = Errors.NOT_ALLOWED;
          return returnState;
        }

        if (device === Models.L) {
          await db.collection("users").updateOne(loggedUser, { $set: { "models.Hackbook-L.password": password } });
        } else {
          await db.collection("users").updateOne(loggedUser, { $set: { "models.Hackbook-W95.password": password } });
        }

        returnState.message = Success.PASSWORD_CHANGED;
        return returnState;

      case "balance":
        returnState.message = `Your balance is ₹${loggedUser.balance}`;
        return returnState;

      case "storage":
        const storageData = loggedUser.models[device].storage;

        const totalSpace = storageData.total;
        const usedSpace = storageData.used;
        const systemSpace = storageData.system;
        const freeSpace = storageData.total - usedSpace;

        returnState.message = ` Total Space: ${convertToMegaBytes(totalSpace).toFixed(2)} MB\n
                 Used Space: ${convertToMegaBytes(usedSpace).toFixed(2)} MB\n
                 System Space: ${convertToMegaBytes(systemSpace).toFixed(2)} MB\n
                 Free Space: ${convertToMegaBytes(freeSpace).toFixed(2)} MB`;

        return returnState;

      case "transactions":
        const loggedUserTransactions = await transactions
          .find({ $or: [{ from: loggedUser.username }, { to: loggedUser.username }] })
          .sort({ date: -1 })
          .limit(10)
          .toArray();

        if (loggedUserTransactions.length === 0) {
          returnState.error = Errors.NO_TRANSACTIONS_FOUND;
          return returnState;
        }

        returnState.message = loggedUserTransactions
          .map((transaction) => {
            return `[${transaction._id.toString()}] - Transferred ₹${transaction.amount} from ${
              transaction.from === loggedUser.username ? "You" : transaction.from
            } to ${transaction.to === loggedUser.username ? "You" : transaction.to} on ${new Date(
              transaction.date
            ).toDateString()}`;
          })
          .join("\n");

        return returnState;

      case "browse":
        if (!argumentData.flag) {
          const websitesList = await websites
            .aggregate([{ $match: { owner: { $ne: argumentData.username } } }, { $sample: { size: 10 } }])
            .toArray();

          if (websitesList.length === 0) {
            returnState.error = Errors.NO_WEBSITES_FOUND;
            return returnState;
          }

          returnState.message = websitesList
            .map((website, index) => `${index + 1}. ${websiteLink}${website._id.toString()}`)
            .join("\n");

          return returnState;
        }

        switch (argumentData.flag) {
          case "-o":
            const loggedUserwebsites = await websites.find({ owner: loggedUser.username }).toArray();

            if (loggedUserwebsites.length === 0) {
              returnState.error = Errors.NO_WEBSITES_FOUND;
              return returnState;
            }

            returnState.message = loggedUserwebsites
              .map((website, index) => `${index + 1}. ${websiteLink}${website._id.toString()}`)
              .join("\n");
            return returnState;

          default:
            break;
        }

        returnState.error = Errors.INVALID_FLAG;
        return returnState;

      case "email":
        // if email was already sent by the user once return error
        const isEmailed = await emails.findOne({ sender: loggedUser.username, receiver: argumentData.receiver });

        if (isEmailed) {
          returnState.error = Errors.EMAIL_ALREADY_SENT;
          return returnState;
        }

        const emailsResponse = await emails.insertOne({
          sender: loggedUser.username,
          receiver: argumentData.receiver,
          link: argumentData.link,
        });

        if (!emailsResponse) {
          returnState.error = Errors.PROCESS_FAILED;
          return returnState;
        }

        returnState.message = Success.EMAIL_SENT;
        return returnState;

      case "inbox":
        const loggedUserInboxEmails = await db.collection("emails").find({ receiver: loggedUser.username }).toArray();

        if (loggedUserInboxEmails.length === 0) {
          returnState.error = Errors.NO_EMAILS_FOUND;
          return returnState;
        }

        db.collection("emails").deleteMany({ receiver: loggedUser.username });

        returnState.message = loggedUserInboxEmails
          .map((email, index) => {
            return `${index + 1}. Email from ${email.sender} with link: ${email.link}`;
          })
          .join("\n");

        return returnState;

      case "outbox":
        const loggedUserOutboxEmails = await emails.find({ sender: loggedUser.username }).toArray();

        if (loggedUserOutboxEmails.length === 0) {
          returnState.error = Errors.NO_EMAILS_FOUND;
          return returnState;
        }

        returnState.message = loggedUserOutboxEmails
          .map((email, index) => {
            return `${index + 1}. Email to ${email.receiver} with link: ${email.link}`;
          })
          .join("\n");

        return returnState;

      case "transfer":
        if (argumentData.receiver === loggedUser.username) {
          returnState.error = Errors.CANNOT_TRANSFER_TO_YOURSELF;
          return returnState;
        }
        if (loggedUser.balance < Number(argumentData.amount)) {
          returnState.error = Errors.INSUFFICIENT_BALANCE;
          return returnState;
        }

        if (loggedUserMalware && loggedUserMalware.type === "ransomware") {
          if (argumentData.receiver !== loggedUserMalware.owner) {
            returnState.error = "Can't transfer to other than the hacker";
            return returnState;
          }

          if (Number(argumentData.amount) < loggedUserMalware.ask) {
            returnState.error = `Ask amount is ₹${loggedUserMalware.ask}`;
            return returnState;
          }
        }

        if (!confirmation) {
          returnState.requires = "confirmation";
          return returnState;
        }

        session = client.startSession();

        try {
          await session.withTransaction(async () => {
            await transactions.insertOne(
              {
                _id: newTransactionId,
                from: loggedUser.username,
                to: argumentData.receiver,
                amount: Number(argumentData.amount),
                date: new Date(),
              },
              { session }
            );

            if (loggedUserMalware) {
              await users.findOneAndUpdate(
                loggedUser,
                {
                  $inc: { balance: -Number(argumentData.amount) },
                  $pull: { "models.Hackbook-L.malwares": loggedUserMalware } as any,
                },
                { session }
              );
            } else {
              await users.findOneAndUpdate(
                loggedUser,
                {
                  $inc: { balance: -Number(argumentData.amount) },
                },
                { session }
              );
            }

            await users.findOneAndUpdate(
              user,
              {
                $inc: { balance: Number(argumentData.amount) },
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

        returnState.message = `- ₹${argumentData.amount} is Successfully transferred to ${
          argumentData.receiver
        } \ntransaction code: ${newTransactionId.toString()}`;

        return returnState;

      case "visit":
        if (website.malware && website.malware.type === "virus") {
          website.malware.installationDate = new Date();

          const infectedField =
            device === Models.L ? { "models.Hackbook-L.infected": 1 } : { "models.Hackbook-W95.infected": 1 };
          const malwareField =
            device === Models.L
              ? { "models.Hackbook-L.malwares": website.malware }
              : { "models.Hackbook-W95.malwares": website.malware };

          session = client.startSession();

          try {
            await users.updateOne(
              loggedUser,
              {
                $inc: infectedField,
                $push: malwareField,
              },
              { session }
            );
            await users.updateOne({ username: website.owner }, { $inc: { balance: 7000 } }, { session });
            await transactions.insertOne(
              {
                from: "hack-a-byte",
                to: website.owner,
                amount: 7000,
                date: new Date(),
              },
              { session }
            );

            await websites.updateOne(
              { _id: website._id },
              {
                $set: { malware: null },
              },
              { session }
            );
          } catch (e) {
            console.error(e);

            returnState.error = Errors.SERVER_ERROR;
            return returnState;
          } finally {
            session.endSession();
          }

          returnState.message =
            "Your device has been affected by a virus. Perform a scan to get rid of the virus before 24 hrs.";
          return returnState;
        }

        if (website.software && website.software.type === "reward") {
          session = client.startSession();

          try {
            await users.updateOne(loggedUser, { $inc: { balance: website.software.cost } }, { session });
            await transactions.insertOne(
              {
                from: website.owner,
                to: loggedUser.username,
                amount: website.software.cost,
                date: new Date(),
              },
              { session }
            );
            await websites.deleteOne(website);
          } catch (e) {
            console.error(e);

            returnState.error = Errors.SERVER_ERROR;
            return returnState;
          } finally {
            session.endSession();
          }

          returnState.message = `You have received ₹${website.software.cost}!`;
          return returnState;
        }

        returnState.message = `You have visited ${website.owner}'s website`;
        return returnState;

      case "ham":
        if (!confirmation) {
          returnState.requires = "confirmation";
          returnState.message = `That will Cost ₹${softwareData.cost}`;
          return returnState;
        }

        if (loggedUser.balance < softwareData.cost) {
          returnState.error = Errors.INSUFFICIENT_BALANCE;
          return returnState;
        }

        softwareData.owner = loggedUser.username;
        softwareData._id = newSoftwareId;

        session = client.startSession();

        try {
          await session.withTransaction(async () => {
            await softwares.insertOne(softwareData, { session });

            await users.updateOne(loggedUser, { $inc: { balance: -softwareData.cost } }, { session });

            await transactions.insertOne(
              {
                from: loggedUser.username,
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

        returnState.message =
          `Software ${softwareData.name} installed successfully!\n Your Software id is ` + newSoftwareId.toString();
        return returnState;

      case "hint":
        if (!confirmation) {
          returnState.requires = "confirmation";
          returnState.message = "That will Cost ₹10";
          return returnState;
        }

        if (loggedUser.balance < 10) {
          returnState.error = Errors.INSUFFICIENT_BALANCE;
          return returnState;
        }

        session = client.startSession();

        try {
          await transactions.insertOne(
            {
              from: loggedUser.username,
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

        returnState.message = `Hint : ${hint}`;
        return returnState;

      case "deploy":
        if (website?.owner !== loggedUser.username) {
          returnState.error = Errors.NOT_YOUR_WEBSITE;
          return returnState;
        }

        if (software.type === "ransomware") {
          if (!amount) {
            returnState.requires = "amount";
            return returnState;
          }

          software.ask = Number(amount);
        }

        session = client.startSession();

        try {
          await session.withTransaction(async () => {
            await websites.updateOne(
              website,
              {
                $set: { malware: software },
              },
              { session }
            );
            await softwares.deleteOne({ _id: software._id }, { session });
          });
        } catch (error) {
          console.error(error);

          throw error;
        } finally {
          session.endSession();
        }

        returnState.message = Success.DEPLOYED;
        return returnState;

      case "help":
        returnState.message =
          argumentData.command + ": " + COMMANDS[argumentData.command as keyof typeof COMMANDS].desc;
        return returnState;

      case "shutdown":
        returnState.message = "Shutting down...";
        returnState.shutdown = true;
        return returnState;

      case "logout":
        cookies().delete(device + "-token");

        returnState.message = Success.LOGGED_OUT;
        returnState.newlogin = { username: DefaultValues.USERNAME };
        return returnState;

      case "hack":
        if (website.owner === loggedUser.username) {
          returnState.error = Errors.CANT_HACK_YOURSELF;
          return returnState;
        }

        if (website.software) {
          returnState.message = "Can't hack this website";
          return returnState;
        }

        if (website.malware) {
          session = client.startSession();

          website.malware.installationDate = new Date();

          let infectedField = {};
          let malwareField = {};

          if (device === Models.L) {
            malwareField = { "models.Hackbook-L.malwares": website.malware };

            if (website.malware.type === "spyware") {
              infectedField = { "models.Hackbook-L.infected": 1, "models.Hackbook-L.storage.used": 1 * 1024 * 1024 };
            } else {
              infectedField = { "models.Hackbook-L.infected": 1 };
            }
          } else {
            malwareField = { "models.Hackbook-W95.malwares": website.malware };

            if (website.malware.type === "spyware") {
              infectedField = { "models.Hackbook-L.infected": 1, "models.Hackbook-L.storage.used": 1 * 1024 * 1024 };
            } else {
              infectedField = { "models.Hackbook-L.infected": 1 };
            }
          }

          try {
            await users.updateOne(loggedUser, {
              $inc: infectedField,
              $push: malwareField,
            });

            if (website.malware.type === "virus") {
              await users.updateOne(
                { username: website.owner },
                { $inc: { balance: website.malware.cost } },
                { session }
              );
              await transactions.insertOne(
                {
                  from: "hack-a-byte",
                  to: website.owner,
                  amount: website.malware.cost,
                  date: new Date(),
                },
                { session }
              );
            }

            await websites.updateOne(
              { _id: website._id },
              {
                $set: { malware: null },
              },
              { session }
            );
          } catch (e) {
            console.error(e);

            returnState.error = Errors.SERVER_ERROR;
            return returnState;
          } finally {
            session.endSession();
          }

          switch (website.malware.type) {
            case "virus":
              returnState.message =
                "Your device has been affected by a virus. \nPerform a scan to get rid of the virus before 24 hrs.";
              return returnState;
            case "ransomware":
              returnState.message = `Your device has been affected by ransomware. Pay ₹${website.malware.ask} to ${website.owner} to get your data back.`;
              return returnState;

            default:
              break;
          }
        }

        await websites.updateOne({ _id: website._id }, { $set: { owner: loggedUser.username } });
        returnState.message = Success.HACKED;
        return returnState;

      case "scan":
        if (loggedUserMalware === null) {
          returnState.error = "No malware detected";
          return returnState;
        }

        if (!confirmation) {
          returnState.message =
            loggedUserMalware.type + " detected!\nIt will cost ₹" + loggedUserMalware.cost + " to remove it.";
          returnState.requires = "confirmation";
          return returnState;
        }

        if (confirmation !== "y") {
          returnState.error = Errors.PROCESS_CANCELLED;
          return returnState;
        }

        if (loggedUser.balance < loggedUserMalware.cost) {
          returnState.error = Errors.INSUFFICIENT_BALANCE;
          return returnState;
        }

        session = client.startSession();

        try {
          await users.updateOne(
            loggedUser,
            {
              $pull: { "models.Hackbook-L.malwares": loggedUserMalware } as any,
              $inc: { balance: -loggedUserMalware.cost },
            },
            { session }
          );
          await transactions.insertOne(
            {
              from: loggedUser.username,
              to: "hack-a-byte",
              amount: loggedUserMalware.cost,
              date: new Date(),
            },
            { session }
          );
        } catch (e) {
          console.error(e);

          returnState.error = Errors.SERVER_ERROR;
          return returnState;
        } finally {
          session.endSession();
        }

        returnState.message = Success.MALWARE_REMOVED;
        return returnState;

      case "clear":
        returnState.message = "";
        returnState.clear = true;
        return returnState;

      case "chnm":
        if (argumentData.name.length < 5) {
          returnState.error = Errors.USERNAME_SHORT;
          return returnState;
        }

        if (argumentData.name.length > 15) {
          returnState.error = Errors.USERNAME_LONG;
          return returnState;
        }

        if (!authSession?.user) {
          returnState.error = Errors.LOGIN_REQUIRED;
          return returnState;
        }

        if (authSession.user.email !== loggedUser.email) {
          returnState.error = Errors.NOT_ALLOWED;
          return returnState;
        }

        const newUser = await users.findOne({ username: argumentData.name });

        if (newUser) {
          returnState.error = Errors.USERNAME_TAKEN;
          return returnState;
        }

        if (!confirmation) {
          returnState.requires = "confirmation";
          returnState.message = `Changing username to ${argumentData.name}`;
          return returnState;
        }

        session = client.startSession();

        try {
          await session.withTransaction(async () => {
            await users.updateOne(loggedUser, { $set: { username: argumentData.name } }, { session });
            await websites.updateMany(
              { owner: loggedUser.username },
              { $set: { owner: argumentData.name } },
              { session }
            );
            await websites.updateMany(
              { malware: { $elemMatch: { owner: loggedUser.username } } },
              { $set: { "malware.$.owner": argumentData.name } },
              { session }
            );
            await websites.updateMany(
              { software: { $elemMatch: { owner: loggedUser.username } } },
              { $set: { "software.$.owner": argumentData.name } },
              { session }
            );
            await softwares.updateMany(
              { owner: loggedUser.username },
              { $set: { owner: argumentData.name } },
              { session }
            );
            await emails.updateMany(
              { sender: loggedUser.username },
              { $set: { sender: argumentData.name } },
              { session }
            );
            await emails.updateMany(
              { receiver: loggedUser.username },
              { $set: { receiver: argumentData.name } },
              { session }
            );
            await transactions.updateMany(
              { from: loggedUser.username },
              { $set: { from: argumentData.name } },
              { session }
            );
            await transactions.updateMany(
              { to: loggedUser.username },
              { $set: { to: argumentData.name } },
              { session }
            );
          });
        } catch (error) {
          console.error(error);

          returnState.error = Errors.SERVER_ERROR;
          return returnState;
        } finally {
          session.endSession();
        }

        returnState.message = Success.USERNAME_CHANGED;
        returnState.newlogin = { username: argumentData.name };
        return returnState;

      default:
        break;
    }

    returnState.error = Errors.INVALID_COMMAND;
    return returnState;
  } catch (e) {
    console.error(e);

    return new ProcessState({ error: Errors.SERVER_ERROR }).toPlainObject() as ProcessState;
  }
}

export async function logout() {
  cookies().delete("Hackbook-L-token");
  cookies().delete("Hackbook-W95-token");
  await signOut();
}

export async function signUp(email: string) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    // checking if user with same email already exists
    const emailInUse = await db.collection("users").findOne({ email: email });
    if (emailInUse) return "Email is already registered";

    // Select a random username
    let username = generateFromEmail(email, 5);

    // Check if the username is already taken
    const user = await db.collection("users").findOne({ username: username });

    if (user) username = username + Date.now().toString(16);

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        await db.collection("users").insertOne({
          username: username,
          email: email,
          balance: 12000,
          models: {},
        });

        await db.collection("websites").insertOne({
          owner: username,
          malware: null,
          software: null,
        });
      });
    } catch (error) {
      console.error(error);
      return "Something went wrong.";
    } finally {
      session.endSession();
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }

    return "Server Error";
  }
}

export async function getModels() {
  try {
    const session = await auth();

    if (!session?.user) return "You are not logged in";

    const client = await clientPromise;

    const db = client.db(process.env.DATABASE_NAME);

    const user = await db.collection("users").findOne({ email: session.user.email });

    if (!user) {
      await signUp(session.user.email as string);
      return [];
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
    const db = client.db(process.env.DATABASE_NAME);

    const user = await db.collection("users").findOne({ email: session.user.email });

    if (!user) return "User does not exists";

    if (!user.models["Hackbook-L"]) return "You do not own Hackbook-L";

    const passwordLess = formData.get("password-less");

    const password = passwordLess ? "none" : (formData.get("password") as string);

    if (password.length < 4) return "Password should contain atleast 4 characters";

    if (password !== "none" && Number.isNaN(Number(password))) return "Password should be a number";

    let dbSession = client.startSession();

    try {
      await dbSession.withTransaction(async () => {
        await db.collection("users").updateOne(user, {
          $set: { "models.Hackbook-L.password": password, username: formData.get("username") },
        });

        await db
          .collection("websites")
          .updateOne({ owner: user.username }, { $set: { owner: formData.get("username") } });

        await db
          .collection("transactions")
          .updateMany({ from: user.username }, { $set: { from: formData.get("username") } });
        await db
          .collection("transactions")
          .updateMany({ to: user.username }, { $set: { to: formData.get("username") } });
      });
    } catch (error) {
      return "Something went wrong.";
    } finally {
      dbSession.endSession();
    }

    revalidatePath("/devices/hackbook-L");
  } catch (error) {
    return "Something went wrong.";
  }
}

export async function sendDailyEmails() {
  const client = await clientPromise;
  const db = client.db(process.env.DATABASE_NAME);
  const users = db.collection("users");
  const emails = db.collection("emails");

  const website = await db.collection("websites").insertOne({
    owner: "hack-a-byte",
    software: new Software({
      name: "Daily prize",
      desc: "Get 5000 rupees daily",
      type: "reward",
      cost: 5000,
      category: "software",
    }),
    expiresAfter: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const usersList = await users.find({}).toArray();

  let websiteLink = process.env.SITE_URL || "http://localhost:3000/";

  for (const user of usersList) {
    await emails.insertOne({
      sender: "hack-a-byte",
      receiver: user.username,
      username: "hack-a-byte",
      link: websiteLink + website.insertedId,
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
  const db = client.db(process.env.DATABASE_NAME);

  const user = await db.collection("users").findOne({ email: session.user.email });

  if (!user) {
    return "";
  }

  return user.username;
}

export async function haveModel(device: string) {
  const sessionUser = await getSessionUser();
  const db = await getDatabase();

  const user = await db.collection("users").findOne({ email: sessionUser.email }, { projection: { models: 1 } });

  if (!user) {
    return Errors.INVALID_LOGIN;
  }

  if (!user.models[device]) {
    return Errors.DEVICE_NOT_FOUND;
  }

  return Success.FOUND;
}

export async function buyModel(device: string) {
  const sessionUser = await getSessionUser();
  const client = await clientPromise;
  const db = client.db(process.env.DATABASE_NAME);

  const user = await db.collection("users").findOne({ email: sessionUser.email });

  if (!user) {
    return Errors.INVALID_LOGIN;
  }

  if (user.models[device]) {
    return Errors.DEVICE_ALREADY_OWNED;
  }

  let price = 10000;

  switch (device) {
    case Models.L:
      price = 10000;

      break;

    case Models.W95:
      price = 50000;
      break;

    default:
      return Errors.INVALID_DEVICE;
  }

  if (user.balance < price) {
    return Errors.INSUFFICIENT_BALANCE;
  }

  const newDevice = {
    password: "-",
    storage: {
      used: 1 * 1024 * 1024,
      system: 1 * 1024 * 1024,
      total: 10 * 1024 * 1024,
    },
    softwares: [],
    malwares: [],
    infected: 0,
  };

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await db
        .collection("users")
        .updateOne(
          { email: sessionUser.email },
          { $set: { ["models." + device]: newDevice }, $inc: { balance: -price } },
          { session }
        );
      await db.collection("transactions").insertOne({
        from: user.username,
        to: "hack-a-byte",
        amount: price,
        date: new Date(),
      });
    });
  } catch (error) {
    console.error(error);

    return Errors.SERVER_ERROR;
  } finally {
    session.endSession();
  }

  return Success.DEVICE_BOUGHT;
}
