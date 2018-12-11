const bcrypt = require("bcrypt");

const mongoCollections = require("../config/mongoCollections");
const users = mongoCollections.users;
const uuid = require("node-uuid");

// async function getUserByUn(un) {
//   const userCollection = await users();
//   const user = await userCollection.findOne({'profile.username': un});

//   if (!user) throw "This doesn't work/User not found";
//   return user;
// }

let exportedMethods = {
  // Gabby's original methods
  async getUserByUn(un) {
    const userCollection = await users();
    const user = await userCollection.findOne({'profile.username': un});

    if (!user) throw "This doesn't work/User not found";
    return user;
  },
  async validate(un, pw) {

		const user = await this.getUserByUn(un);

		if (user == null) {
			throw("No user with that username");
		}
		
		if (await bcrypt.compare(pw, user.hashedPassword) === true) {
			return true;
		} else {
			return false;
		}
  },
  async addSession(un, sid) {
		try {
      let user = await this.getUserByUn(un);
      
      user.sessionIds.push(sid);
      this.updateUser(user._id,user);
		} catch (e) {
			throw("No user with that username");
		}
		return true;
  },
  async getUserBySession(sid) {
    const userCollection = await users();
    const jordan = await this.getUserByUn("vrjordant");
    console.log(sid);
    const user = await userCollection.findOne({sessionIds: { $all: [sid]}});

    if (!user) throw "User not found";
    return user;
	},
  // David's methods
  getAllUsers() {
    return users().then(userCollection => {
      return userCollection.find({}).toArray();
    });
  },
  // This is a fun new syntax that was brought forth in ES6, where we can define
  // methods on an object with this shorthand!

  async getUserById(id) {
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: id });

    if (!user) throw "User not found";
    return user;
  },
  async addUser(username, name, hashedPassword, local, state, region) {
    if (typeof hashedPassword !== "string") throw "No hashed password provided";
    if (typeof name !== "string") throw "No name provided!";
    if (typeof username !== "string") throw "No username provided!";
    if (typeof local !== "string") throw "No local area provided!";
    if (typeof state !== "string") throw "No state provided!";
    if (typeof region !== "string") throw "No region provided!";

    const usersCollection = await users();

    /**
     * TODO: make a function that makes sure username is unique
     */

    const newUser = {
      _id: uuid.v4(),
      hashedPassword: hashedPassword,
      profile: {
        name: name,
        username: username,
        local: local,
        state: state,
        region: region,
      },
      allUploads: [],
      sessionIds: []
    };

    const newInsertInformation = await usersCollection.insertOne(newUser);
    const newId = newInsertInformation.insertedId;
    // Ya gotta change this in your branch
    return await this.getUserById(newId);
  },
  async removeUserById(id) {
    const userCollection = await users();
    const deletionInfo = await userCollection.removeOne({ _id: id });
    if (deletionInfo.deletedCount === 0) {
      throw `Could not delete post with id of ${id}`;
    }
  },
  async removeUserByUsername(username) {
    const userCollection = await users();
    const deletionInfo = await userCollection.removeOne({ username: username });
    if (deletionInfo.deletedCount === 0) {
      throw `Could not delete post with username of ${username}`;
    }
  },
  async updateUser(id, updatedUser) {
    const userCollection = await users();

    const updatedUserData = {};

    if (updatedUser.hashedPassword) {
      updatedUserData.hashedPassword = updatedUser.hashedPassword;
    }

    if (updatedUser.profile) {
      updatedUserData.profile = updatedUser.profile;
    }

    if (updatedUser.sessionIds) {
      updatedUserData.sessionIds = updatedUser.sessionIds;
    }

    let updateCommand = {
      $set: updatedUserData
    };
    const query = {
      _id: id
    };
    await userCollection.updateOne(query, updateCommand);

    return await this.getUserById(id);
  }
};

module.exports = exportedMethods;
