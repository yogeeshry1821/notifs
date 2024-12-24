import mongoose, { Schema, Document } from 'mongoose';

// Interface for Notification
export interface INotification extends Document {
  message: string;
  userId: string;
  timestamp: Date;
}

// Schema Definition
const NotificationSchema: Schema = new Schema({
  message: { type: String, required: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
