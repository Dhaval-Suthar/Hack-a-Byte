"use server";

import clientPromise from "../lib/mongodb";
import { ObjectId, PushOperator } from "mongodb";
import { DEFAULT_USER_ID, ERRORS } from "./constants";

const SECRET_PASSWORD = "charger";

setInterval(sendDailyMoneyEmail, 24 * 60 * 60 * 1000);

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
    const exists = await db.collection("hackers").findOne({ username: username });
    if (exists) return { error: ERRORS.USER_ALREADY_EXISTS };

    const response = await db.collection("hackers").insertOne({
      username: username,
      password: password,
      balance: 0,
      encrypted: false,
      encryptedBy: "none",
      decryptionMoney: 0,
      spyware: false,
      spywareBy: "none",
      storage: {
        used: 1 * 1024 * 1024,
        system: 1 * 1024 * 1024,
        total: 10 * 1024 * 1024,
      },
      computerModels: ["HackBook-L"],
      lastLogin: new Date(),
    });

    // Add a user website
    db.collection("websites").insertOne({
      owner: username,
      type: "normal",
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

    if (response.encrypted) return { error: "Sorry, your data have been encrypted. Can't access it." };

    return {
      id: response?._id.toJSON(),
      data: JSON.stringify(response),
      lastLogin: response?.lastLogin,
    };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function changePassword(username: string, newPassword: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    // update the password
    const response = await db
      .collection("hackers")
      .updateOne({ username: username }, { $set: { password: newPassword } });
    if (!response) return { error: ERRORS.SOME_ERROR };

    return {
      success: true,
    };
  } catch (e) {
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

    if (sender.encrypted) {
      if (sender.encryptedBy !== receiver.username)
        return { error: "You can't transfer your money to anyone other than the hacker" };
      if (amount < sender.decryptionMoney) return { error: "Less amount than asked by the hacker" };
    }

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
          },
          { session }
        );

        await collection.findOneAndUpdate(
          receiver,
          {
            $inc: { balance: amount },
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    if (sender.encrypted) {
      await db
        .collection("hackers")
        .updateOne(sender, { $set: { encrypted: false, encryptedBy: "none", decryptionMoney: 0 } });
      return { success: `Your data has been decrypted` };
    }

    return { success: `transaction code: ${transactionId}` };
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
        const website = await db.collection("websites").findOne({ _id: new ObjectId(websiteId) });

        const user = await db.collection("hackers").findOne({ _id: new ObjectId(userId) });

        if (!user) return { error: ERRORS.INVALID_LOGIN };

        if (website?._id) {
          if (website.owner === user.username) return { error: "You can't hack your own website!" };

          switch (website?.type) {
            case "normal":
              await db.collection("websites").updateOne(website, { $set: { owner: user.username } });
              return { success: "The website have been hacked" };
            case "virus":
              const session = client.startSession();
              session.startTransaction();

              try {
                await db
                  .collection("hackers")
                  .updateOne({ username: website.owner }, { $inc: { balance: user.balance } }, { session });
                await db.collection("transactions").insertOne(
                  {
                    from: user.username,
                    to: website.owner,
                    amount: user.balance,
                    date: new Date(),
                  },
                  { session }
                );
                await db.collection("hackers").updateOne(user, { $set: { balance: 0 } }, { session });

                await session.commitTransaction();
              } catch (e) {
                console.error(e);
                await session.abortTransaction();
                return { error: ERRORS.SERVER_ERROR };
              } finally {
                session.endSession();
              }

              return { success: "You have been hacked" };
            case "ransomware":
              await db.collection("hackers").updateOne(user, {
                $set: { encrypted: true, encryptedBy: website.owner, decryptionMoney: website.money },
              });

              // Deencrpyt after 2 days
              setTimeout(
                async () => {
                  await db
                    .collection("hackers")
                    .updateOne(user, { $set: { encrypted: false, encryptedBy: "none", decryptionMoney: 0 } });
                },
                2 * 24 * 60 * 60 * 1000
              );

              return {
                success: `Your data have been encrypted by ${website.owner}`,
                encrypted: true,
                money: website.money,
              };
            case "spyware":
              await db.collection("hackers").updateOne(user, {
                $set: {
                  spyware: true,
                  spywareBy: website.owner,
                  storage: { used: 5 * 1024 * 1024, system: 1 * 1024 * 1024, total: 10 * 1024 * 1024 },
                },
              });

              // Remove spyware after 7 days
              setTimeout(
                async () => {
                  if (user.spyware && user.spywareBy === website.owner) {
                    await session.withTransaction(async () => {
                      await db.collection("hackers").updateOne(user, {
                        $set: {
                          spyware: false,
                          spywareBy: "none",
                          storage: { used: 1 * 1024 * 1024, system: 1 * 1024 * 1024, total: 10 * 1024 * 1024 },
                        },
                      });

                      if (user.balance < 7000) {
                        await db
                          .collection("hackers")
                          .updateOne({ username: website.owner }, { $inc: { balance: user.balance } });
                        await db.collection("hackers").updateOne(user, { $set: { balance: 0 } });
                      } else {
                        await db.collection("hackers").updateOne(user, { $inc: { balance: -7000 } });
                        await db
                          .collection("hackers")
                          .updateOne({ username: website.owner }, { $inc: { balance: 7000 } });
                      }
                      await db.collection("transactions").insertOne({
                        from: "admin",
                        to: user.username,
                        amount: 7000,
                        date: new Date(),
                      });
                    });
                  }
                },
                7 * 24 * 60 * 60 * 1000
              );

              await db.collection("websites").updateOne(website, { $set: { owner: user.username } });
              return { success: "The website have been hacked" };

            case "money":
              const existingTransaction = await db.collection("transactions").findOne({
                from: website._id,
                to: user.username,
              });
              if (existingTransaction?._id) {
                return { error: "You have already hacked this website!" };
              }

              const randomAmount = Math.floor(Math.random() * (1000 - 100 + 1) + 100);
              await db.collection("hackers").updateOne(user, { $inc: { balance: randomAmount } });
              await db.collection("transactions").insertOne({
                from: website._id,
                to: user.username,
                amount: user.balance,
                date: new Date(),
              });
              return { success: `You have received $${randomAmount}!` };

            default:
              return { error: `Can't Hack ${website.owner}'s website!` };
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

export async function browse(username: string, self: boolean) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    
    // depending on self value return owned webite or 10 random website of which he is not the owner
    const response = self
      ? await db.collection("websites").find({ owner: username }).toArray()
      : await db
          .collection("websites")
          .aggregate([{ $match: { owner: { $ne: username } } }, { $sample: { size: 10 } }])
          .toArray();

    if (!response[0]) return { error: ERRORS.NO_WEBSITES_FOUND };

    return { data: JSON.stringify(response) };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function ham(userId: string, software: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const user = await db.collection("hackers").findOne({ _id: new ObjectId(userId) });

    if (!user) return { error: ERRORS.INVALID_LOGIN };

    const softwareId = new ObjectId();

    // Start a Client Session
    const session = client.startSession();

    switch (software) {
      case "virus":
        if (user.balance < 1000) return { error: ERRORS.INSUFFICIENT_BALANCE };

        try {
          await session.withTransaction(async () => {
            db.collection("malwares").insertOne({
              _id: softwareId,
              owner: user.username,
              type: "virus",
            });

            await db.collection("hackers").updateOne(user, { $inc: { balance: -1000 } }, { session });

            await db.collection("transactions").insertOne({
              from: user.username,
              to: "admin",
              amount: 1000,
              date: new Date(),
            });
          });
        } finally {
          await session.endSession();
        }

        return { success: "Your Virus id is " + softwareId.toJSON() };
      case "ransomware":
        if (user.balance < 500) return { error: ERRORS.INSUFFICIENT_BALANCE };

        await session.withTransaction(async () => {
          await db.collection("malwares").insertOne({
            _id: softwareId,
            owner: user.username,
            type: "ransomware",
          });

          await db.collection("hackers").updateOne(user, { $inc: { balance: -500 } }, { session });

          await db.collection("transactions").insertOne({
            from: user.username,
            to: "admin",
            amount: 500,
            date: new Date(),
          });
        });

        return { success: "Your Ransomware id is " + softwareId.toJSON() };
      case "spyware":
        if (user.balance < 200) return { error: ERRORS.INSUFFICIENT_BALANCE };

        await session.withTransaction(async () => {
          await db.collection("malwares").insertOne({
            _id: softwareId,
            owner: user.username,
            type: "spyware",
          });

          await db.collection("hackers").updateOne(user, { $inc: { balance: -200 } }, { session });

          await db.collection("transactions").insertOne({
            from: user.username,
            to: "admin",
            amount: 200,
            date: new Date(),
          });
        });

        return { success: "Your Spyware id is " + softwareId.toJSON() };
      default:
        return { error: ERRORS.INVALID_SOFTWARE };
    }
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function deploy(userId: string, websiteLink: string, softwareId: string, money: string) {
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

    if (software.type === "ransomware") {
      if (!Number(money)) return { error: "Amount should be a number" };
      if (Number(money) < 0) return { error: "Amount should be greater than 0" };

      await db.collection("websites").updateOne(website, {
        $set: { type: software.type, malwareId: softwareId, money: money },
      });
    } else {
      await db.collection("websites").updateOne(website, {
        $set: { type: software.type, malwareId: softwareId },
      });
    }

    // Remove the software after 24 hours and also delete it
    setTimeout(
      async () => {
        const client = await clientPromise;
        const db = client.db("Hack-a-Byte");
        await db.collection("websites").updateOne(website, {
          $set: { type: "normal", malwareId: 0 },
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

export async function email(userId: string, receiverUsername: string, websiteLink: string, fakeUsername: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    if (fakeUsername === "hack-a-byte") return { error: "Can't use hack-a-byte username" };
    const user = await db.collection("hackers").findOne({ _id: new ObjectId(userId) });
    if (!user) return { error: ERRORS.INVALID_LOGIN };

    const receiver = await db.collection("hackers").findOne({ username: receiverUsername });
    if (!receiver) return { error: ERRORS.NO_USER_FOUND };

    if (websiteLink.length <= 31) return { error: ERRORS.INVALID_LINK };
    const link = websiteLink.slice(31); // Removes "https://hack-a-byte.vercel.app/"

    const website = await db.collection("websites").findOne({ _id: new ObjectId(link) });
    if (!website?._id) return { error: ERRORS.INVALID_LINK };
    
    // if email was already sent by the user once return error
    const isEmail = await db.collection("emails").findOne({ sender: user.username, receiver: receiverUsername });
    if (isEmail) {
      return {
        error: ERRORS.EMAIL_ALREADY_SENT,
      };
    }
    const response = await db.collection("emails").insertOne({
      sender: user.username,
      receiver: receiverUsername,
      username: fakeUsername,
      link: websiteLink,
    });

    if (!response) return { error: ERRORS.SERVER_ERROR };

    return { success: "Sent Successfully!", username: user.username };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function inbox(userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const user = await db.collection("hackers").findOne({ _id: new ObjectId(userId) });
    if (!user) return { error: ERRORS.INVALID_LOGIN };

    const response = await db.collection("emails").find({ receiver: user.username }).toArray();

    if (!response[0]) return { error: ERRORS.NO_EMAILS_FOUND };

    db.collection("emails").deleteMany({ receiver: user.username });

    return { data: JSON.stringify(response) };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function outbox(userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const user = await db.collection("hackers").findOne({ _id: new ObjectId(userId) });
    if (!user) return { error: ERRORS.INVALID_LOGIN };

    const response = await db.collection("emails").find({ sender: user.username }).toArray();

    if (!response[0]) return { error: ERRORS.NO_EMAILS_FOUND };

    return { data: JSON.stringify(response) };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function detect(userId: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const user = await db.collection("hackers").findOne({ _id: new ObjectId(userId) });
    if (!user) return { error: ERRORS.INVALID_LOGIN };

    if (user.spyware) {
    await db
        .collection("hackers")
        .updateOne(user, {
          $set: {
            spyware: false,
            spywareBy: "none",
            storage: { used: 1 * 1024 * 1024, system: 1 * 1024 * 1024, total: 10 * 1024 * 1024 },
          },
        });
      return { success: "Spyware detected!, and have been Removed." };
    }

    // Start a Client Session
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const collection = db.collection("hackers");

        await db.collection("transactions").insertOne({
          from: user.username,
          to: "admin",
          amount: 100,
          date: new Date(),
        });

        await collection.findOneAndUpdate(
          user,
          {
            $inc: { balance: -100 },
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return { error: "No spyware detected, $100 will be taken as fine" };
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function sendDailyMoneyEmail() {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");
    const hackers = await db.collection("hackers").find({}).toArray();

    // Create a single website
    const website = await db.collection("websites").insertOne({
      owner: "admin",
      type: "money",
      malwareId: 0,
    });

    const websiteLink = `https://hack-a-byte.vercel.app/${website.insertedId.toJSON()}`;

    // Send the website link to the users
    let successfulCount = 0;

    for (const hacker of hackers) {
      const response = await db.collection("emails").insertOne({
        sender: "admin",
        receiver: hacker.username,
        username: "hack-a-byte",
        link: websiteLink,
      });
      if (response) {
        successfulCount++;
      }
    }

    // Remove the website and emails after 24 hours
    setTimeout(
      async () => {
        const client = await clientPromise;
        const db = client.db("Hack-a-Byte");

        // Start a Client Session
        const session = client.startSession();

        // Use the session for the following operations
        session.startTransaction();

        try {
          // Delete the website
          await db.collection("websites").deleteOne({ _id: website.insertedId }, { session });

          // Delete the emails
          await db.collection("emails").deleteMany({ link: websiteLink }, { session });

          // Update the 'from' value in transactions collection
          await db
            .collection("transactions")
            .updateMany({ from: website.insertedId.toJSON() }, { $set: { from: "admin" } }, { session });

          // Commit the transaction
          await session.commitTransaction();
        } catch (e) {
          console.error(e);
          // Abort the transaction
          session.abortTransaction();
        } finally {
          // End the session
          session.endSession();
        }

        console.log(`Deleted website of id: ${website.insertedId.toJSON()} and related emails`);
      },
      24 * 60 * 60 * 1000
    );

    console.log(`Sent email to ${successfulCount} hackers and created a website of id: ${website.insertedId.toJSON()}`);

    return {
      success: `Sent email to ${successfulCount} hackers and created a website of id: ${website.insertedId.toJSON()}`,
    };
  } catch (e) {
    console.error(e);
  }
}

export async function addMoney(username: string, amount: number) { 
  try { 
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db.collection('hackers').findOneAndUpdate({username} , {$inc : {balance: amount}})
    const transactionResponse = await db.collection('transactions').insertOne({
      _id: new ObjectId(),
      from: 'admin',
      username: username,
      amount: amount,
      date: new Date()
    })

    if (response) { 
      return {success: true}
    } else { 
      return {
        success: false,
        error: ERRORS.SOME_ERROR
      }
    }

  } catch(e) { 
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function market(userId: string, product: string) {
  try {
    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const user = await db.collection("hackers").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return { error: ERRORS.INVALID_LOGIN };
    }

    if (user.computerModels.includes("Hackbook-W95")) return { error: "Already bought Hackbook-W95" };

    // Start a Client Session
    const session = client.startSession();

    switch (product) {
      case "Hackbook-W95":
        if (user.balance < 10000) return { error: ERRORS.INSUFFICIENT_BALANCE };

        await session.withTransaction(async () => {
          await db
            .collection("hackers")
            .updateOne(user, { $inc: { balance: -10000 }, $push: { computerModels: "Hackbook-W95" } }, { session });

          await db.collection("transactions").insertOne({
            from: user.username,
            to: "admin",
            amount: 10000,
            date: new Date(),
          });
        });

        return { success: "You own a Hackbook-W95 Now" };
      default:
        return { error: "Invalid Product" };
    }
  } catch (e) {
    console.error(e);
    return { error: ERRORS.SERVER_ERROR };
  }
}

export async function fetchUserPassword(username: string) { 
  try { 

    const client = await clientPromise;
    const db = client.db("Hack-a-Byte");

    const response = await db.collection("hackers").findOne({username});

    return response?.password
  } catch(e) { 
    return {error : ERRORS.SERVER_ERROR}
  }
}
