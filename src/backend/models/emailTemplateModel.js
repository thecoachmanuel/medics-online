import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true }, // HTML text with placeholders
    description: { type: String, default: '' },
    variables: { type: [String], default: [] } // List of supported placeholder names
  },
  { minimize: false }
);

const emailTemplateModel = mongoose.models.emailTemplate || mongoose.model('emailTemplate', emailTemplateSchema);
export default emailTemplateModel;
