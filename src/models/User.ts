import mongoose from "mongoose";
import bcrypt from "bcrypt-nodejs";
import { BCRYPT_ROUNDS } from "../constants/bcrypt";
import { IUser } from "../interfaces/User";

export interface IUserModel extends IUser, mongoose.Document {
  comparePasswords: comparePasswordsFunction;
}

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
});

export type comparePasswordsFunction = (passwordToCheck: string) => Promise<{}>;

const comparePasswords: comparePasswordsFunction = async function (passwordToCheck) {
  const user = this;

  return new Promise((resolve, reject) => {
    bcrypt.compare(passwordToCheck, user.password, (err, res) => {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    });
  });
};

userSchema.methods.comparePasswords = comparePasswords;

userSchema.pre("save", async function save(next: Function) {
  const user = this;

  if (!user.isModified("password")) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    const hash = bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

const User = mongoose.model<IUserModel>("User", userSchema);
export default User;
