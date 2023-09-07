import {
  Ref,
  getModelForClass,
  modelOptions,
  pre,
  prop,
} from "@typegoose/typegoose";
import { User } from "./user.model";

@pre<Doc>("save", function (next) {
  this.id = this._id;
  next();
})
@modelOptions({
  schemaOptions: {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
})
export class Doc {
  @prop({ unique: true })
  id: string;

  @prop({ required: true })
  title: string;

  @prop({ required: true })
  url: string;

  @prop()
  size: number;

  @prop({ required: true, ref: () => User })
  user: Ref<User>;
}

const docModel = getModelForClass(Doc);
export default docModel;
