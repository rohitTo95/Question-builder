import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  profile_img?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    profile_img: {
      type: String,
      default: "",
    },
  },
  { 
    collection: "users",
    timestamps: true // This automatically adds createdAt and updatedAt
  }
);

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Compare entered password with stored hash
UserSchema.methods.comparePassword = async function (
  userInputPassword: string
): Promise<boolean> {
  return bcrypt.compare(userInputPassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);