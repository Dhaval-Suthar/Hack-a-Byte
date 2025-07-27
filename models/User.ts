import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  isAuthenticated: boolean;
  isMentor: boolean;
  isAdmin: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String 
    },
    isAuthenticated: { 
      type: Boolean, 
      default: false 
    },
    isMentor: { 
      type: Boolean, 
      default: false 
    },
    isAdmin: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
