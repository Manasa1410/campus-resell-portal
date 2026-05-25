import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    file: { // For images/files (future enhancement)
      type: String,
    },
    status: { // Message status: sent, delivered, seen
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
    },
    readBy: [ // Users who have seen this message
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDeletedForEveryone: { // If true, message content is hidden for all
      type: Boolean,
      default: false,
    },
    deletedFor: [ // Array of user IDs for whom this message is deleted (soft delete for me)
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    edited: { // To indicate if message was edited (future enhancement)
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;