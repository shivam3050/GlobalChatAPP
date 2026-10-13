import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({

  senderUsername: {
    type: String,
    required: true
  },
  receiverUsername: {
    type: String,
    required: true
  },
  content: {
    type: String,
    // required: true
  },
  createdAt: {
    type: Number,
    // required: true
  },
  isLink: {
    type: Boolean,
    default: false
  },
  fileSize: {
    type: Number, 
    default: 0
  }
},
//  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
